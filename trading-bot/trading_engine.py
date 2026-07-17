"""Real-time trading engine shared by paper and live modes.

The engine processes candles one at a time as they arrive, applying the exact
same strategy, filter and risk logic as the backtester. It is broker-agnostic:
give it a :class:`PaperBroker` for paper trading or a ``CCXTBroker`` for live
trading and the behaviour is identical apart from where the fills happen.
"""

from __future__ import annotations

from typing import Optional

import pandas as pd

from bot_logging import get_logger
from config import Config
from exchange.base import Broker, Trade
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


class TradingEngine:
    """Stateful engine that reacts to a rolling window of candles.

    On each new closed candle, call :meth:`on_candles` with the full recent
    history (indicators are recomputed each call so the engine stays stateless
    with respect to indicator warm-up). The engine manages exactly one
    position through the given broker.
    """

    def __init__(self, config: Config, broker: Broker) -> None:
        """Create the engine.

        Args:
            config: Full configuration.
            broker: Any concrete broker (paper or live).
        """

        self.config = config
        self.broker = broker
        self.risk = RiskManager(config.risk)
        self._log = get_logger("engine", config.logging)
        self._started = False

    def on_candles(self, candles: pd.DataFrame) -> Optional[Trade]:
        """Process the most recent candle in *candles*.

        Args:
            candles: Recent OHLCV history ending with the just-closed candle.
                Must contain enough candles for the indicators to warm up.

        Returns:
            The :class:`Trade` if a position was closed on this candle,
            otherwise ``None``.
        """

        if len(candles) < 2:
            return None

        df = add_indicators(candles, self.config.indicators)
        df = add_filter_columns(df, self.config.filters)
        df = add_signal_columns(df, self.config.strategy)

        row = df.iloc[-1]
        prev = df.iloc[-2]
        ts = df.index[-1]
        price = float(row["close"])

        equity = self.broker.get_equity(price)
        if not self._started:
            self.risk.start_day(ts.date(), equity)
            self._started = True
        else:
            self.risk.on_new_candle(ts.date(), equity)

        position = self.broker.get_position()
        if position is not None:
            high = float(row["high"])
            low = float(row["low"])
            exit_res = check_exit(
                position.side,
                position.stop_loss,
                position.take_profit,
                high,
                low,
            )
            if exit_res.exited:
                trade = self.broker.close_position(exit_res.price, ts, exit_res.reason)
                if trade is not None:
                    self.risk.register_trade_result(trade.pnl, self.broker.get_balance())
                    self._log.info(
                        "CLOSE %s pnl=%.2f reason=%s", trade.side.name, trade.pnl,
                        trade.reason,
                    )
                return trade

            # Advance trailing stop for the next candle.
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
                self.config.strategy,
            )
            return None

        # Flat: consider a new entry.
        if not self.risk.can_trade():
            return None
        filt = apply_filters(row, self.config.filters, spread_pct=self.config.costs.spread)
        if not filt.allowed:
            return None
        signal = generate_signal(row, prev, self.config.strategy)
        side = signal.side
        if side is None or signal.atr <= 0:
            return None

        stop, take = compute_stops(signal.price, signal.atr, side, self.config.strategy)
        size = self.risk.position_size(equity, signal.price, stop)
        if size <= 0:
            return None

        self.broker.open_position(side, size, signal.price, ts, stop, take, signal.atr)
        self._log.info(
            "OPEN %s size=%.6f @ %.2f stop=%.2f tp=%.2f", side.name, size,
            signal.price, stop, take,
        )
        return None
