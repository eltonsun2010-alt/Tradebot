"""Charting for backtest results.

Uses matplotlib with the non-interactive ``Agg`` backend so charts render in
headless environments (servers, CI). Produces an equity curve, a drawdown
chart, a price chart with trade markers and a monthly-returns bar chart.
"""

from __future__ import annotations

import os
from typing import List

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402  (must follow backend selection)
import pandas as pd  # noqa: E402

from backtesting.metrics import PerformanceReport  # noqa: E402
from exchange.base import Trade  # noqa: E402
from strategy.signals import Side  # noqa: E402


def plot_equity_curve(equity: pd.Series, path: str) -> str:
    """Render the equity curve to *path* and return the path."""

    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot(equity.index, equity.values, color="#1f77b4", linewidth=1.2)
    ax.set_title("Equity Curve")
    ax.set_xlabel("Time")
    ax.set_ylabel("Equity")
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
    return path


def plot_drawdown(equity: pd.Series, path: str) -> str:
    """Render the drawdown curve to *path* and return the path."""

    running_max = equity.cummax()
    drawdown = (equity - running_max) / running_max * 100.0
    fig, ax = plt.subplots(figsize=(11, 4))
    ax.fill_between(drawdown.index, drawdown.values, 0, color="#d62728", alpha=0.4)
    ax.set_title("Drawdown")
    ax.set_xlabel("Time")
    ax.set_ylabel("Drawdown (%)")
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
    return path


def plot_trades(data: pd.DataFrame, trades: List[Trade], path: str) -> str:
    """Render price with entry/exit markers to *path* and return the path."""

    fig, ax = plt.subplots(figsize=(12, 6))
    ax.plot(data.index, data["close"], color="#333333", linewidth=0.8, label="Close")
    if "ema_fast" in data:
        ax.plot(data.index, data["ema_fast"], color="#1f77b4", linewidth=0.7,
                alpha=0.7, label="EMA fast")
    if "ema_slow" in data:
        ax.plot(data.index, data["ema_slow"], color="#ff7f0e", linewidth=0.7,
                alpha=0.7, label="EMA slow")

    for t in trades:
        entry_marker = "^" if t.side is Side.LONG else "v"
        entry_color = "#2ca02c" if t.side is Side.LONG else "#d62728"
        ax.scatter(t.entry_time, t.entry_price, marker=entry_marker,
                   color=entry_color, s=45, zorder=5)
        exit_color = "#2ca02c" if t.is_win else "#d62728"
        ax.scatter(t.exit_time, t.exit_price, marker="x", color=exit_color,
                   s=45, zorder=5)

    ax.set_title("Price with Trade Markers")
    ax.set_xlabel("Time")
    ax.set_ylabel("Price")
    ax.legend(loc="best", fontsize=8)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
    return path


def plot_monthly_returns(report: PerformanceReport, path: str) -> str:
    """Render a monthly-returns bar chart to *path* and return the path."""

    fig, ax = plt.subplots(figsize=(11, 4))
    months = list(report.monthly_returns.keys())
    values = list(report.monthly_returns.values())
    colors = ["#2ca02c" if v >= 0 else "#d62728" for v in values]
    ax.bar(months, values, color=colors)
    ax.set_title("Monthly Returns (%)")
    ax.set_xlabel("Month")
    ax.set_ylabel("Return (%)")
    ax.axhline(0, color="#000000", linewidth=0.6)
    plt.setp(ax.get_xticklabels(), rotation=90, fontsize=7)
    ax.grid(True, alpha=0.3, axis="y")
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
    return path


def generate_all_charts(
    equity: pd.Series,
    data: pd.DataFrame,
    trades: List[Trade],
    report: PerformanceReport,
    out_dir: str,
) -> List[str]:
    """Generate every chart into *out_dir* and return the list of file paths."""

    os.makedirs(out_dir, exist_ok=True)
    paths = [
        plot_equity_curve(equity, os.path.join(out_dir, "equity_curve.png")),
        plot_drawdown(equity, os.path.join(out_dir, "drawdown.png")),
        plot_trades(data, trades, os.path.join(out_dir, "trades.png")),
        plot_monthly_returns(report, os.path.join(out_dir, "monthly_returns.png")),
    ]
    return paths
