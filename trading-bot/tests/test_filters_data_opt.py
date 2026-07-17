"""Tests for trade filters, data utilities and the optimizer."""

import numpy as np
import pandas as pd
import pytest

from config import Config, FilterConfig
from data.loader import (
    generate_synthetic_ohlcv,
    load_csv,
    save_csv,
    validate_ohlcv,
)
from indicators.core import ATR
from optimization.optimizer import grid_search, walk_forward
from strategy.filters import add_filter_columns, apply_filters


# --------------------------------------------------------------------------
# Filters
# --------------------------------------------------------------------------
def _filter_row(close, atr_val, volume=100.0, volume_avg=100.0, ts=None):
    s = pd.Series({"close": close, ATR: atr_val, "volume": volume,
                   "volume_avg": volume_avg})
    if ts is not None:
        s.name = ts
    return s


def test_low_atr_is_filtered():
    row = _filter_row(close=100.0, atr_val=0.01)  # 0.01% < default 0.05%
    res = apply_filters(row, FilterConfig())
    assert not res.allowed and res.reason == "low_atr"


def test_high_spread_is_filtered():
    row = _filter_row(close=100.0, atr_val=1.0)
    res = apply_filters(row, FilterConfig(), spread_pct=0.01)
    assert not res.allowed and res.reason == "high_spread"


def test_low_volume_is_filtered():
    row = _filter_row(close=100.0, atr_val=1.0, volume=1.0, volume_avg=100.0)
    res = apply_filters(row, FilterConfig(min_volume_ratio=0.5))
    assert not res.allowed and res.reason == "low_volume"


def test_weekend_is_filtered_when_enabled():
    saturday = pd.Timestamp("2022-01-01", tz="UTC")  # a Saturday
    row = _filter_row(close=100.0, atr_val=1.0, ts=saturday)
    res = apply_filters(row, FilterConfig(avoid_weekends=True))
    assert not res.allowed and res.reason == "weekend"


def test_good_conditions_pass():
    weekday = pd.Timestamp("2022-01-03", tz="UTC")  # a Monday
    row = _filter_row(close=100.0, atr_val=1.0, ts=weekday)
    res = apply_filters(row, FilterConfig(avoid_weekends=True), spread_pct=0.0)
    assert res.allowed


def test_add_filter_columns_adds_volume_avg():
    df = generate_synthetic_ohlcv(periods=60, seed=1)
    out = add_filter_columns(df, FilterConfig())
    assert "volume_avg" in out.columns


# --------------------------------------------------------------------------
# Data loader
# --------------------------------------------------------------------------
def test_synthetic_data_is_valid_and_deterministic():
    a = generate_synthetic_ohlcv(periods=100, seed=42)
    b = generate_synthetic_ohlcv(periods=100, seed=42)
    pd.testing.assert_frame_equal(a, b)
    # high >= low, prices positive.
    assert (a["high"] >= a["low"]).all()
    assert (a[["open", "high", "low", "close"]] > 0).all().all()


def test_validate_rejects_missing_columns():
    df = pd.DataFrame({"close": [1.0, 2.0]},
                      index=pd.date_range("2022-01-01", periods=2, tz="UTC"))
    with pytest.raises(ValueError):
        validate_ohlcv(df)


def test_csv_roundtrip(tmp_path):
    df = generate_synthetic_ohlcv(periods=50, seed=9)
    path = tmp_path / "candles.csv"
    save_csv(df, str(path))
    loaded = load_csv(str(path))
    assert len(loaded) == len(df)
    assert list(loaded.columns) == ["open", "high", "low", "close", "volume"]


def test_all_regimes_generate():
    for regime in ["bull", "bear", "sideways", "high_vol", "low_vol"]:
        df = generate_synthetic_ohlcv(periods=80, regime=regime, seed=1)
        assert len(df) == 80


# --------------------------------------------------------------------------
# Optimizer
# --------------------------------------------------------------------------
def test_grid_search_returns_valid_params():
    candles = generate_synthetic_ohlcv(periods=1200, regime="bull", seed=4)
    cfg = Config()
    # Shrink the grid so the test is fast.
    cfg.optimization.ema_fast_grid = [9, 14]
    cfg.optimization.ema_slow_grid = [50]
    cfg.optimization.rsi_period_grid = [14]
    cfg.optimization.rsi_oversold_grid = [30.0]
    cfg.optimization.rsi_overbought_grid = [70.0]
    cfg.optimization.atr_stop_grid = [1.5]
    cfg.optimization.atr_take_profit_grid = [3.0]
    best, report, ranking = grid_search(cfg, candles)
    assert best.ema_fast < best.ema_slow
    assert len(ranking) >= 1


def test_walk_forward_produces_oos_result():
    candles = generate_synthetic_ohlcv(periods=2600, regime="bull", seed=6)
    cfg = Config()
    cfg.optimization.train_size = 1000
    cfg.optimization.test_size = 400
    cfg.optimization.ema_fast_grid = [9, 14]
    cfg.optimization.ema_slow_grid = [50]
    cfg.optimization.rsi_period_grid = [14]
    cfg.optimization.rsi_oversold_grid = [30.0]
    cfg.optimization.rsi_overbought_grid = [70.0]
    cfg.optimization.atr_stop_grid = [1.5]
    cfg.optimization.atr_take_profit_grid = [3.0]
    wf = walk_forward(cfg, candles)
    assert len(wf.chosen_parameters) >= 1
    assert wf.aggregate is not None
