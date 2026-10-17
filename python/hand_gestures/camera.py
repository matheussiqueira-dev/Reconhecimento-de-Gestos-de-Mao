"""Camera discovery and setup for OpenCV (from the master branch camera_utils.py).

OpenCV is imported lazily so the pure helpers (name lookup) stay testable
without the runtime dependencies installed.
"""

from __future__ import annotations

import platform
from collections.abc import Iterable
from contextlib import ExitStack
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CameraInfo:
    index: int
    name: str | None
    working: bool


def _cv2() -> Any:
    import cv2

    return cv2


def default_backend() -> int | None:
    """DirectShow on Windows (faster to open, exposes device names); OpenCV's default elsewhere."""
    cv2 = _cv2()
    if platform.system().lower().startswith("win") and hasattr(cv2, "CAP_DSHOW"):
        return int(cv2.CAP_DSHOW)
    return None


def get_device_names() -> list[str] | None:
    """DirectShow device names, if the optional `pygrabber` package is installed (Windows)."""
    try:
        from pygrabber.dshow_graph import FilterGraph
    except ImportError:
        return None
    try:
        return [str(name) for name in FilterGraph().get_input_devices()]
    except Exception:  # comtypes.COMError or a driver failure: name lookup is optional
        return None


def find_camera_index_by_name(preferred_name: str, device_names: list[str] | None) -> int | None:
    """Index of the first device whose name contains `preferred_name` (case-insensitive)."""
    preferred = preferred_name.strip().lower()
    if not preferred or not device_names:
        return None
    for index, name in enumerate(device_names):
        if preferred in name.lower():
            return index
    return None


def _try_open_camera(index: int, backend: int | None, warmup: int = 2) -> Any | None:
    """Open a camera index and read a few frames; None if it does not deliver frames."""
    cv2 = _cv2()
    cap = cv2.VideoCapture(index) if backend is None else cv2.VideoCapture(index, backend)
    with ExitStack() as resources:
        resources.callback(cap.release)
        if not cap.isOpened():
            return None
        for _ in range(max(1, warmup)):
            ok, _frame = cap.read()
            if not ok:
                return None
        resources.pop_all()  # Ownership transfers to the caller only after warmup succeeds.
    return cap


def _configure_camera(cap: Any, width: int, height: int, fps: int | None) -> None:
    cv2 = _cv2()
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    if fps is not None:
        cap.set(cv2.CAP_PROP_FPS, fps)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    # MJPG lets most USB webcams reach 30 fps at 720p; drivers that refuse it keep their default.
    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))


def open_camera_by_index(
    index: int, width: int, height: int, backend: int | None, fps: int | None = None
) -> Any | None:
    cap = _try_open_camera(index, backend)
    if cap is not None:
        with ExitStack() as resources:
            resources.callback(cap.release)
            _configure_camera(cap, width, height, fps)
            resources.pop_all()
    return cap


def open_first_available(
    indices: Iterable[int], width: int, height: int, backend: int | None, fps: int | None = None
) -> tuple[Any | None, int | None]:
    for index in indices:
        cap = open_camera_by_index(index, width, height, backend, fps)
        if cap is not None:
            return cap, index
    return None, None


def probe_cameras(indices: Iterable[int], backend: int | None) -> list[CameraInfo]:
    """Which indices deliver frames, with DirectShow names when available."""
    device_names = get_device_names()
    infos: list[CameraInfo] = []
    for index in indices:
        cap = _try_open_camera(index, backend)
        if cap is not None:
            cap.release()
        name = device_names[index] if device_names and index < len(device_names) else None
        infos.append(CameraInfo(index=index, name=name, working=cap is not None))
    return infos
