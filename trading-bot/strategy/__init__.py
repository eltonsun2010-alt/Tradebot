"""Trading strategy: signal generation and position management."""

from .filters import FilterResult, add_filter_columns, apply_filters
from .signals import (
    ExitResult,
    Side,
    Signal,
    SignalType,
    add_signal_columns,
    check_exit,
    compute_stops,
    generate_signal,
    update_trailing_stop,
)

__all__ = [
    "Side",
    "Signal",
    "SignalType",
    "ExitResult",
    "generate_signal",
    "add_signal_columns",
    "compute_stops",
    "update_trailing_stop",
    "check_exit",
    "FilterResult",
    "apply_filters",
    "add_filter_columns",
]
