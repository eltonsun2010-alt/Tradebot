"""Pytest configuration.

Ensures the project root (this directory) is importable so the flat module
layout (``config``, ``indicators``, ``strategy`` …) resolves regardless of the
directory pytest is invoked from.
"""

import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
