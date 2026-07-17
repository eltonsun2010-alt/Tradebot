"""Event-driven backtesting engine.

The engine steps through candles one at a time, reusing the exact same
strategy, risk and filter logic as the live/paper trading path so backtest
results are representative. It records an equity curve and a full trade log
from which :mod:`backtesting.metrics` derives the performance report.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

import pandas as pd

from bot_logging import get_logger
from config import Config
from exchange.base import Trade
from exchange.paper import PaperBroker
from indicators.core import ATR, add_indicators
from risk.manager import RiskManager
from strategy.filters import add_filter_columns, apply_filters
from strategy.signals import (
    add_signal_columns,
    check_exit,
    compute_stops,
    generate_signal,
    update_trailing_stop,
)


@dataclass
class BacktestResult:
    """Container for the outputs of a backtest run."""

    equity_curve: pd.Series
    trades: List[Trade]
    #: The indicator-annotated candle data used for the run.
    data: pd.DataFrame
    #: Per-candle log of skipped-entry reasons, for diagnostics.
    skipped: dict = field(default_factory=dict)


class Backtester:
    """Runs a single backtest over a candle history."""

    def __init__(self, config: Config) -> None:
        """Create a backtester bound to *config*."""

        self.config = config
        self._log = get_logger("backtest", config.logging)

    def run(self, candles: pd.DataFrame) -> BacktestResult:
        """Backtest the strategy over *candles* and return the result.

        Args:
            candles: A validated OHLCV DataFrame.

        Returns:
            A :class:`BacktestResult` with the equity curve and trade log.
        """

        cfg = self.config
        df = add_indicators(candles, cfg.indicators)
        df = add_filter_columns(df, cfg.filters)
        df = add_signal_columns(df, cfg.strategy)

        broker = PaperBroker(cfg.backtest.initial_balance, cfg.costs)
        risk = RiskManager(cfg.risk)
        risk.start_day(df.index[0].date(), cfg.backtest.initial_balance)

        equity_times: List[pd.Timestamp] = []
        equity_values: List[float] = []
        skipped: dict = {}

        rows = list(df.itertuples(index=True))
        for i in range(1, len(rows)):
            row = df.iloc[i]
            prev = df.iloc[i - 1]
            ts = df.index[i]
            price = float(row["close"])

            equity = broker.get_equity(price)
            risk.on_new_candle(ts.date(), equity)

            position = broker.get_position()
            if position is not None:
                high = float(row["high"])
                low = float(row["low"])

                # 1) Test the existing stop / target against this candle.
                exit_res = check_exit(
                    position.side,
                    position.stop_loss,
                    position.take_profit,
                    high,
                    low,
                )
                if exit_res.exited:
                    trade = broker.close_position(exit_res.price, ts, exit_res.reason)
                    if trade is not None:
                        risk.register_trade_result(trade.pnl, broker.get_balance())
                        self._log.info(
                            "EXIT %s %s @ %.2f pnl=%.2f reason=%s",
                            trade.side.name,
                            f"{trade.size:.6f}",
                            trade.exit_price,
                            trade.pnl,
                            trade.reason,
                        )
                else:
                    # 2) Advance the trailing stop for the next candle.
                    if position.side.name == "LONG":
                        position.extreme_price = max(position.extreme_price, high)
                    else:
                        position.extreme_price = min(position.extreme_price, low)
                    position.stop_loss = update_trailing_stop(
                        position.side,
                        position.entry_price,
                        position.stop_loss,
                        position.extreme_price,
                        float(row[ATR]),
                        cfg.strategy,
                    )
            else:
                # Flat: consider a new entry.
                if risk.can_trade():
                    filt = apply_filters(row, cfg.filters, spread_pct=cfg.costs.spread)
                    if not filt.allowed:
                        skipped[ts] = filt.reason
                    else:
                        signal = generate_signal(row, prev, cfg.strategy)
                        side = signal.side
                        if side is not None and signal.atr > 0:
                            stop, take = compute_stops(
                                signal.price, signal.atr, side, cfg.strategy
                            )
                            size = risk.position_size(equity, signal.price, stop)
                            if size > 0:
                                broker.open_position(
                                    side, size, signal.price, ts, stop, take, signal.atr
                                )
                                self._log.info(
                                    "ENTRY %s %s @ %.2f stop=%.2f tp=%.2f",
                                    side.name,
                                    f"{size:.6f}",
                                    signal.price,
                                    stop,
                                    take,
                                )
                            else:
                                skipped[ts] = "position_size_zero"

            equity_times.append(ts)
            equity_values.append(broker.get_equity(price))

        # Close any still-open position at the last candle's close.
        if broker.get_position() is not None:
            last_ts = df.index[-1]
            last_price = float(df.iloc[-1]["close"])
            trade = broker.close_position(last_price, last_ts, "end_of_data")
            if trade is not None:
                risk.register_trade_result(trade.pnl, broker.get_balance())
            if equity_values:
                equity_values[-1] = broker.get_equity(last_price)

        equity_curve = pd.Series(equity_values, index=pd.DatetimeIndex(equity_times))
        return BacktestResult(
            equity_curve=equity_curve,
            trades=broker.trades,
            data=df,
            skipped=skipped,
        )
