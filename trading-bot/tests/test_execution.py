"""Tests for the paper broker (trade execution and accounting)."""

from datetime import datetime, timezone

import pytest

from config import CostConfig
from exchange.paper import PaperBroker
from strategy.signals import Side


def _ts(minute: int = 0) -> datetime:
    return datetime(2022, 1, 1, 0, minute, tzinfo=timezone.utc)


def test_open_and_close_long_profit():
    broker = PaperBroker(10_000, CostConfig(commission=0, slippage=0, spread=0))
    broker.open_position(Side.LONG, size=1.0, price=100.0, timestamp=_ts(0),
                         stop_loss=95.0, take_profit=110.0, atr_value=2.0)
    assert broker.get_position() is not None
    trade = broker.close_position(price=110.0, timestamp=_ts(5), reason="take_profit")
    assert trade is not None
    assert trade.pnl == pytest.approx(10.0)
    assert broker.get_position() is None
    assert broker.get_balance() == pytest.approx(10_010.0)


def test_open_and_close_short_profit():
    broker = PaperBroker(10_000, CostConfig(commission=0, slippage=0, spread=0))
    broker.open_position(Side.SHORT, size=1.0, price=100.0, timestamp=_ts(0),
                         stop_loss=105.0, take_profit=90.0, atr_value=2.0)
    trade = broker.close_position(price=90.0, timestamp=_ts(5), reason="take_profit")
    assert trade.pnl == pytest.approx(10.0)


def test_commission_reduces_pnl():
    broker = PaperBroker(10_000, CostConfig(commission=0.001, slippage=0, spread=0))
    broker.open_position(Side.LONG, 1.0, 100.0, _ts(0), 95.0, 110.0, 2.0)
    trade = broker.close_position(110.0, _ts(5), "take_profit")
    # Commission on entry (100*0.001) + exit (110*0.001) = 0.1 + 0.11 = 0.21
    assert trade.commission == pytest.approx(0.21)
    assert trade.pnl == pytest.approx(10.0 - 0.21)


def test_slippage_and_spread_hurt_fills():
    broker = PaperBroker(10_000, CostConfig(commission=0, slippage=0.001, spread=0.001))
    broker.open_position(Side.LONG, 1.0, 100.0, _ts(0), 95.0, 110.0, 2.0)
    pos = broker.get_position()
    # Buy fill is worse (higher) than the requested price.
    assert pos.entry_price > 100.0


def test_equity_tracks_unrealised_pnl():
    broker = PaperBroker(10_000, CostConfig(commission=0, slippage=0, spread=0))
    broker.open_position(Side.LONG, 2.0, 100.0, _ts(0), 95.0, 110.0, 2.0)
    assert broker.get_equity(105.0) == pytest.approx(10_010.0)


def test_cannot_open_two_positions():
    broker = PaperBroker(10_000, CostConfig())
    broker.open_position(Side.LONG, 1.0, 100.0, _ts(0), 95.0, 110.0, 2.0)
    with pytest.raises(RuntimeError):
        broker.open_position(Side.LONG, 1.0, 100.0, _ts(1), 95.0, 110.0, 2.0)


def test_close_without_position_returns_none():
    broker = PaperBroker(10_000, CostConfig())
    assert broker.close_position(100.0, _ts(0), "x") is None


def test_trade_history_records_trades():
    broker = PaperBroker(10_000, CostConfig(commission=0, slippage=0, spread=0))
    broker.open_position(Side.LONG, 1.0, 100.0, _ts(0), 95.0, 110.0, 2.0)
    broker.close_position(110.0, _ts(5), "take_profit")
    assert len(broker.trades) == 1
    assert broker.trades[0].is_win
