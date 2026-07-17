"""Tests for strategy signal generation and trade management."""

import pandas as pd
import pytest

from config import StrategyConfig
from indicators.core import ATR, ATR_AVG, EMA_FAST, EMA_SLOW, RSI
from strategy.signals import (
    Side,
    SignalType,
    check_exit,
    compute_stops,
    generate_signal,
    update_trailing_stop,
)


def _row(close, ema_fast, ema_slow, rsi_val, atr_val, atr_avg):
    return pd.Series(
        {
            "close": close,
            EMA_FAST: ema_fast,
            EMA_SLOW: ema_slow,
            RSI: rsi_val,
            ATR: atr_val,
            ATR_AVG: atr_avg,
        }
    )


def test_long_signal_fires_on_valid_setup():
    prev = _row(100, 101, 100, 28.0, 2.0, 1.0)
    cur = _row(103, 101, 100, 32.0, 2.0, 1.0)  # RSI crosses up through 30
    sig = generate_signal(cur, prev, StrategyConfig())
    assert sig.type is SignalType.ENTER_LONG
    assert sig.side is Side.LONG


def test_long_signal_requires_rsi_cross():
    # RSI already above 30 on previous bar -> no cross.
    prev = _row(100, 101, 100, 31.0, 2.0, 1.0)
    cur = _row(103, 101, 100, 35.0, 2.0, 1.0)
    sig = generate_signal(cur, prev, StrategyConfig())
    assert sig.type is SignalType.NONE


def test_long_signal_requires_close_above_ema_fast():
    prev = _row(100, 101, 100, 28.0, 2.0, 1.0)
    cur = _row(100.5, 101, 100, 32.0, 2.0, 1.0)  # close below fast EMA
    sig = generate_signal(cur, prev, StrategyConfig())
    assert sig.type is SignalType.NONE


def test_long_signal_requires_volatility():
    prev = _row(100, 101, 100, 28.0, 1.0, 2.0)
    cur = _row(103, 101, 100, 32.0, 1.0, 2.0)  # ATR below its average
    sig = generate_signal(cur, prev, StrategyConfig())
    assert sig.type is SignalType.NONE


def test_short_signal_fires_on_valid_setup():
    prev = _row(100, 99, 100, 72.0, 2.0, 1.0)
    cur = _row(97, 99, 100, 68.0, 2.0, 1.0)  # RSI crosses down through 70
    sig = generate_signal(cur, prev, StrategyConfig())
    assert sig.type is SignalType.ENTER_SHORT
    assert sig.side is Side.SHORT


def test_allow_short_flag_disables_shorts():
    prev = _row(100, 99, 100, 72.0, 2.0, 1.0)
    cur = _row(97, 99, 100, 68.0, 2.0, 1.0)
    cfg = StrategyConfig(allow_short=False)
    sig = generate_signal(cur, prev, cfg)
    assert sig.type is SignalType.NONE


def test_nan_indicators_produce_no_signal():
    # NaN in a warming-up indicator the rule depends on must veto the signal.
    prev = _row(100, 101, 100, float("nan"), 2.0, 1.0)  # prev RSI still warming up
    cur = _row(103, 101, 100, 32.0, 2.0, 1.0)
    sig = generate_signal(cur, prev, StrategyConfig())
    assert sig.type is SignalType.NONE


def test_compute_stops_long():
    stop, tp = compute_stops(100.0, 2.0, Side.LONG, StrategyConfig())
    assert stop == pytest.approx(100 - 1.5 * 2.0)
    assert tp == pytest.approx(100 + 3.0 * 2.0)


def test_compute_stops_short():
    stop, tp = compute_stops(100.0, 2.0, Side.SHORT, StrategyConfig())
    assert stop == pytest.approx(100 + 1.5 * 2.0)
    assert tp == pytest.approx(100 - 3.0 * 2.0)


def test_trailing_stop_moves_up_for_long():
    cfg = StrategyConfig()
    # Price advanced; extreme well above entry -> stop trails up.
    new_stop = update_trailing_stop(
        Side.LONG, entry_price=100.0, current_stop=97.0,
        extreme_price=110.0, atr_value=2.0, config=cfg,
    )
    assert new_stop == pytest.approx(110.0 - 1.5 * 2.0)
    assert new_stop > 97.0


def test_trailing_stop_never_loosens():
    cfg = StrategyConfig()
    new_stop = update_trailing_stop(
        Side.LONG, entry_price=100.0, current_stop=99.0,
        extreme_price=100.5, atr_value=2.0, config=cfg,
    )
    # Trailing calc would give 100.5-3=97.5 which is looser; keep 99.
    assert new_stop == pytest.approx(99.0)


def test_breakeven_moves_stop_to_entry():
    cfg = StrategyConfig(use_trailing_stop=False, use_breakeven=True)
    new_stop = update_trailing_stop(
        Side.LONG, entry_price=100.0, current_stop=97.0,
        extreme_price=102.5, atr_value=2.0, config=cfg,  # 1 ATR profit reached
    )
    assert new_stop == pytest.approx(100.0)


def test_check_exit_long_stop_hit():
    res = check_exit(Side.LONG, stop_loss=97.0, take_profit=106.0,
                     candle_high=98.0, candle_low=96.0)
    assert res.exited and res.reason == "stop_loss" and res.price == 97.0


def test_check_exit_long_take_profit_hit():
    res = check_exit(Side.LONG, stop_loss=97.0, take_profit=106.0,
                     candle_high=107.0, candle_low=100.0)
    assert res.exited and res.reason == "take_profit"


def test_check_exit_stop_priority_when_both_hit():
    # Both inside the candle -> stop assumed first (conservative).
    res = check_exit(Side.LONG, stop_loss=97.0, take_profit=106.0,
                     candle_high=107.0, candle_low=96.0)
    assert res.reason == "stop_loss"


def test_check_exit_no_trigger():
    res = check_exit(Side.LONG, stop_loss=97.0, take_profit=106.0,
                     candle_high=105.0, candle_low=98.0)
    assert not res.exited
