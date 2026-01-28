from __future__ import annotations

from dataclasses import dataclass
from typing import List, Sequence, Tuple


@dataclass(frozen=True)
class Point:
    x: float
    y: float


_FINGER_TIP_PIP_PAIRS = [
    (8, 6),   # Indicador
    (12, 10), # Medio
    (16, 14), # Anular
    (20, 18), # Minimo
]


def count_fingers(landmarks: Sequence, handedness_label: str) -> Tuple[int, List[int]]:
    """Return the total raised fingers and their states [polegar, ind, med, anu, min]."""
    fingers_status: List[int] = []
    for tip_id, pip_id in _FINGER_TIP_PIP_PAIRS:
        fingers_status.append(1 if landmarks[tip_id].y < landmarks[pip_id].y else 0)

    thumb_state = _thumb_is_open(landmarks, handedness_label)
    fingers_status.insert(0, thumb_state)
    return sum(fingers_status), fingers_status


def _thumb_is_open(landmarks: Sequence, handedness_label: str) -> int:
    tip_x = landmarks[4].x
    ip_x = landmarks[3].x
    label = handedness_label.strip().lower()

    if label.startswith("r"):
        return 1 if tip_x < ip_x else 0
    return 1 if tip_x > ip_x else 0
