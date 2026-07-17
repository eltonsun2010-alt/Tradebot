"""Vectorised technical indicator implementations.

The indicators are implemented with pandas/numpy so they run efficiently over
an entire candle history in one pass. Each function is pure: it takes a Series
(or DataFrame) and returns a new Series without mutating its inputs.
"""

from __future__ import annotations

import pandas as pd

from config import IndicatorConfig

# Column names produced by :func:`add_indicators`. Centralised so the rest of
# the codebase never hardcodes indicator column strings.
EMA_FAST = "ema_fast"
EMA_SLOW = "ema_slow"
RSI = "rsi"
ATR = "atr"
ATR_AVG = "atr_avg"

REQUIRED_OHLCV = ("open", "high", "low", "close", "volume")


def ema(series: pd.Series, period: int) -> pd.Series:
    """Return the Exponential Moving Average of *series*.

    Args:
        series: Price series (typically the close).
        period: Smoothing period. Must be a positive integer.

    Returns:
        A Series aligned to *series* containing the EMA.
    """

    if period <= 0:
        raise ValueError("EMA period must be a positive integer")
    return series.ewm(span=period, adjust=False, min_periods=period).mean()


def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Return the Relative Strength Index of *series* using Wilder's smoothing.

    Args:
        series: Price series (typically the close).
        period: Look-back period. Must be a positive integer.

    Returns:
        A Series of RSI values in the range [0, 100]. The first ``period``
        values are ``NaN`` because there is not enough data to compute them.
    """

    if period <= 0:
        raise ValueError("RSI period must be a positive integer")

    delta = series.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)

    # Wilder's smoothing is an EMA with alpha = 1 / period.
    avg_gain = gain.ewm(alpha=1.0 / period, adjust=False, min_periods=period).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, adjust=False, min_periods=period).mean()

    rs = avg_gain / avg_loss
    result = 100.0 - (100.0 / (1.0 + rs))
    # When average loss is zero RSI is defined as 100 (pure uptrend).
    result = result.where(avg_loss != 0.0, 100.0)
    # Restore NaN for the warm-up window that .where() may have overwritten.
    result[avg_gain.isna()] = float("nan")
    return result


def true_range(high: pd.Series, low: pd.Series, close: pd.Series) -> pd.Series:
    """Return the True Range series.

    True Range is the greatest of: current high-low, |high - previous close|,
    and |low - previous close|.
    """

    prev_close = close.shift(1)
    ranges = pd.concat(
        [
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ],
        axis=1,
    )
    return ranges.max(axis=1)


def atr(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14,
) -> pd.Series:
    """Return the Average True Range using Wilder's smoothing.

    Args:
        high: High price series.
        low: Low price series.
        close: Close price series.
        period: Look-back period. Must be a positive integer.

    Returns:
        A Series of ATR values aligned to the inputs.
    """

    if period <= 0:
        raise ValueError("ATR period must be a positive integer")
    tr = true_range(high, low, close)
    return tr.ewm(alpha=1.0 / period, adjust=False, min_periods=period).mean()


def add_indicators(df: pd.DataFrame, config: IndicatorConfig) -> pd.DataFrame:
    """Return a copy of *df* with all strategy indicators added as columns.

    The added columns are :data:`EMA_FAST`, :data:`EMA_SLOW`, :data:`RSI`,
    :data:`ATR` and :data:`ATR_AVG`.

    Args:
        df: OHLCV DataFrame containing at least the columns in
            :data:`REQUIRED_OHLCV`.
        config: Indicator parameters.

    Returns:
        A new DataFrame; the input is not mutated.
    """

    missing = [c for c in REQUIRED_OHLCV if c not in df.columns]
    if missing:
        raise ValueError(f"DataFrame is missing required columns: {missing}")

    out = df.copy()
    out[EMA_FAST] = ema(out["close"], config.ema_fast_period)
    out[EMA_SLOW] = ema(out["close"], config.ema_slow_period)
    out[RSI] = rsi(out["close"], config.rsi_period)
    out[ATR] = atr(out["high"], out["low"], out["close"], config.atr_period)
    out[ATR_AVG] = (
        out[ATR].rolling(window=config.atr_average_period, min_periods=1).mean()
    )
    return out
