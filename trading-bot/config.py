"""Central configuration for the trading bot.

Every tunable parameter lives here. No values are hardcoded elsewhere in the
codebase. Instances of :class:`Config` are plain dataclasses so they can be
copied and mutated freely (for example by the optimizer) without touching the
module-level default.

Secrets (API keys) are never stored in this file; they are read from
environment variables at runtime. See :meth:`ExchangeConfig.from_env`.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, replace
from typing import List


@dataclass
class IndicatorConfig:
    """Parameters that control indicator calculation."""

    ema_fast_period: int = 14
    ema_slow_period: int = 50
    rsi_period: int = 14
    atr_period: int = 14
    #: Look-back window used to compute the "recent" ATR average that the
    #: volatility filter compares the current ATR against.
    atr_average_period: int = 20


@dataclass
class StrategyConfig:
    """Parameters that control entry and exit signal generation."""

    rsi_oversold: float = 30.0
    rsi_overbought: float = 70.0
    #: A RSI cross of the oversold/overbought level counts as a valid setup for
    #: this many candles afterwards. The spec's four entry conditions almost
    #: never coincide on the exact cross candle: a dip deep enough to push RSI
    #: to 30 also drags the fast EMA below the slow EMA and leaves price below
    #: the fast EMA. The trade is designed to fire on the *recovery* — once the
    #: trend re-aligns and price reclaims the fast EMA — so the cross is treated
    #: as a setup that stays valid for this window. Set to 1 for strict same-bar
    #: cross behaviour.
    rsi_cross_lookback: int = 30
    #: Stop loss distance expressed as a multiple of ATR.
    atr_stop_multiplier: float = 1.5
    #: Take profit distance expressed as a multiple of ATR.
    atr_take_profit_multiplier: float = 3.0
    #: Trailing stop distance expressed as a multiple of ATR.
    atr_trailing_multiplier: float = 1.5
    #: Profit (in ATR multiples) after which the stop is moved to breakeven.
    breakeven_trigger_atr: float = 1.0
    #: Enable/disable the trailing stop logic.
    use_trailing_stop: bool = True
    #: Enable/disable moving the stop to breakeven.
    use_breakeven: bool = True
    #: Allow short trades. When ``False`` only long trades are taken.
    allow_short: bool = True
    #: Allow long trades. When ``False`` only short trades are taken.
    allow_long: bool = True


@dataclass
class RiskConfig:
    """Parameters that control risk and money management."""

    #: Fraction of account equity risked on a single trade (0.01 == 1%).
    risk_per_trade: float = 0.01
    #: Maximum leverage the position notional may reach.
    max_leverage: float = 3.0
    #: Maximum loss (fraction of starting-of-day equity) before trading is
    #: paused for the remainder of the day.
    max_daily_loss: float = 0.05
    #: Number of consecutive losing trades that triggers a trading pause.
    max_consecutive_losses: int = 4
    #: Smallest position size (in base units) that is considered tradable.
    min_position_size: float = 1e-6


@dataclass
class FilterConfig:
    """Parameters that control trade filtering."""

    #: Reject entries when ATR is below this fraction of price (too quiet).
    min_atr_pct: float = 0.0005
    #: Reject entries when the spread exceeds this fraction of price.
    max_spread_pct: float = 0.002
    #: Reject entries when volume is below this multiple of its rolling mean.
    min_volume_ratio: float = 0.2
    #: Rolling window for the volume average used by the volume filter.
    volume_average_period: int = 20
    #: When ``True`` no new trades are opened on Saturday/Sunday (UTC).
    avoid_weekends: bool = False


@dataclass
class CostConfig:
    """Trading cost assumptions used by the backtester and paper broker."""

    #: Commission per side as a fraction of notional (0.0004 == 0.04%).
    commission: float = 0.0004
    #: Slippage per fill as a fraction of price.
    slippage: float = 0.0002
    #: Half-spread applied to fills as a fraction of price.
    spread: float = 0.0001


@dataclass
class ExchangeConfig:
    """Exchange / broker connection settings.

    API credentials are intentionally **not** stored here. They are loaded from
    the environment by :meth:`from_env` so that secrets never live in source
    control.
    """

    name: str = "binance"
    symbol: str = "BTC/USDT"
    timeframe: str = "1h"
    #: ``True`` selects the exchange test-net / sandbox endpoints.
    testnet: bool = True
    api_key: str = ""
    api_secret: str = ""

    @classmethod
    def from_env(cls, base: "ExchangeConfig | None" = None) -> "ExchangeConfig":
        """Return a copy of *base* with credentials filled from the environment.

        Reads ``EXCHANGE_API_KEY`` and ``EXCHANGE_API_SECRET``. The values are
        never logged or written anywhere.
        """

        base = base or cls()
        return replace(
            base,
            api_key=os.environ.get("EXCHANGE_API_KEY", base.api_key),
            api_secret=os.environ.get("EXCHANGE_API_SECRET", base.api_secret),
        )


@dataclass
class BacktestConfig:
    """Parameters that control the backtesting engine."""

    initial_balance: float = 10_000.0
    #: Number of trading periods per year, used to annualise returns and to
    #: scale the Sharpe/Sortino ratios. 24 * 365 for hourly candles.
    periods_per_year: int = 24 * 365
    #: Risk-free rate (annualised) used by the Sharpe/Sortino ratios.
    risk_free_rate: float = 0.0


@dataclass
class OptimizationConfig:
    """Parameters that control walk-forward optimization."""

    #: Number of candles in each in-sample (training) window.
    train_size: int = 1500
    #: Number of candles in each out-of-sample (validation) window.
    test_size: int = 500
    #: Metric used to rank parameter sets on the in-sample window.
    objective: str = "sharpe_ratio"
    ema_fast_grid: List[int] = field(default_factory=lambda: [9, 14, 21])
    ema_slow_grid: List[int] = field(default_factory=lambda: [50, 100])
    rsi_period_grid: List[int] = field(default_factory=lambda: [14, 21])
    rsi_oversold_grid: List[float] = field(default_factory=lambda: [25.0, 30.0, 35.0])
    rsi_overbought_grid: List[float] = field(default_factory=lambda: [65.0, 70.0, 75.0])
    atr_stop_grid: List[float] = field(default_factory=lambda: [1.0, 1.5, 2.0])
    atr_take_profit_grid: List[float] = field(default_factory=lambda: [2.0, 3.0, 4.0])


@dataclass
class LoggingConfig:
    """Logging configuration."""

    level: str = "INFO"
    log_dir: str = "logs"
    log_file: str = "trading_bot.log"
    console: bool = True


@dataclass
class Config:
    """Top-level configuration aggregating every sub-config."""

    indicators: IndicatorConfig = field(default_factory=IndicatorConfig)
    strategy: StrategyConfig = field(default_factory=StrategyConfig)
    risk: RiskConfig = field(default_factory=RiskConfig)
    filters: FilterConfig = field(default_factory=FilterConfig)
    costs: CostConfig = field(default_factory=CostConfig)
    exchange: ExchangeConfig = field(default_factory=ExchangeConfig)
    backtest: BacktestConfig = field(default_factory=BacktestConfig)
    optimization: OptimizationConfig = field(default_factory=OptimizationConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)


#: The default configuration instance imported throughout the project.
DEFAULT_CONFIG = Config()


def get_config() -> Config:
    """Return the default configuration instance."""

    return DEFAULT_CONFIG
