"""Smoke tests for the command-line entry point."""

import json

from main import main


def test_backtest_command_runs(capsys):
    rc = main(["backtest", "--periods", "2500", "--regime", "bull", "--seed", "1"])
    out = capsys.readouterr().out
    assert rc == 0
    assert "PERFORMANCE REPORT" in out


def test_backtest_command_writes_json(tmp_path):
    path = tmp_path / "report.json"
    rc = main(["backtest", "--periods", "2500", "--json", str(path), "--seed", "1"])
    assert rc == 0
    data = json.loads(path.read_text())
    assert "total_return_pct" in data
    assert "sharpe_ratio" in data


def test_paper_command_runs(capsys):
    rc = main(["paper", "--periods", "2500", "--regime", "sideways", "--seed", "2"])
    out = capsys.readouterr().out
    assert rc == 0
    assert "Final paper balance" in out


def test_validate_command_runs(capsys):
    rc = main(["validate", "--periods", "2000", "--seed", "3"])
    out = capsys.readouterr().out
    assert rc == 0
    for regime in ["bull", "bear", "sideways"]:
        assert regime in out


def test_live_refuses_without_credentials(capsys, monkeypatch):
    monkeypatch.delenv("EXCHANGE_API_KEY", raising=False)
    monkeypatch.delenv("EXCHANGE_API_SECRET", raising=False)
    rc = main(["live"])
    assert rc == 2


def test_charts_are_generated(tmp_path):
    charts = tmp_path / "charts"
    rc = main(["backtest", "--periods", "3000", "--charts", str(charts), "--seed", "1"])
    assert rc == 0
    for name in ["equity_curve.png", "drawdown.png", "trades.png", "monthly_returns.png"]:
        assert (charts / name).exists()
