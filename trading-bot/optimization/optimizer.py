"""Grid search and walk-forward optimization.

Walk-forward optimization guards against overfitting: parameters are chosen on
an in-sample (training) window and then evaluated on the *following*
out-of-sample window that had no influence on the choice. Aggregating the
out-of-sample results across many rolling windows gives an honest estimate of
live performance.
"""

from __future__ import annotations

import itertools
from dataclasses import dataclass, field, replace
from typing import Dict, List, Optional

import pandas as pd

from backtesting.engine import Backtester
from backtesting.metrics import PerformanceReport, compute_metrics
from config import Config


@dataclass(frozen=True)
class ParameterSet:
    """A concrete set of tunable strategy parameters."""

    ema_fast: int
    ema_slow: int
    rsi_period: int
    rsi_oversold: float
    rsi_overbought: float
    atr_stop: float
    atr_take_profit: float

    def apply_to(self, config: Config) -> Config:
        """Return a copy of *config* with these parameters applied."""

        indicators = replace(
            config.indicators,
            ema_fast_period=self.ema_fast,
            ema_slow_period=self.ema_slow,
            rsi_period=self.rsi_period,
        )
        strategy = replace(
            config.strategy,
            rsi_oversold=self.rsi_oversold,
            rsi_overbought=self.rsi_overbought,
            atr_stop_multiplier=self.atr_stop,
            atr_take_profit_multiplier=self.atr_take_profit,
        )
        return replace(config, indicators=indicators, strategy=strategy)


def _iter_parameter_sets(config: Config) -> List[ParameterSet]:
    """Enumerate every valid parameter combination from the config grids."""

    opt = config.optimization
    combos = itertools.product(
        opt.ema_fast_grid,
        opt.ema_slow_grid,
        opt.rsi_period_grid,
        opt.rsi_oversold_grid,
        opt.rsi_overbought_grid,
        opt.atr_stop_grid,
        opt.atr_take_profit_grid,
    )
    sets: List[ParameterSet] = []
    for ef, es, rp, ro, rob, stp, tp in combos:
        # Skip nonsensical combinations early.
        if ef >= es or ro >= rob or stp >= tp:
            continue
        sets.append(
            ParameterSet(
                ema_fast=ef,
                ema_slow=es,
                rsi_period=rp,
                rsi_oversold=ro,
                rsi_overbought=rob,
                atr_stop=stp,
                atr_take_profit=tp,
            )
        )
    return sets


def _objective_value(report: PerformanceReport, objective: str) -> float:
    """Extract the optimization objective from a report, guarding against inf."""

    value = getattr(report, objective, 0.0)
    if value == float("inf"):
        return 1e9
    if value == float("-inf") or value != value:  # -inf or NaN
        return -1e9
    return float(value)


def evaluate(config: Config, candles: pd.DataFrame) -> PerformanceReport:
    """Backtest *config* over *candles* and return its performance report."""

    result = Backtester(config).run(candles)
    return compute_metrics(
        result.equity_curve,
        result.trades,
        config.backtest.initial_balance,
        config.backtest.periods_per_year,
        config.backtest.risk_free_rate,
    )


def grid_search(
    config: Config,
    candles: pd.DataFrame,
    objective: Optional[str] = None,
) -> tuple[ParameterSet, PerformanceReport, List[tuple[ParameterSet, float]]]:
    """Exhaustively search the parameter grid on *candles*.

    Args:
        config: Base configuration (its grids define the search space).
        candles: Candle history to optimise over.
        objective: Metric name to maximise; defaults to the configured one.

    Returns:
        ``(best_parameters, best_report, ranking)`` where ``ranking`` is the
        full list of ``(parameters, objective_value)`` sorted best-first.
    """

    objective = objective or config.optimization.objective
    scored: List[tuple[ParameterSet, float]] = []
    best: Optional[ParameterSet] = None
    best_report: Optional[PerformanceReport] = None
    best_value = float("-inf")

    for params in _iter_parameter_sets(config):
        candidate = params.apply_to(config)
        report = evaluate(candidate, candles)
        value = _objective_value(report, objective)
        # Require at least a few trades to trust the result.
        if report.num_trades < 3:
            value = -1e9
        scored.append((params, value))
        if value > best_value:
            best_value = value
            best = params
            best_report = report

    if best is None:
        raise ValueError("No valid parameter combinations were evaluated")

    scored.sort(key=lambda x: x[1], reverse=True)
    return best, best_report, scored


