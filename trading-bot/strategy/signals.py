"""Signal generation and trade-management rules.

The functions here are pure and operate on plain values so they are trivial to
unit test and reuse from the backtester, the paper broker and the live engine.

Entry rules
-----------
Long:
    * fast EMA above slow EMA (up-trend), and
    * RSI crosses **above** the oversold threshold, and
    * candle closes above the fast EMA, and
    * ATR is above its recent average (sufficient volatility).

Short:
    * fast EMA below slow EMA (down-trend), and
    * RSI crosses **below** the overbought threshold, and
    * candle closes below the fast EMA, and
    * ATR is above its recent average (sufficient volatility).

Exit rules
----------
    * Fixed stop loss at ``entry -/+ atr_stop_multiplier * ATR``.
    * Fixed take profit at ``entry +/- atr_take_profit_multiplier * ATR``.
    * Optional trailing stop at ``atr_trailing_multiplier * ATR`` from the best
      price seen since entry.
    * Optional move-to-breakeven once price has advanced ``breakeven_trigger_atr``
      ATR in favour of the position.
"""

from __future__ import annotations

import enum
import math
from dataclasses import dataclass
from typing import Optional

import pandas as pd

from config import StrategyConfig
from indicators.core import ATR, ATR_AVG, EMA_FAST, EMA_SLOW, RSI


class Side(enum.Enum):
    """Direction of a position."""

    LONG = 1
    SHORT = -1


class SignalType(enum.Enum):
    """Type of entry signal produced by :func:`generate_signal`."""

    NONE = 0
    ENTER_LONG = 1
    ENTER_SHORT = 2


@dataclass(frozen=True)
class Signal:
    """An entry signal with the context needed to size and manage the trade."""

    type: SignalType
    price: float
    atr: float

    @property
    def side(self) -> Optional[Side]:
        """The position side implied by the signal, or ``None``."""

        if self.type is SignalType.ENTER_LONG:
            return Side.LONG
        if self.type is SignalType.ENTER_SHORT:
            return Side.SHORT
        return None


#: Column names for the precomputed RSI-cross setup flags.
RSI_CROSS_UP = "rsi_cross_up"
RSI_CROSS_DOWN = "rsi_cross_down"


def _is_valid(*values: float) -> bool:
    """Return ``True`` when every value is a finite (non-NaN) number."""

    return all(v is not None and not math.isnan(v) for v in values)


def add_signal_columns(df: pd.DataFrame, config: StrategyConfig) -> pd.DataFrame:
    """Return a copy of *df* with RSI-cross setup flags added.

    Adds boolean columns :data:`RSI_CROSS_UP` and :data:`RSI_CROSS_DOWN` which
    are ``True`` when an RSI cross of the oversold/overbought level occurred on
    the current candle or within the preceding ``rsi_cross_lookback - 1``
    candles. This lets the strategy act on a fresh cross even when the other
    entry conditions confirm a few bars later.
    """

    out = df.copy()
    rsi_series = out[RSI]
    prev = rsi_series.shift(1)

    cross_up = (prev <= config.rsi_oversold) & (rsi_series > config.rsi_oversold)
    cross_down = (prev >= config.rsi_overbought) & (rsi_series < config.rsi_overbought)

    window = max(1, config.rsi_cross_lookback)
    out[RSI_CROSS_UP] = (
        cross_up.astype(float).rolling(window=window, min_periods=1).max() > 0
    )
    out[RSI_CROSS_DOWN] = (
        cross_down.astype(float).rolling(window=window, min_periods=1).max() > 0
    )
    return out


