"""Tests for configuration loading and immutability of defaults."""

import os
from dataclasses import replace

from config import Config, ExchangeConfig, get_config


def test_default_config_has_expected_indicator_periods():
    cfg = get_config()
    assert cfg.indicators.ema_fast_period == 14
    assert cfg.indicators.ema_slow_period == 50
    assert cfg.indicators.rsi_period == 14
    assert cfg.indicators.atr_period == 14


def test_default_risk_is_one_percent():
    assert get_config().risk.risk_per_trade == 0.01


def test_config_is_deeply_copyable_without_shared_state():
    a = Config()
    b = replace(a, strategy=replace(a.strategy, atr_stop_multiplier=2.5))
    assert a.strategy.atr_stop_multiplier == 1.5
    assert b.strategy.atr_stop_multiplier == 2.5


def test_exchange_credentials_come_from_env(monkeypatch):
    monkeypatch.setenv("EXCHANGE_API_KEY", "key123")
    monkeypatch.setenv("EXCHANGE_API_SECRET", "secret456")
    exch = ExchangeConfig.from_env()
    assert exch.api_key == "key123"
    assert exch.api_secret == "secret456"


def test_exchange_config_does_not_hardcode_secrets():
    # A freshly constructed config must not contain credentials.
    exch = ExchangeConfig()
    assert exch.api_key == ""
    assert exch.api_secret == ""


def test_from_env_preserves_non_secret_fields():
    base = ExchangeConfig(name="binance", symbol="ETH/USDT", timeframe="4h")
    exch = ExchangeConfig.from_env(base)
    assert exch.symbol == "ETH/USDT"
    assert exch.timeframe == "4h"


def test_optimization_grids_are_independent_lists():
    a = Config()
    b = Config()
    a.optimization.ema_fast_grid.append(999)
    assert 999 not in b.optimization.ema_fast_grid
