"""Backtesting engine, performance metrics and plotting."""

from .engine import Backtester, BacktestResult
from .metrics import PerformanceReport, compute_metrics

__all__ = [
    "Backtester",
    "BacktestResult",
    "PerformanceReport",
    "compute_metrics",
]