@dataclass
class WalkForwardResult:
    """Aggregated results of a walk-forward optimization run."""

    #: Best parameters chosen on each in-sample window.
    chosen_parameters: List[ParameterSet] = field(default_factory=list)
    #: Out-of-sample report for each window.
    oos_reports: List[PerformanceReport] = field(default_factory=list)
    #: Combined equity curve stitched from all out-of-sample windows.
    combined_equity: pd.Series = field(default_factory=lambda: pd.Series(dtype=float))
    #: Aggregate metrics over the stitched out-of-sample equity curve.
    aggregate: Optional[PerformanceReport] = None

    def summary(self) -> Dict[str, float]:
        """Return a compact summary of out-of-sample performance."""

        if self.aggregate is None:
            return {}
        return {
            "windows": len(self.oos_reports),
            "oos_return_pct": self.aggregate.total_return_pct,
            "oos_sharpe": self.aggregate.sharpe_ratio,
            "oos_max_drawdown_pct": self.aggregate.max_drawdown_pct,
            "oos_trades": self.aggregate.num_trades,
        }


def walk_forward(
    config: Config,
    candles: pd.DataFrame,
    objective: Optional[str] = None,
) -> WalkForwardResult:
    """Run rolling-window walk-forward optimization.

    Args:
        config: Base configuration; ``config.optimization.train_size`` and
            ``test_size`` control the window geometry.
        candles: Full candle history.
        objective: Metric to maximise in-sample; defaults to the configured one.

    Returns:
        A :class:`WalkForwardResult` aggregating the out-of-sample windows.
    """

    opt = config.optimization
    objective = objective or opt.objective
    train, test = opt.train_size, opt.test_size

    result = WalkForwardResult()
    oos_trades = []
    equity_segments: List[pd.Series] = []

    start = 0
    n = len(candles)
    while start + train + test <= n:
        train_slice = candles.iloc[start : start + train]
        test_slice = candles.iloc[start + train : start + train + test]

        best_params, _, _ = grid_search(config, train_slice, objective)
        tuned = best_params.apply_to(config)

        oos_result = Backtester(tuned).run(test_slice)
        oos_report = compute_metrics(
            oos_result.equity_curve,
            oos_result.trades,
            config.backtest.initial_balance,
            config.backtest.periods_per_year,
            config.backtest.risk_free_rate,
        )

        result.chosen_parameters.append(best_params)
        result.oos_reports.append(oos_report)
        oos_trades.extend(oos_result.trades)
        if not oos_result.equity_curve.empty:
            equity_segments.append(oos_result.equity_curve)

        start += test

    # Stitch the out-of-sample equity curves into one continuous curve by
    # chaining their returns onto a single running balance.
    if equity_segments:
        combined = _chain_equity(equity_segments, config.backtest.initial_balance)
        result.combined_equity = combined
        result.aggregate = compute_metrics(
            combined,
            oos_trades,
            config.backtest.initial_balance,
            config.backtest.periods_per_year,
            config.backtest.risk_free_rate,
        )

    return result


def _chain_equity(segments: List[pd.Series], initial_balance: float) -> pd.Series:
    """Chain per-window equity curves into one continuous compounded curve."""

    values: List[float] = []
    index: List[pd.Timestamp] = []
    running = initial_balance
    for seg in segments:
        if seg.empty:
            continue
        seg_returns = seg.pct_change().fillna(seg.iloc[0] / initial_balance - 1.0)
        for ts, r in seg_returns.items():
            running *= 1.0 + r
            values.append(running)
            index.append(ts)
    return pd.Series(values, index=pd.DatetimeIndex(index))
