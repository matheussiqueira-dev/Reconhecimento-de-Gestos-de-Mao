"""Explicit, bounded download of the same versioned model used by the web app."""

from __future__ import annotations

import hashlib
import tempfile
from pathlib import Path
from urllib.request import urlopen

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
MODEL_SHA256 = "fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1"
MODEL_SIZE_BYTES = 7_819_105
DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "hand_landmarker.task"


class ModelUnavailableError(RuntimeError):
    """The pinned model is missing or its integrity check failed."""


def _verify(data: bytes) -> bytes:
    if len(data) != MODEL_SIZE_BYTES or hashlib.sha256(data).hexdigest() != MODEL_SHA256:
        raise ModelUnavailableError(
            "Model integrity check failed. Remove the invalid model and run "
            "`python -m hand_gestures.model` again."
        )
    return data


def read_model(path: Path) -> bytes:
    try:
        with path.open("rb") as source:
            return _verify(source.read(MODEL_SIZE_BYTES + 1))
    except OSError as exc:
        raise ModelUnavailableError(
            "Model unavailable. Run `python -m hand_gestures.model` from python/."
        ) from exc


def download_model(path: Path = DEFAULT_MODEL_PATH) -> Path:
    if path.exists():
        read_model(path)
        return path
    with urlopen(MODEL_URL, timeout=30) as response:
        data = _verify(response.read(MODEL_SIZE_BYTES + 1))
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".tmp", delete=False) as target:
            temporary = Path(target.name)
            target.write(data)
        temporary.replace(path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return path


def main() -> int:
    try:
        download_model()
    except (OSError, ModelUnavailableError):
        print("Could not download a verified model. Check connectivity and the local model file.")
        return 1
    print(f"Hand Landmarker float16 v1 ready (SHA-256 {MODEL_SHA256}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
