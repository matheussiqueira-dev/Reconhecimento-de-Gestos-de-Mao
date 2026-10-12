from __future__ import annotations

import tomllib
from pathlib import Path

import hand_gestures


def test_package_version_matches_pyproject() -> None:
    pyproject = Path(__file__).resolve().parents[1] / "pyproject.toml"
    with pyproject.open("rb") as file:
        version = tomllib.load(file)["project"]["version"]

    assert hand_gestures.__version__ == version
