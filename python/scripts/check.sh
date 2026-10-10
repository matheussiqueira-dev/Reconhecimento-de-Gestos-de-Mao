#!/usr/bin/env sh
# Static checks and tests for the desktop app. Run from python/ after
# `pip install -r requirements-dev.txt` (the same steps CI runs).
set -eu

ruff check .
ruff format --check .
mypy
python -m pytest -q --cov --cov-report=term-missing
