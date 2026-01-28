from __future__ import annotations

from typing import Iterable, List, Optional, Tuple

import cv2


def _try_open_camera(index: int) -> Tuple[Optional[cv2.VideoCapture], bool]:
    """Try to open a camera index and read a single frame."""
    cap = cv2.VideoCapture(index)
    if not cap.isOpened():
        cap.release()
        return None, False
    ret, _ = cap.read()
    if not ret:
        cap.release()
        return None, False
    return cap, True


def open_first_available(
    indices: Iterable[int],
    width: int,
    height: int,
) -> Tuple[Optional[cv2.VideoCapture], Optional[int]]:
    """Return the first usable camera from indices, already configured."""
    for index in indices:
        cap, ok = _try_open_camera(index)
        if not ok or cap is None:
            continue
        cap.set(3, width)
        cap.set(4, height)
        return cap, index
    return None, None


def list_working_cameras(indices: Iterable[int]) -> List[int]:
    """Return the indices that open and can read a frame."""
    working: List[int] = []
    for index in indices:
        cap, ok = _try_open_camera(index)
        if ok and cap is not None:
            working.append(index)
            cap.release()
    return working
