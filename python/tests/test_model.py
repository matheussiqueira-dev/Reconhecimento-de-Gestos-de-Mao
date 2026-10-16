from __future__ import annotations

import hashlib
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from hand_gestures import model


@pytest.fixture
def model_data(monkeypatch: pytest.MonkeyPatch) -> bytes:
    data = b"fixture model bytes"
    monkeypatch.setattr(model, "MODEL_SIZE_BYTES", len(data))
    monkeypatch.setattr(model, "MODEL_SHA256", hashlib.sha256(data).hexdigest())
    return data


def test_verified_download_is_atomic_and_reuses_local_model(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, model_data: bytes
) -> None:
    request = MagicMock()
    request.return_value.__enter__.return_value.read.return_value = model_data
    monkeypatch.setattr(model, "urlopen", request)
    destination = tmp_path / "models" / "hand.task"
    assert model.download_model(destination) == destination
    assert model.read_model(destination) == model_data
    assert model.download_model(destination) == destination
    request.assert_called_once_with(model.MODEL_URL, timeout=30)
    request.return_value.__enter__.return_value.read.assert_called_once_with(len(model_data) + 1)
    assert list(destination.parent.glob("*.tmp")) == []


@pytest.mark.parametrize("data", [b"corrupt", b"fixture model byteX", b"fixture model bytes extra"])
def test_corrupt_download_never_creates_a_model(
    data: bytes, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, model_data: bytes
) -> None:
    request = MagicMock()
    request.return_value.__enter__.return_value.read.return_value = data
    monkeypatch.setattr(model, "urlopen", request)
    destination = tmp_path / "hand.task"
    with pytest.raises(model.ModelUnavailableError, match="integrity"):
        model.download_model(destination)
    assert not destination.exists()


def test_failed_replacement_cleans_temporary_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, model_data: bytes
) -> None:
    request = MagicMock()
    request.return_value.__enter__.return_value.read.return_value = model_data
    monkeypatch.setattr(model, "urlopen", request)
    monkeypatch.setattr(Path, "replace", MagicMock(side_effect=OSError("disk unavailable")))
    with pytest.raises(OSError, match="disk unavailable"):
        model.download_model(tmp_path / "hand.task")
    assert list(tmp_path.iterdir()) == []


def test_corrupt_existing_model_is_not_silently_replaced(tmp_path: Path) -> None:
    path = tmp_path / "hand.task"
    path.write_bytes(b"invalid")
    with pytest.raises(model.ModelUnavailableError, match="integrity"):
        model.download_model(path)
    assert path.read_bytes() == b"invalid"
