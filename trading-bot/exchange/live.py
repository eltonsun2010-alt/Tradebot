"""Live exchange broker backed by ccxt (e.g. Binance).

``ccxt`` is an optional dependency: it is imported lazily so the rest of the
project (indicators, backtester, paper trading, tests) works without it. The
broker adds the operational concerns a real deployment needs — rate limiting,
reconnect-with-backoff, error handling, order confirmation and position
synchronisation / recovery after a restart.

Security: API credentials are only ever read from :class:`ExchangeConfig`
(populated from environment variables) and are never logged.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Optional

from bot_logging import get_logger
from config import CostConfig, ExchangeConfig, LoggingConfig
from exchange.base import Broker, Position, Trade
from strategy.signals import Side


class ExchangeError(RuntimeError):
    """Raised when an exchange operation fails after all retries."""


class CCXTBroker(Broker):
    """A live broker for any ccxt-supported exchange.

    The broker keeps a local view of the open position and reconciles it with
    the exchange on demand via :meth:`synchronise`.
    """

    def __init__(
        self,
        exchange_config: ExchangeConfig,
        costs: CostConfig,
        logging_config: LoggingConfig,
        max_retries: int = 4,
    ) -> None:
        """Create the broker and connect to the exchange.

        Args:
            exchange_config: Exchange name, symbol and (env-sourced) credentials.
            costs: Cost assumptions used only for local P&L accounting.
            logging_config: Logging configuration.
            max_retries: Maximum reconnect/retry attempts per API call.
        """

        self._cfg = exchange_config
        self._costs = costs
        self._log = get_logger("live", logging_config)
        self._max_retries = max_retries
        self._position: Optional[Position] = None
        self._client = self._connect()

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------
    def _connect(self) -> Any:
        """Instantiate and return an authenticated ccxt client."""

        try:
            import ccxt  # type: ignore
        except ImportError as exc:  # pragma: no cover - exercised only when ccxt absent
            raise ExchangeError(
                "ccxt is required for live trading. Install it with "
                "'pip install ccxt'."
            ) from exc

        if not hasattr(ccxt, self._cfg.name):
            raise ExchangeError(f"Unknown exchange: {self._cfg.name}")

        klass = getattr(ccxt, self._cfg.name)
        client = klass(
            {
                "apiKey": self._cfg.api_key,
                "secret": self._cfg.api_secret,
                "enableRateLimit": True,  # ccxt-managed rate limiting
                "options": {"defaultType": "spot"},
            }
        )
        if self._cfg.testnet and hasattr(client, "set_sandbox_mode"):
            client.set_sandbox_mode(True)
        self._log.info("Connected to %s (testnet=%s)", self._cfg.name, self._cfg.testnet)
        return client

    def _call(self, method: str, *args: Any, **kwargs: Any) -> Any:
        """Call a ccxt client method with retry-and-backoff on transient errors.

        Reconnects and retries up to ``max_retries`` times with exponential
        backoff. Raises :class:`ExchangeError` when all attempts fail.
        """

        delay = 1.0
        last_exc: Optional[Exception] = None
        for attempt in range(1, self._max_retries + 1):
            try:
                fn = getattr(self._client, method)
                return fn(*args, **kwargs)
            except Exception as exc:  # ccxt raises many subclasses; treat uniformly
                last_exc = exc
                self._log.warning(
                    "Exchange call '%s' failed (attempt %d/%d): %s",
                    method,
                    attempt,
                    self._max_retries,
                    exc,
                )
                if attempt < self._max_retries:
                    time.sleep(delay)
                    delay *= 2.0
                    try:
                        self._client = self._connect()
                    except ExchangeError:
                        pass
        raise ExchangeError(f"'{method}' failed after {self._max_retries} attempts") from last_exc

    # ------------------------------------------------------------------
    # Market data
    # ------------------------------------------------------------------
    def fetch_ohlcv(self, limit: int = 500) -> list[list[float]]:
        """Fetch recent OHLCV candles for the configured symbol/timeframe."""

        return self._call(
            "fetch_ohlcv",
            self._cfg.symbol,
            timeframe=self._cfg.timeframe,
            limit=limit,
        )

    def fetch_price(self) -> float:
        """Return the latest traded price for the configured symbol."""

        ticker = self._call("fetch_ticker", self._cfg.symbol)
        return float(ticker["last"])

    # ------------------------------------------------------------------
    # Broker interface
    # ------------------------------------------------------------------
    def get_balance(self) -> float:
        balance = self._call("fetch_balance")
        quote = self._cfg.symbol.split("/")[-1]
        return float(balance.get("free", {}).get(quote, 0.0))

    def get_equity(self, mark_price: float) -> float:
        equity = self.get_balance()
        if self._position is not None:
            equity += self._position.unrealised_pnl(mark_price)
        return equity

    def get_position(self) -> Optional[Position]:
        return self._position

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
            raise RuntimeError("A position is already open")

        order_side = "buy" if side is Side.LONG else "sell"
        order = self._call("create_order", self._cfg.symbol, "market", order_side, size)
        fill_price = float(order.get("average") or order.get("price") or price)
        commission = self._extract_commission(order, fill_price, size)
        self._log.info(
            "LIVE ENTRY %s size=%.6f @ %.2f id=%s",
            side.name,
            size,
            fill_price,
            order.get("id", "?"),
        )

        self._position = Position(
            side=side,
            size=size,
            entry_price=fill_price,
            entry_time=timestamp,
            stop_loss=stop_loss,
            take_profit=take_profit,
            entry_atr=atr_value,
            extreme_price=fill_price,
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
        order_side = "sell" if pos.side is Side.LONG else "buy"
        order = self._call("create_order", self._cfg.symbol, "market", order_side, pos.size)
        fill_price = float(order.get("average") or order.get("price") or price)
        exit_commission = self._extract_commission(order, fill_price, pos.size)

        gross = pos.unrealised_pnl(fill_price)
        total_commission = pos.entry_commission + exit_commission
        trade = Trade(
            side=pos.side,
            size=pos.size,
            entry_time=pos.entry_time,
            entry_price=pos.entry_price,
            exit_time=timestamp,
            exit_price=fill_price,
            pnl=gross - total_commission,
            gross_pnl=gross,
            commission=total_commission,
            reason=reason,
            equity_after=self.get_balance(),
        )
        self._log.info(
            "LIVE EXIT %s @ %.2f pnl=%.2f reason=%s",
            pos.side.name,
            fill_price,
            trade.pnl,
            reason,
        )
        self._position = None
        return trade

    # ------------------------------------------------------------------
    # Recovery / synchronisation
    # ------------------------------------------------------------------
    def synchronise(self) -> None:
        """Reconcile the local position view with the exchange.

        Called on startup so the bot recovers gracefully after a restart. If
        the exchange reports no open position the local view is cleared.
        """

        try:
            positions = self._call("fetch_positions", [self._cfg.symbol])
        except ExchangeError:
            self._log.warning("Could not fetch positions during synchronise")
            return

        live = [p for p in positions if float(p.get("contracts") or 0) != 0]
        if not live and self._position is not None:
            self._log.warning("Exchange reports flat; clearing local position")
            self._position = None
        elif live:
            self._log.info("Exchange reports %d open position(s)", len(live))

    @staticmethod
    def _extract_commission(order: dict, price: float, size: float) -> float:
        """Best-effort extraction of the commission paid on an order."""

        fee = order.get("fee") or {}
        cost = fee.get("cost")
        if cost is not None:
            return float(cost)
        return 0.0

    @staticmethod
    def now() -> datetime:
        """Return the current UTC time (helper for callers)."""

        return datetime.now(timezone.utc)
