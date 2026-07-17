"""Load, validate, save and synthesise OHLCV candle data.

The synthetic generator produces realistic-looking candles with configurable
trend and volatility regimes. It is used by the tests and by ``main.py`` when
no CSV or live connection is provided, so the whole pipeline can be exercised
offline and deterministically.
"""

from __future__ import annotations

from typing import Literal

import numpy as np
import pandas as pd

OHLCV_COLUMNS = ["open", "high", "low", "close", "volume"]

Regime = Literal["bull", "bear", "sideways", "high_vol", "low_vol"]


def validate_ohlcv(df: pd.DataFrame) -> pd.DataFrame:
    """Validate and normalise an OHLCV DataFrame.

    Ensures the required columns are present, the index is a sorted
    ``DatetimeIndex`` and there are no NaNs in the price columns.

    Args:
        df: Candidate OHLCV frame.

    Returns:
        A validated, index-sorted copy.

    Raises:
        ValueError: If required columns are missing or price data is invalid.
    """

    missing = [c for c in OHLCV_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"OHLCV data missing columns: {missing}")

    out = df.copy()
    if not isinstance(out.index, pd.DatetimeIndex):
        raise ValueError("OHLCV data must be indexed by a DatetimeIndex")
    out = out.sort_index()

    if out[OHLCV_COLUMNS].isna().any().any():
        raise ValueError("OHLCV data contains NaN values")
    if (out[["open", "high", "low", "close"]] <= 0).any().any():
        raise ValueError("OHLCV data contains non-positive prices")
    # High must be the max and low the min of the candle.
    bad = (out["high"] < out[["open", "close", "low"]].max(axis=1)) | (
        out["low"] > out[["open", "close", "high"]].min(axis=1)
    )
    if bad.any():
        raise ValueError("OHLCV data has inconsistent high/low values")
    return out


def load_csv(path: str, timestamp_col: str = "timestamp") -> pd.DataFrame:
    """Load an OHLCV CSV file into a validated DataFrame.

    Args:
        path: Path to the CSV file.
        timestamp_col: Name of the column holding candle timestamps.
    """

    df = pd.read_csv(path)
    if timestamp_col not in df.columns:
        raise ValueError(f"CSV is missing the '{timestamp_col}' column")
    df[timestamp_col] = pd.to_datetime(df[timestamp_col], utc=True)
    df = df.set_index(timestamp_col)
    return validate_ohlcv(df)


def save_csv(df: pd.DataFrame, path: str, timestamp_col: str = "timestamp") -> None:
    """Save an OHLCV DataFrame to CSV with the index as *timestamp_col*."""

    out = df.copy()
    out.index.name = timestamp_col
    out.to_csv(path)


def generate_synthetic_ohlcv(
    periods: int = 2000,
    start_price: float = 20_000.0,
    freq: str = "1h",
    regime: Regime = "bull",
    seed: int | None = 42,
    start: str = "2022-01-01",
) -> pd.DataFrame:
    """Generate deterministic synthetic OHLCV candles.

    Args:
        periods: Number of candles to generate.
        start_price: Price of the first candle.
        freq: Pandas frequency string for the index (e.g. ``"1h"``, ``"15min"``).
        regime: Market regime shaping drift and volatility.
        seed: RNG seed for reproducibility. ``None`` for non-deterministic.
        start: Timestamp of the first candle.

    Returns:
        A validated OHLCV DataFrame indexed by a UTC ``DatetimeIndex``.
    """

    if periods <= 0:
        raise ValueError("periods must be positive")

    rng = np.random.default_rng(seed)

    # Per-regime parameters:
    #   drift    : per-candle log drift of the underlying trend
    #   vol      : diffusion volatility of the trend component
    #   pull_amp : innovation size of the mean-reverting pullback overlay
    #   pull_rho : autocorrelation of the pullback (higher == more persistent
    #              dips, which is what pushes RSI into oversold/overbought while
    #              leaving the medium-term EMA trend intact)
    params: dict[str, tuple[float, float, float, float]] = {
        "bull": (0.0006, 0.010, 0.015, 0.92),
        "bear": (-0.0006, 0.012, 0.015, 0.92),
        "sideways": (0.0, 0.008, 0.018, 0.94),
        "high_vol": (0.0002, 0.030, 0.030, 0.90),
        "low_vol": (0.0001, 0.003, 0.005, 0.92),
    }
    if regime not in params:
        raise ValueError(f"Unknown regime: {regime}")
    drift, vol, pull_amp, pull_rho = params[regime]

    # 1) Slow trend component (log space): drift plus diffusion, with a gentle
    #    sine cycle so trends ebb and flow rather than run in a straight line.
    cycle = 0.0004 * np.sin(np.linspace(0, 6 * np.pi, periods))
    trend = np.cumsum(drift + cycle + rng.normal(0.0, vol * 0.4, periods))

    # 2) Mean-reverting pullback overlay (AR(1) in log space). This produces the
    #    realistic short corrections that let RSI dip to oversold during an
    #    up-trend without permanently flipping the EMA relationship.
    oscillation = np.zeros(periods)
    innovations = rng.normal(0.0, pull_amp, periods)
    for t in range(1, periods):
        oscillation[t] = pull_rho * oscillation[t - 1] + innovations[t]

    log_price = np.log(start_price) + trend + oscillation
    close = np.exp(log_price)

    # Build open/high/low around the close path.
    open_ = np.empty(periods)
    open_[0] = start_price
    open_[1:] = close[:-1]

    intrabar = np.abs(rng.normal(0.0, vol, periods)) * close
    high = np.maximum(open_, close) + intrabar * rng.uniform(0.2, 1.0, periods)
    low = np.minimum(open_, close) - intrabar * rng.uniform(0.2, 1.0, periods)
    low = np.clip(low, 1e-6, None)

    # Volume loosely correlated with the size of the bar's move.
    move = np.abs(close - open_) / np.maximum(open_, 1e-9)
    volume = rng.uniform(50, 150, periods) * (1.0 + 10.0 * move)

    index = pd.date_range(start=start, periods=periods, freq=freq, tz="UTC")
    df = pd.DataFrame(
        {
            "open": open_,
            "high": high,
            "low": low,
            "close": close,
            "volume": volume,
        },
        index=index,
    )
    return validate_ohlcv(df)
