from __future__ import annotations

from dataclasses import dataclass
import platform
from typing import Iterable, List, Optional, Tuple

import cv2


@dataclass(frozen=True)
class CameraInfo:
    index: int
    name: Optional[str]
    working: bool


def default_backend() -> Optional[int]:
    """Return the preferred OpenCV backend for the current OS."""
    if platform.system().lower().startswith("win") and cv2.__dict__.get("CAP_DSHOW") is not None:
        return cv2.CAP_DSHOW
    return None


def get_device_names() -> Optional[List[str]]:
    """Return DirectShow device names, if available on this machine."""
    try:
        from pygrabber.dshow_graph import FilterGraph  # type: ignore
    except Exception:
        return None
    try:
        graph = FilterGraph()
        return list(graph.get_input_devices())
    except Exception:
        return None


def find_camera_index_by_name(preferred_name: str, device_names: Optional[List[str]]) -> Optional[int]:
    """Return the camera index that matches the preferred name (case-insensitive)."""
    if not preferred_name or not device_names:
        return None
    preferred = preferred_name.strip().lower()
    for index, name in enumerate(device_names):
        if preferred in name.lower():
            return index
    return None


def _open_capture(index: int, backend: Optional[int]) -> cv2.VideoCapture:
    if backend is None:
        return cv2.VideoCapture(index)
    return cv2.VideoCapture(index, backend)


def _try_open_camera(index: int, backend: Optional[int], warmup: int = 2) -> Tuple[Optional[cv2.VideoCapture], bool]:
    """Try to open a camera index and read a few frames."""
    cap = _open_capture(index, backend)
    if not cap.isOpened():
        cap.release()
        return None, False
    for _ in range(max(1, warmup)):
        ret, _ = cap.read()
        if not ret:
            cap.release()
            return None, False
    return cap, True


def _configure_camera(
    cap: cv2.VideoCapture,
    width: int,
    height: int,
    fps: Optional[int] = None,
    buffer_size: int = 1,
) -> None:
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    if fps is not None:
        cap.set(cv2.CAP_PROP_FPS, fps)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, buffer_size)
    try:
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))
    except Exception:
        pass


def open_camera_by_index(
    index: int,
    width: int,
    height: int,
    backend: Optional[int],
    fps: Optional[int] = None,
) -> Optional[cv2.VideoCapture]:
    """Open a specific camera index and configure it."""
    cap, ok = _try_open_camera(index, backend)
    if not ok or cap is None:
        return None
    _configure_camera(cap, width, height, fps=fps)
    return cap


def open_first_available(
    indices: Iterable[int],
    width: int,
    height: int,
    backend: Optional[int],
    fps: Optional[int] = None,
) -> Tuple[Optional[cv2.VideoCapture], Optional[int]]:
    """Return the first usable camera from indices, already configured."""
    for index in indices:
        cap = open_camera_by_index(index, width, height, backend, fps=fps)
        if cap is not None:
            return cap, index
    return None, None


def list_working_cameras(indices: Iterable[int], backend: Optional[int]) -> List[int]:
    """Return the indices that open and can read a frame."""
    working: List[int] = []
    for index in indices:
        cap, ok = _try_open_camera(index, backend)
        if ok and cap is not None:
            working.append(index)
            cap.release()
    return working


def probe_cameras(indices: Iterable[int], backend: Optional[int]) -> List[CameraInfo]:
    """Return camera info for each index, including device names when available."""
    device_names = get_device_names()
    infos: List[CameraInfo] = []
    for index in indices:
        cap, ok = _try_open_camera(index, backend)
        if ok and cap is not None:
            cap.release()
        name = None
        if device_names and index < len(device_names):
            name = device_names[index]
        infos.append(CameraInfo(index=index, name=name, working=ok))
    return infos
