"""Performance metric calculations for a completed backtest.

All metrics are derived from two inputs: the equity curve (a time-indexed
Series of account equity) and the list of completed :class:`Trade` objects.
"""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass, field
from typing import Dict, List

import numpy as np
import pandas as pd

from exchange.base import Trade


@dataclass
class PerformanceReport:
    """A full set of performance statistics for a backtest run."""

    initial_balance: float = 0.0
    final_equity: float = 0.0
    net_profit: float = 0.0
    total_return_pct: float = 0.0
    annualized_return_pct: float = 0.0

    num_trades: int = 0
    num_wins: int = 0
    num_losses: int = 0
    win_rate: float = 0.0

    avg_win: float = 0.0
    avg_loss: float = 0.0
    avg_trade: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0

    profit_factor: float = 0.0
    expectancy: float = 0.0
    risk_reward_ratio: float = 0.0

    max_drawdown_pct: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0

    best_winning_streak: int = 0
    worst_losing_streak: int = 0
    avg_holding_periods: float = 0.0

    monthly_returns: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Return the report as a plain dictionary."""

        return asdict(self)


def _streaks(trades: List[Trade]) -> tuple[int, int]:
    """Return ``(best_winning_streak, worst_losing_streak)``."""

    best_win = worst_loss = 0
    cur_win = cur_loss = 0
    for t in trades:
        if t.is_win:
            cur_win += 1
            cur_loss = 0
        else:
            cur_loss += 1
            cur_win = 0
        best_win = max(best_win, cur_win)
        worst_loss = max(worst_loss, cur_loss)
    return best_win, worst_loss


def _monthly_returns(equity: pd.Series) -> Dict[str, float]:
    """Return period-over-period returns bucketed by calendar month (percent)."""

    if equity.empty:
        return {}
    monthly = equity.resample("ME").last()
    pct = monthly.pct_change().dropna() * 100.0
    return {ts.strftime("%Y-%m"): round(float(v), 4) for ts, v in pct.items()}


def compute_metrics(
    equity_curve: pd.Series,
    trades: List[Trade],
    initial_balance: float,
    periods_per_year: int,
    risk_free_rate: float = 0.0,
) -> PerformanceReport:
    """Compute the full performance report.

    Args:
        equity_curve: Time-indexed equity Series sampled once per candle.
        trades: Completed trades.
        initial_balance: Starting account balance.
        periods_per_year: Candles per year, for annualisation.
        risk_free_rate: Annualised risk-free rate for Sharpe/Sortino.

    Returns:
        A populated :class:`PerformanceReport`.
    """

    report = PerformanceReport(initial_balance=initial_balance)

    final_equity = (
        float(equity_curve.iloc[-1]) if len(equity_curve) else initial_balance
    )
    report.final_equity = final_equity
    report.net_profit = final_equity - initial_balance
    report.total_return_pct = (
        (final_equity / initial_balance - 1.0) * 100.0 if initial_balance else 0.0
    )

    # --- Trade-level statistics ----------------------------------------
    report.num_trades = len(trades)
    if trades:
        wins = [t.pnl for t in trades if t.is_win]
        losses = [t.pnl for t in trades if not t.is_win]
        report.num_wins = len(wins)
        report.num_losses = len(losses)
        report.win_rate = len(wins) / len(trades) * 100.0
        report.avg_win = float(np.mean(wins)) if wins else 0.0
        report.avg_loss = float(np.mean(losses)) if losses else 0.0
        report.avg_trade = float(np.mean([t.pnl for t in trades]))
        report.largest_win = max((t.pnl for t in trades), default=0.0)
        report.largest_loss = min((t.pnl for t in trades), default=0.0)

        gross_profit = sum(wins)
        gross_loss = abs(sum(losses))
        report.profit_factor = (
            gross_profit / gross_loss if gross_loss > 0 else math.inf
        )
        win_rate_frac = report.win_rate / 100.0
        report.expectancy = (
            win_rate_frac * report.avg_win
            + (1.0 - win_rate_frac) * report.avg_loss
        )
        report.risk_reward_ratio = (
            report.avg_win / abs(report.avg_loss) if report.avg_loss != 0 else math.inf
        )
        report.best_winning_streak, report.worst_losing_streak = _streaks(trades)
        report.avg_holding_periods = float(
            np.mean([_holding_periods(t, equity_curve) for t in trades])
        )

    # --- Equity-curve statistics ---------------------------------------
    if len(equity_curve) > 1:
        running_max = equity_curve.cummax()
        drawdown = (equity_curve - running_max) / running_max
        report.max_drawdown_pct = float(drawdown.min()) * 100.0

        returns = equity_curve.pct_change().dropna()
        report.sharpe_ratio = _sharpe(returns, periods_per_year, risk_free_rate)
        report.sortino_ratio = _sortino(returns, periods_per_year, risk_free_rate)

        years = len(equity_curve) / periods_per_year
        if years > 0 and final_equity > 0 and initial_balance > 0:
            report.annualized_return_pct = (
                (final_equity / initial_balance) ** (1.0 / years) - 1.0
            ) * 100.0

    report.monthly_returns = _monthly_returns(equity_curve)
    return report


def _holding_periods(trade: Trade, equity_curve: pd.Series) -> float:
    """Return a trade's holding time measured in candle periods."""

    if len(equity_curve) < 2:
        return 0.0
    step = equity_curve.index[1] - equity_curve.index[0]
    if step.total_seconds() == 0:
        return 0.0
    return trade.holding_period.total_seconds() / step.total_seconds()


def _sharpe(returns: pd.Series, periods_per_year: int, rf: float) -> float:
    """Return the annualised Sharpe ratio of *returns*."""

    if returns.empty or returns.std(ddof=0) == 0:
        return 0.0
    rf_per_period = rf / periods_per_year
    excess = returns - rf_per_period
    return float(excess.mean() / returns.std(ddof=0) * math.sqrt(periods_per_year))


def _sortino(returns: pd.Series, periods_per_year: int, rf: float) -> float:
    """Return the annualised Sortino ratio of *returns*."""

    if returns.empty:
        return 0.0
    rf_per_period = rf / periods_per_year
    excess = returns - rf_per_period
    downside = excess[excess < 0]
    downside_std = math.sqrt((downside**2).mean()) if len(downside) else 0.0
    if downside_std == 0:
        return 0.0
    return float(excess.mean() / downside_std * math.sqrt(periods_per_year))
