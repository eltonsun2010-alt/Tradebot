"""Tests for the backtesting engine and performance metrics."""

import pandas as pd
import pytest

from backtesting.engine import Backtester
from backtesting.metrics import compute_metrics
from config import Config
from data.loader import generate_synthetic_ohlcv
from exchange.base import Trade
from strategy.signals import Side


def test_backtest_runs_and_produces_equity_curve():
    candles = generate_synthetic_ohlcv(periods=1500, regime="bull", seed=7)
    result = Backtester(Config()).run(candles)
    assert len(result.equity_curve) > 0
    assert isinstance(result.trades, list)
    # Equity curve is aligned to the (post-warmup) candle timeline.
    assert result.equity_curve.index.is_monotonic_increasing


def test_backtest_no_position_left_open():
    candles = generate_synthetic_ohlcv(periods=1500, regime="sideways", seed=3)
    bt = Backtester(Config())
    result = bt.run(candles)
    # After the run every trade must have an exit time >= entry time.
    for t in result.trades:
        assert t.exit_time >= t.entry_time


def test_backtest_deterministic():
    candles = generate_synthetic_ohlcv(periods=1200, regime="bull", seed=11)
    r1 = Backtester(Config()).run(candles)
    r2 = Backtester(Config()).run(candles)
    assert [t.pnl for t in r1.trades] == [t.pnl for t in r2.trades]


def test_backtest_respects_risk_free_capital():
    # With no trades the equity curve should stay flat at the initial balance.
    candles = generate_synthetic_ohlcv(periods=300, regime="low_vol", seed=5)
    cfg = Config()
    # Impossible RSI thresholds guarantee no entries.
    cfg.strategy.rsi_oversold = -10
    cfg.strategy.rsi_overbought = 200
    result = Backtester(cfg).run(candles)
    assert len(result.trades) == 0
    assert result.equity_curve.iloc[-1] == pytest.approx(cfg.backtest.initial_balance)


def _make_trades(pnls):
    trades = []
    base = pd.Timestamp("2022-01-01", tz="UTC")
    for i, p in enumerate(pnls):
        trades.append(
            Trade(
                side=Side.LONG,
                size=1.0,
                entry_time=base + pd.Timedelta(hours=i),
                entry_price=100.0,
                exit_time=base + pd.Timedelta(hours=i + 1),
                exit_price=100.0 + p,
                pnl=p,
                gross_pnl=p,
                commission=0.0,
                reason="test",
            )
        )
    return trades


def test_metrics_win_rate_and_profit_factor():
    trades = _make_trades([10, -5, 20, -5])
    equity = pd.Series(
        [10_000, 10_010, 10_005, 10_025, 10_020],
        index=pd.date_range("2022-01-01", periods=5, freq="1h", tz="UTC"),
    )
    report = compute_metrics(equity, trades, 10_000, 24 * 365)
    assert report.num_trades == 4
    assert report.win_rate == pytest.approx(50.0)
    # gross profit 30, gross loss 10 -> PF 3.0
    assert report.profit_factor == pytest.approx(3.0)
    assert report.best_winning_streak == 1
    assert report.worst_losing_streak == 1


def test_metrics_max_drawdown():
    equity = pd.Series(
        [100, 120, 90, 130],
        index=pd.date_range("2022-01-01", periods=4, freq="1h", tz="UTC"),
    )
    report = compute_metrics(equity, [], 100, 24 * 365)
    # Peak 120 -> trough 90 = -25%.
    assert report.max_drawdown_pct == pytest.approx(-25.0)


def test_metrics_empty_is_safe():
    equity = pd.Series(dtype=float)
    report = compute_metrics(equity, [], 10_000, 24 * 365)
    assert report.num_trades == 0
    assert report.final_equity == pytest.approx(10_000)
