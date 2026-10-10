from __future__ import annotations

from collections import Counter, deque
from dataclasses import dataclass
from math import sqrt
from typing import Deque, List, Sequence, Tuple


@dataclass(frozen=True)
class HandAnalysis:
    finger_states: List[int]
    total: int
    gesture: str
    pinch_strength: float
    pinch_distance: float


_FINGER_TIP_PIP_PAIRS = [
    (8, 6),   # Indicador
    (12, 10), # Medio
    (16, 14), # Anular
    (20, 18), # Minimo
]

_GESTURE_MAP = {
    (0, 0, 0, 0, 0): "Soco",
    (1, 1, 1, 1, 1): "Mao Aberta",
    (0, 1, 1, 0, 0): "Paz",
    (0, 1, 0, 0, 1): "Rock",
    (1, 0, 0, 0, 0): "Polegar",
    (0, 1, 0, 0, 0): "Indicador",
    (1, 1, 0, 0, 0): "L",
    (0, 1, 1, 1, 0): "Tres",
    (0, 1, 1, 1, 1): "Quatro",
}

_PINCH_DISTANCE_THRESHOLD = 0.35


class FingerStateSmoother:
    def __init__(self, window: int = 5) -> None:
        self._window = max(1, window)
        self._history: Deque[List[int]] = deque(maxlen=self._window)

    def update(self, state: Sequence[int]) -> List[int]:
        self._history.append(list(state))
        if not self._history:
            return list(state)
        counts = [0] * len(state)
        for sample in self._history:
            for idx, value in enumerate(sample):
                if value:
                    counts[idx] += 1
        threshold = len(self._history) / 2
        return [1 if counts[idx] >= threshold else 0 for idx in range(len(state))]


class LabelSmoother:
    def __init__(self, window: int = 5) -> None:
        self._window = max(1, window)
        self._history: Deque[str] = deque(maxlen=self._window)

    def update(self, label: str) -> str:
        self._history.append(label)
        return Counter(self._history).most_common(1)[0][0]


def count_fingers(landmarks: Sequence, handedness_label: str) -> Tuple[int, List[int]]:
    """Return the total raised fingers and their states [polegar, ind, med, anu, min]."""
    analysis = analyze_hand(landmarks, handedness_label)
    return analysis.total, analysis.finger_states


def analyze_hand(landmarks: Sequence, handedness_label: str) -> HandAnalysis:
    """Return finger states, total, gesture label, and pinch metrics."""
    finger_states: List[int] = []
    for tip_id, pip_id in _FINGER_TIP_PIP_PAIRS:
        finger_states.append(1 if landmarks[tip_id].y < landmarks[pip_id].y else 0)

    thumb_state = _thumb_is_open(landmarks, handedness_label)
    finger_states.insert(0, thumb_state)

    total = sum(finger_states)
    pinch_distance = _normalized_distance(landmarks[4], landmarks[8], _palm_size(landmarks))
    pinch_strength = max(0.0, 1.0 - pinch_distance / _PINCH_DISTANCE_THRESHOLD)
    gesture = _classify_gesture(finger_states, pinch_distance)
    return HandAnalysis(
        finger_states=finger_states,
        total=total,
        gesture=gesture,
        pinch_strength=pinch_strength,
        pinch_distance=pinch_distance,
    )


def _thumb_is_open(landmarks: Sequence, handedness_label: str) -> int:
    tip_x = landmarks[4].x
    ip_x = landmarks[3].x
    label = handedness_label.strip().lower()

    if label.startswith("r"):
        return 1 if tip_x < ip_x else 0
    return 1 if tip_x > ip_x else 0


def _classify_gesture(fingers: Sequence[int], pinch_distance: float) -> str:
    if pinch_distance <= _PINCH_DISTANCE_THRESHOLD:
        if fingers[2] == 1 and fingers[3] == 1 and fingers[4] == 1:
            return "OK"
        if fingers[2] == 0 and fingers[3] == 0 and fingers[4] == 0:
            return "Pinch"
    return _GESTURE_MAP.get(tuple(fingers), "Desconhecido")


def _distance(a: Sequence, b: Sequence) -> float:
    return sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)


def _palm_size(landmarks: Sequence) -> float:
    palm = _distance(landmarks[0], landmarks[9])
    return palm if palm > 1e-6 else 1e-6


def _normalized_distance(a: Sequence, b: Sequence, scale: float) -> float:
    return _distance(a, b) / scale
