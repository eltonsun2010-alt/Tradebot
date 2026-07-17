"""Trade filters that veto otherwise-valid entry signals.

Filters keep the strategy out of poor market conditions: dead volatility, wide
spreads, thin volume and (optionally) weekends. Each returns a
:class:`FilterResult` so the caller can log *why* a trade was skipped.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import pandas as pd

from config import FilterConfig
from indicators.core import ATR


@dataclass(frozen=True)
class FilterResult:
    """Result of applying the trade filters to a candle."""

    allowed: bool
    reason: str = ""


def _volume_ok(row: pd.Series, config: FilterConfig) -> bool:
    """Return ``True`` when volume is healthy relative to its rolling average."""

    avg = row.get("volume_avg")
    volume = row.get("volume")
    if avg is None or volume is None or math.isnan(avg) or avg <= 0:
        return True  # Not enough data to judge — do not block.
    return volume >= config.min_volume_ratio * avg


def apply_filters(
    row: pd.Series,
    config: FilterConfig,
    spread_pct: float = 0.0,
) -> FilterResult:
    """Apply every enabled filter to *row*.

    Args:
        row: Current candle including an ``atr`` column and, when the volume
            filter is used, a ``volume_avg`` column.
        config: Filter parameters.
        spread_pct: Current spread as a fraction of price (live/paper only; the
            backtester passes its configured spread).

    Returns:
        A :class:`FilterResult`. ``allowed`` is ``False`` with a ``reason`` when
        any filter vetoes the trade.
    """

    close = row.get("close")
    atr_value = row.get(ATR)

    # Volatility floor.
    if close and atr_value is not None and not math.isnan(atr_value):
        if close > 0 and (atr_value / close) < config.min_atr_pct:
            return FilterResult(False, "low_atr")

    # Spread ceiling.
    if spread_pct > config.max_spread_pct:
        return FilterResult(False, "high_spread")

    # Volume floor.
    if not _volume_ok(row, config):
        return FilterResult(False, "low_volume")

    # Weekend filter.
    if config.avoid_weekends and isinstance(row.name, pd.Timestamp):
        # Monday=0 ... Saturday=5, Sunday=6.
        if row.name.weekday() >= 5:
            return FilterResult(False, "weekend")

    return FilterResult(True)


def add_filter_columns(df: pd.DataFrame, config: FilterConfig) -> pd.DataFrame:
    """Return a copy of *df* with helper columns the filters need.

    Currently adds ``volume_avg`` (rolling mean of volume).
    """

    out = df.copy()
    out["volume_avg"] = (
        out["volume"].rolling(window=config.volume_average_period, min_periods=1).mean()
    )
    return out
