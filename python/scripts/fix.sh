#!/usr/bin/env sh
# Apply ruff's code style and its safe fixes. Run from python/.
set -eu

ruff format .
ruff check --fix .
