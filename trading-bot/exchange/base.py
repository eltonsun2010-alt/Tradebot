"""Shared execution data types and the broker interface.

These dataclasses (:class:`Order`, :class:`Position`, :class:`Trade`) are the
common vocabulary shared by the backtester, the paper broker and the live
broker so results are directly comparable across all three.
"""

from __future__ import annotations

import abc
import enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from strategy.signals import Side


class OrderSide(enum.Enum):
    """Direction of an order."""

    BUY = "buy"
    SELL = "sell"


@dataclass
class Order:
    """A market order request/acknowledgement."""

    side: OrderSide
    size: float
    price: float
    timestamp: datetime
    order_id: str = ""
    filled: bool = False
    fill_price: float = 0.0
    commission: float = 0.0


@dataclass
class Position:
    """An open position and its live trade-management state."""

    side: Side
    size: float
    entry_price: float
    entry_time: datetime
    stop_loss: float
    take_profit: float
    entry_atr: float
    #: Best price seen since entry (for the trailing stop).
    extreme_price: float = 0.0
    #: Commission already paid on the entry fill.
    entry_commission: float = 0.0

    def __post_init__(self) -> None:
        if self.extreme_price == 0.0:
            self.extreme_price = self.entry_price

    def unrealised_pnl(self, price: float) -> float:
        """Return the mark-to-market P&L at *price* (excluding fees)."""

        direction = 1 if self.side is Side.LONG else -1
        return (price - self.entry_price) * direction * self.size

    def notional(self, price: float) -> float:
        """Return the position notional at *price*."""

        return abs(self.size) * price


@dataclass
class Trade:
    """A completed round-trip trade, recorded for reporting."""

    side: Side
    size: float
    entry_time: datetime
    entry_price: float
    exit_time: datetime
    exit_price: float
    #: Net profit after all commissions.
    pnl: float
    #: Gross profit before commissions.
    gross_pnl: float
    commission: float
    reason: str
    #: Account equity immediately after the trade closed.
    equity_after: float = 0.0

    @property
    def return_pct(self) -> float:
        """Return the trade's return relative to its entry notional."""

        denom = abs(self.size) * self.entry_price
        return self.pnl / denom if denom else 0.0

    @property
    def holding_period(self):
        """Return the trade duration as a ``timedelta``."""

        return self.exit_time - self.entry_time

    @property
    def is_win(self) -> bool:
        """Return ``True`` when the trade closed profitably."""

        return self.pnl > 0


class Broker(abc.ABC):
    """Abstract broker interface implemented by paper and live brokers."""

    @abc.abstractmethod
    def get_balance(self) -> float:
        """Return the current cash/free balance."""

    @abc.abstractmethod
    def get_equity(self, mark_price: float) -> float:
        """Return total equity (balance + unrealised P&L) at *mark_price*."""

    @abc.abstractmethod
    def get_position(self) -> Optional[Position]:
        """Return the open position, or ``None`` when flat."""

    @abc.abstractmethod
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
        """Open a new position and return it."""

    @abc.abstractmethod
    def close_position(
        self,
        price: float,
        timestamp: datetime,
        reason: str,
    ) -> Optional[Trade]:
        """Close the open position and return the resulting :class:`Trade`."""
