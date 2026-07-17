"""Central logging setup.

Provides a single :func:`get_logger` factory so every module logs through the
same configured handlers: a rotating file in the configured log directory plus
an optional console stream. Timestamps are ISO-8601 in UTC.
"""

from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler

from config import LoggingConfig

_CONFIGURED = False


def setup_logging(config: LoggingConfig) -> None:
    """Configure the root logger once for the whole process.

    Safe to call multiple times; only the first call installs handlers.
    """

    global _CONFIGURED
    if _CONFIGURED:
        return

    os.makedirs(config.log_dir, exist_ok=True)
    log_path = os.path.join(config.log_dir, config.log_file)

    root = logging.getLogger("tradingbot")
    root.setLevel(getattr(logging, config.level.upper(), logging.INFO))
    root.propagate = False

    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )

    file_handler = RotatingFileHandler(
        log_path, maxBytes=5_000_000, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(fmt)
    root.addHandler(file_handler)

    if config.console:
        stream = logging.StreamHandler()
        stream.setFormatter(fmt)
        root.addHandler(stream)

    _CONFIGURED = True


def get_logger(name: str, config: LoggingConfig | None = None) -> logging.Logger:
    """Return a child logger under the ``tradingbot`` namespace.

    Args:
        name: Short logger name (e.g. ``"backtest"``).
        config: If provided and logging is not yet configured, sets it up.
    """

    if config is not None:
        setup_logging(config)
    return logging.getLogger(f"tradingbot.{name}")
