"""Risk manager: position sizing and trading-halt rules.

The :class:`RiskManager` is responsible for two things:

1. Converting a desired trade (entry price + stop price) into a position size
   that risks no more than ``risk_per_trade`` of current equity, while
   respecting the leverage cap.
2. Enforcing the circuit breakers — maximum daily loss and maximum consecutive
   losses — that pause trading to prevent revenge trading.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Optional

from config import RiskConfig


@dataclass
class RiskState:
    """Mutable state tracked across trades for the circuit breakers."""

    #: Equity recorded at the start of the current trading day.
    day_start_equity: float = 0.0
    #: The day the above equity snapshot belongs to.
    current_day: Optional[date] = None
    #: Realised P&L accumulated during the current day.
    daily_pnl: float = 0.0
    #: Count of consecutive losing trades.
    consecutive_losses: int = 0
    #: ``True`` when trading is paused for the remainder of the day.
    halted: bool = False
    halt_reason: str = ""


@dataclass
class RiskManager:
    """Enforces money-management and circuit-breaker rules."""

    config: RiskConfig
    state: RiskState = field(default_factory=RiskState)

    # ------------------------------------------------------------------
    # Position sizing
    # ------------------------------------------------------------------
    def position_size(
        self,
        equity: float,
        entry_price: float,
        stop_price: float,
    ) -> float:
        """Return the position size (in base units) for a trade.

        Size is chosen so that being stopped out loses exactly
        ``risk_per_trade`` of *equity*, then capped so the notional does not
        exceed ``max_leverage * equity``.

        Args:
            equity: Current account equity.
            entry_price: Intended entry price.
            stop_price: Intended stop-loss price.

        Returns:
            The position size, or ``0.0`` when the trade is not viable (zero
            stop distance, non-positive equity, or size below the minimum).
        """

        if equity <= 0 or entry_price <= 0:
            return 0.0

        stop_distance = abs(entry_price - stop_price)
        if stop_distance <= 0:
            return 0.0

        risk_amount = equity * self.config.risk_per_trade
        size = risk_amount / stop_distance

        # Cap by leverage: notional = size * entry_price <= max_leverage * equity
        max_notional = self.config.max_leverage * equity
        max_size = max_notional / entry_price
        size = min(size, max_size)

        if size < self.config.min_position_size:
            return 0.0
        return size

    # ------------------------------------------------------------------
    # Circuit breakers
    # ------------------------------------------------------------------
    def start_day(self, day: date, equity: float) -> None:
        """Reset the daily counters at the start of a new trading day."""

        self.state.current_day = day
        self.state.day_start_equity = equity
        self.state.daily_pnl = 0.0
        self.state.halted = False
        self.state.halt_reason = ""

    def on_new_candle(self, day: date, equity: float) -> None:
        """Roll the day over when the candle's date changes.

        Consecutive-loss halts persist across days; only the daily-loss halt is
        cleared by a new day.
        """

        if self.state.current_day is None or day != self.state.current_day:
            preserved_losses = self.state.consecutive_losses
            self.start_day(day, equity)
            self.state.consecutive_losses = preserved_losses
            # A fresh day clears a daily-loss halt but not a loss-streak halt.
            if preserved_losses >= self.config.max_consecutive_losses:
                self.state.halted = True
                self.state.halt_reason = "max_consecutive_losses"

    def can_trade(self) -> bool:
        """Return ``True`` when new positions may currently be opened."""

        return not self.state.halted

    def register_trade_result(self, pnl: float, equity_after: float) -> None:
        """Update counters after a trade closes and trip breakers if needed.

        Args:
            pnl: Realised profit (positive) or loss (negative) of the trade.
            equity_after: Account equity after the trade settled.
        """

        self.state.daily_pnl += pnl

        if pnl < 0:
            self.state.consecutive_losses += 1
        else:
            self.state.consecutive_losses = 0

        # Daily loss breaker.
        if self.state.day_start_equity > 0:
            loss_fraction = -self.state.daily_pnl / self.state.day_start_equity
            if loss_fraction >= self.config.max_daily_loss:
                self.state.halted = True
                self.state.halt_reason = "max_daily_loss"

        # Consecutive-loss breaker.
        if self.state.consecutive_losses >= self.config.max_consecutive_losses:
            self.state.halted = True
            self.state.halt_reason = "max_consecutive_losses"