def generate_signal(
    row: pd.Series,
    prev_row: pd.Series,
    config: StrategyConfig,
) -> Signal:
    """Evaluate the entry rules for a single candle.

    Args:
        row: The current candle including indicator columns.
        prev_row: The immediately preceding candle (used for RSI cross
            detection).
        config: Strategy parameters.

    Returns:
        A :class:`Signal`. ``SignalType.NONE`` when no entry condition is met.
    """

    close = row["close"]
    ema_fast = row[EMA_FAST]
    ema_slow = row[EMA_SLOW]
    rsi_now = row[RSI]
    rsi_prev = prev_row[RSI]
    atr_now = row[ATR]
    atr_avg = row[ATR_AVG]

    # Bail out while indicators are still warming up.
    if not _is_valid(close, ema_fast, ema_slow, rsi_now, rsi_prev, atr_now, atr_avg):
        return Signal(SignalType.NONE, float(close), 0.0)

    volatility_ok = atr_now > atr_avg

    # Prefer the precomputed rolling cross flag (set by add_signal_columns);
    # fall back to a strict same-bar cross when the column is absent so the
    # function stays usable on ad-hoc rows (e.g. in unit tests).
    if RSI_CROSS_UP in row.index and not pd.isna(row[RSI_CROSS_UP]):
        cross_up = bool(row[RSI_CROSS_UP])
    else:
        cross_up = rsi_prev <= config.rsi_oversold < rsi_now
    if RSI_CROSS_DOWN in row.index and not pd.isna(row[RSI_CROSS_DOWN]):
        cross_down = bool(row[RSI_CROSS_DOWN])
    else:
        cross_down = rsi_prev >= config.rsi_overbought > rsi_now

    # --- Long setup -----------------------------------------------------
    if config.allow_long:
        if (
            ema_fast > ema_slow
            and cross_up
            and close > ema_fast
            and volatility_ok
        ):
            return Signal(SignalType.ENTER_LONG, float(close), float(atr_now))

    # --- Short setup ----------------------------------------------------
    if config.allow_short:
        if (
            ema_fast < ema_slow
            and cross_down
            and close < ema_fast
            and volatility_ok
        ):
            return Signal(SignalType.ENTER_SHORT, float(close), float(atr_now))

    return Signal(SignalType.NONE, float(close), float(atr_now))


def compute_stops(
    entry_price: float,
    atr_value: float,
    side: Side,
    config: StrategyConfig,
) -> tuple[float, float]:
    """Return the initial ``(stop_loss, take_profit)`` for a new position.

    Args:
        entry_price: Fill price of the entry.
        atr_value: ATR at entry, used to scale the stop and target.
        side: Position direction.
        config: Strategy parameters.
    """

    stop_dist = config.atr_stop_multiplier * atr_value
    tp_dist = config.atr_take_profit_multiplier * atr_value
    if side is Side.LONG:
        return entry_price - stop_dist, entry_price + tp_dist
    return entry_price + stop_dist, entry_price - tp_dist


def update_trailing_stop(
    side: Side,
    entry_price: float,
    current_stop: float,
    extreme_price: float,
    atr_value: float,
    config: StrategyConfig,
) -> float:
    """Return the (possibly tightened) stop after a new candle.

    The stop is only ever moved in the favourable direction — it never loosens.
    Applies the breakeven rule first, then the trailing-stop rule, and returns
    the tighter of the two combined with the existing stop.

    Args:
        side: Position direction.
        entry_price: Original entry fill price.
        current_stop: The current stop-loss price.
        extreme_price: Best price seen since entry (highest high for longs,
            lowest low for shorts).
        atr_value: Current ATR.
        config: Strategy parameters.
    """

    new_stop = current_stop
    trail_dist = config.atr_trailing_multiplier * atr_value
    be_trigger = config.breakeven_trigger_atr * atr_value

    if side is Side.LONG:
        if config.use_breakeven and extreme_price - entry_price >= be_trigger:
            new_stop = max(new_stop, entry_price)
        if config.use_trailing_stop:
            new_stop = max(new_stop, extreme_price - trail_dist)
    else:  # SHORT
        if config.use_breakeven and entry_price - extreme_price >= be_trigger:
            new_stop = min(new_stop, entry_price)
        if config.use_trailing_stop:
            new_stop = min(new_stop, extreme_price + trail_dist)

    return new_stop


@dataclass(frozen=True)
class ExitResult:
    """Outcome of an exit check for one candle."""

    exited: bool
    price: float = 0.0
    reason: str = ""


def check_exit(
    side: Side,
    stop_loss: float,
    take_profit: float,
    candle_high: float,
    candle_low: float,
) -> ExitResult:
    """Determine whether a stop or target was hit within a candle.

    When both the stop and the target fall inside the candle's range the stop
    is assumed to trigger first (a conservative, worst-case assumption).

    Args:
        side: Position direction.
        stop_loss: Current stop-loss price.
        take_profit: Current take-profit price.
        candle_high: Candle high.
        candle_low: Candle low.
    """

    if side is Side.LONG:
        if candle_low <= stop_loss:
            return ExitResult(True, stop_loss, "stop_loss")
        if candle_high >= take_profit:
            return ExitResult(True, take_profit, "take_profit")
    else:  # SHORT
        if candle_high >= stop_loss:
            return ExitResult(True, stop_loss, "stop_loss")
        if candle_low <= take_profit:
            return ExitResult(True, take_profit, "take_profit")
    return ExitResult(False)
