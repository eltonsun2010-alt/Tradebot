"""Paper-trading broker.

Simulates order execution against a cash balance with realistic frictions:
commission, slippage and a half-spread on every fill. It maintains a single
open position, a running balance and a trade history — the same surface the
live broker exposes — so strategies can be validated with zero risk before any
real capital is deployed.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from config import CostConfig
from exchange.base import Broker, Position, Trade
from strategy.signals import Side


class PaperBroker(Broker):
    """An in-memory simulated broker holding at most one position at a time."""

    def __init__(self, initial_balance: float, costs: CostConfig) -> None:
        """Create a paper broker.

        Args:
            initial_balance: Starting cash balance.
            costs: Commission / slippage / spread assumptions.
        """

        self._balance = float(initial_balance)
        self._costs = costs
        self._position: Optional[Position] = None
        self._trades: List[Trade] = []
        self._order_counter = 0

    # ------------------------------------------------------------------
    # Fill modelling
    # ------------------------------------------------------------------
    def _fill_price(self, price: float, side: Side, opening: bool) -> float:
        """Return the effective fill price after slippage and half-spread.

        Buys (opening a long or closing a short) pay up; sells receive less.
        """

        buying = (opening and side is Side.LONG) or (
            not opening and side is Side.SHORT
        )
        friction = self._costs.slippage + self._costs.spread
        if buying:
            return price * (1.0 + friction)
        return price * (1.0 - friction)

    def _commission(self, notional: float) -> float:
        """Return the commission charged on a fill of *notional* value."""

        return notional * self._costs.commission

    # ------------------------------------------------------------------
    # Broker interface
    # ------------------------------------------------------------------
    def get_balance(self) -> float:
        return self._balance

    def get_equity(self, mark_price: float) -> float:
        equity = self._balance
        if self._position is not None:
            equity += self._position.unrealised_pnl(mark_price)
        return equity

    def get_position(self) -> Optional[Position]:
        return self._position

    @property
    def trades(self) -> List[Trade]:
        """Return the list of completed trades."""

        return self._trades

    def open_position(
        self,
        side: Side,
        size: float,
        price: float,
        timestamp: datetime,
        stop_loss: float,
        take_profit: float,
        atr_value: float,
    ) -> Position:
        if self._position is not None:
            raise RuntimeError("Cannot open a position while one is already open")
        if size <= 0:
            raise ValueError("Position size must be positive")

        fill = self._fill_price(price, side, opening=True)
        commission = self._commission(size * fill)
        self._balance -= commission

        self._order_counter += 1
        self._position = Position(
            side=side,
            size=size,
            entry_price=fill,
            entry_time=timestamp,
            stop_loss=stop_loss,
            take_profit=take_profit,
            entry_atr=atr_value,
            extreme_price=fill,
            entry_commission=commission,
        )
        return self._position

    def close_position(
        self,
        price: float,
        timestamp: datetime,
        reason: str,
    ) -> Optional[Trade]:
        if self._position is None:
            return None

        pos = self._position
        fill = self._fill_price(price, pos.side, opening=False)
        exit_commission = self._commission(pos.size * fill)

        gross = pos.unrealised_pnl(fill)
        total_commission = pos.entry_commission + exit_commission
        net = gross - exit_commission  # entry commission already deducted
        self._balance += net

        trade = Trade(
            side=pos.side,
            size=pos.size,
            entry_time=pos.entry_time,
            entry_price=pos.entry_price,
            exit_time=timestamp,
            exit_price=fill,
            pnl=gross - total_commission,
            gross_pnl=gross,
            commission=total_commission,
            reason=reason,
            equity_after=self._balance,
        )
        self._trades.append(trade)
        self._position = None
        return trade
