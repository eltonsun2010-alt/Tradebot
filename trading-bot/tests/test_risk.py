"""Tests for the risk manager: sizing and circuit breakers."""

from datetime import date, timedelta

import pytest

from config import RiskConfig
from risk.manager import RiskManager


def make_manager(**overrides) -> RiskManager:
    cfg = RiskConfig(**overrides)
    return RiskManager(cfg)


def test_position_size_risks_configured_fraction():
    mgr = make_manager(risk_per_trade=0.01, max_leverage=100)
    # Risk 1% of 10_000 = 100 over a 5-unit stop distance -> 20 units.
    size = mgr.position_size(equity=10_000, entry_price=100, stop_price=95)
    assert size == pytest.approx(20.0)


def test_position_size_capped_by_leverage():
    mgr = make_manager(risk_per_trade=0.01, max_leverage=2.0)
    # Unconstrained size would be huge with a tiny stop; leverage caps it.
    size = mgr.position_size(equity=10_000, entry_price=100, stop_price=99.99)
    max_size = 2.0 * 10_000 / 100
    assert size == pytest.approx(max_size)


def test_position_size_zero_when_no_stop_distance():
    mgr = make_manager()
    assert mgr.position_size(10_000, 100, 100) == 0.0


def test_position_size_zero_when_no_equity():
    mgr = make_manager()
    assert mgr.position_size(0, 100, 95) == 0.0


def test_daily_loss_halts_trading():
    mgr = make_manager(max_daily_loss=0.05)
    mgr.start_day(date(2022, 1, 1), 10_000)
    assert mgr.can_trade()
    mgr.register_trade_result(pnl=-600, equity_after=9_400)  # 6% > 5%
    assert not mgr.can_trade()
    assert mgr.state.halt_reason == "max_daily_loss"


def test_consecutive_losses_halt_trading():
    mgr = make_manager(max_consecutive_losses=3, max_daily_loss=1.0)
    mgr.start_day(date(2022, 1, 1), 10_000)
    for _ in range(3):
        mgr.register_trade_result(pnl=-10, equity_after=9_990)
    assert not mgr.can_trade()
    assert mgr.state.halt_reason == "max_consecutive_losses"


def test_win_resets_consecutive_losses():
    mgr = make_manager(max_consecutive_losses=3, max_daily_loss=1.0)
    mgr.start_day(date(2022, 1, 1), 10_000)
    mgr.register_trade_result(-10, 9_990)
    mgr.register_trade_result(-10, 9_980)
    mgr.register_trade_result(+50, 10_030)  # win resets streak
    assert mgr.state.consecutive_losses == 0
    assert mgr.can_trade()


def test_new_day_clears_daily_loss_halt():
    mgr = make_manager(max_daily_loss=0.05, max_consecutive_losses=100)
    mgr.start_day(date(2022, 1, 1), 10_000)
    mgr.register_trade_result(-600, 9_400)
    assert not mgr.can_trade()
    # Roll to the next day.
    mgr.on_new_candle(date(2022, 1, 2), 9_400)
    assert mgr.can_trade()


def test_loss_streak_halt_persists_across_days():
    mgr = make_manager(max_daily_loss=1.0, max_consecutive_losses=2)
    mgr.start_day(date(2022, 1, 1), 10_000)
    mgr.register_trade_result(-10, 9_990)
    mgr.register_trade_result(-10, 9_980)
    assert not mgr.can_trade()
    mgr.on_new_candle(date(2022, 1, 2), 9_980)
    # Streak halt is not cleared just by a new day.
    assert not mgr.can_trade()
