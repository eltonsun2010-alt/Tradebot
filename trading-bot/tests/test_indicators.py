"""Tests for the technical indicators."""

import numpy as np
import pandas as pd
import pytest

from config import IndicatorConfig
from indicators.core import (
    ATR,
    ATR_AVG,
    EMA_FAST,
    EMA_SLOW,
    RSI,
    add_indicators,
    atr,
    ema,
    rsi,
    true_range,
)


def test_ema_constant_series_equals_constant():
    s = pd.Series([5.0] * 50)
    result = ema(s, 10)
    # After warm-up the EMA of a constant series is the constant.
    assert result.dropna().iloc[-1] == pytest.approx(5.0)


def test_ema_matches_manual_recursion():
    s = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0])
    period = 3
    alpha = 2.0 / (period + 1)
    result = ema(s, period)
    # Manually compute the adjust=False EMA.
    manual = [s.iloc[0]]
    for x in s.iloc[1:]:
        manual.append(alpha * x + (1 - alpha) * manual[-1])
    # min_periods=period means the first period-1 values are NaN.
    assert result.iloc[-1] == pytest.approx(manual[-1])


def test_ema_rejects_bad_period():
    with pytest.raises(ValueError):
        ema(pd.Series([1.0, 2.0]), 0)


def test_rsi_all_gains_is_100():
    s = pd.Series(np.arange(1, 30, dtype=float))
    result = rsi(s, 14)
    assert result.dropna().iloc[-1] == pytest.approx(100.0)


def test_rsi_all_losses_is_zero():
    s = pd.Series(np.arange(30, 1, -1, dtype=float))
    result = rsi(s, 14)
    assert result.dropna().iloc[-1] == pytest.approx(0.0)


def test_rsi_bounds():
    rng = np.random.default_rng(0)
    s = pd.Series(100 + np.cumsum(rng.normal(0, 1, 200)))
    result = rsi(s, 14).dropna()
    assert (result >= 0).all() and (result <= 100).all()


def test_true_range_is_high_low_when_no_gap():
    high = pd.Series([10.0, 11.0])
    low = pd.Series([9.0, 10.0])
    close = pd.Series([9.5, 10.5])
    tr = true_range(high, low, close)
    assert tr.iloc[0] == pytest.approx(1.0)


def test_atr_positive_and_finite():
    rng = np.random.default_rng(1)
    close = pd.Series(100 + np.cumsum(rng.normal(0, 1, 100)))
    high = close + 1.0
    low = close - 1.0
    result = atr(high, low, close, 14).dropna()
    assert (result > 0).all()
    assert np.isfinite(result).all()


def test_add_indicators_adds_all_columns():
    rng = np.random.default_rng(2)
    close = 100 + np.cumsum(rng.normal(0, 1, 120))
    df = pd.DataFrame(
        {
            "open": close,
            "high": close + 1,
            "low": close - 1,
            "close": close,
            "volume": np.full(120, 100.0),
        },
        index=pd.date_range("2022-01-01", periods=120, freq="1h", tz="UTC"),
    )
    out = add_indicators(df, IndicatorConfig())
    for col in (EMA_FAST, EMA_SLOW, RSI, ATR, ATR_AVG):
        assert col in out.columns
    # Original frame is not mutated.
    assert EMA_FAST not in df.columns


def test_add_indicators_requires_columns():
    df = pd.DataFrame({"close": [1.0, 2.0]})
    with pytest.raises(ValueError):
        add_indicators(df, IndicatorConfig())
