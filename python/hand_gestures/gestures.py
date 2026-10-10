"""Explainable gesture rules over the 21 MediaPipe hand landmarks.

Ported from the original desktop app (master branch, gesture_logic.py). The web
app implements the same rules in web/src/lib/gestures; both are checked against
the golden fixtures in fixtures/gestures.

Landmarks are expected in the SELFIE frame (image flipped horizontally before
inference), which is also the frame MediaPipe assumes when it labels handedness.
"""

from __future__ import annotations

import math
import unicodedata
from collections import Counter, deque
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Protocol


class LandmarkLike(Protocol):
    @property
    def x(self) -> float: ...

    @property
    def y(self) -> float: ...


Landmark = LandmarkLike | Mapping[str, float] | Sequence[float]
FingerStates = tuple[int, int, int, int, int]

LANDMARK_COUNT = 21
PINCH_DISTANCE_THRESHOLD = 0.35

FINGER_NAMES = ("Polegar", "Indicador", "Médio", "Anelar", "Mínimo")

# (tip, pip) pairs for index, middle, ring and pinky.
_FINGER_TIP_PIP_PAIRS = ((8, 6), (12, 10), (16, 14), (20, 18))
_THUMB_TIP, _THUMB_IP = 4, 3
_INDEX_TIP, _WRIST, _MIDDLE_MCP = 8, 0, 9

GESTURE_LABELS: dict[str, str] = {
    "fist": "Punho fechado",
    "open_palm": "Mão aberta",
    "peace": "Paz",
    "rock": "Rock",
    "thumb": "Polegar",
    "index": "Indicador",
    "l_shape": "L",
    "three": "Três",
    "four": "Quatro",
    "ok": "OK",
    "pinch": "Pinça",
    "unknown": "Gesto não mapeado",
}

_GESTURE_BY_FINGERS: dict[tuple[int, ...], str] = {
    (0, 0, 0, 0, 0): "fist",
    (1, 1, 1, 1, 1): "open_palm",
    (0, 1, 1, 0, 0): "peace",
    (0, 1, 0, 0, 1): "rock",
    (1, 0, 0, 0, 0): "thumb",
    (0, 1, 0, 0, 0): "index",
    (1, 1, 0, 0, 0): "l_shape",
    (0, 1, 1, 1, 0): "three",
    (0, 1, 1, 1, 1): "four",
}


@dataclass(frozen=True)
class HandAnalysis:
    finger_states: FingerStates
    total: int
    gesture: str
    pinch_strength: float
    pinch_distance: float

    @property
    def label(self) -> str:
        return gesture_label(self.gesture)


def gesture_label(gesture: str) -> str:
    return GESTURE_LABELS.get(gesture, GESTURE_LABELS["unknown"])


def ascii_label(text: str) -> str:
    """OpenCV's Hershey fonts only draw ASCII: "Mão aberta" -> "Mao aberta"."""
    decomposed = unicodedata.normalize("NFKD", text)
    return (
        "".join(ch for ch in decomposed if not unicodedata.combining(ch))
        .encode("ascii", "replace")
        .decode("ascii")
    )


def _xy(point: Landmark | None) -> tuple[float, float]:
    if point is None:
        raise ValueError("Landmark coordinates must be finite numbers, got a missing landmark.")
    if isinstance(point, Mapping):
        x, y = float(point["x"]), float(point["y"])
    elif isinstance(point, Sequence):
        if len(point) < 2:
            raise ValueError("A landmark sequence needs at least x and y.")
        x, y = float(point[0]), float(point[1])
    else:
        x, y = float(point.x), float(point.y)
    if not (math.isfinite(x) and math.isfinite(y)):
        raise ValueError("Landmark coordinates must be finite numbers.")
    return x, y


def analyze_hand(landmarks: Sequence[Landmark], handedness: str) -> HandAnalysis:
    """Finger states [thumb, index, middle, ring, pinky], gesture and pinch metrics."""
    if len(landmarks) < LANDMARK_COUNT:
        raise ValueError(f"Expected {LANDMARK_COUNT} hand landmarks, got {len(landmarks)}.")
    points = [_xy(point) for point in landmarks[:LANDMARK_COUNT]]

    index, middle, ring, pinky = (
        1 if points[tip][1] < points[pip][1] else 0 for tip, pip in _FINGER_TIP_PIP_PAIRS
    )
    states: FingerStates = (_thumb_is_open(points, handedness), index, middle, ring, pinky)

    palm = max(math.dist(points[_WRIST], points[_MIDDLE_MCP]), 1e-6)
    pinch_distance = math.dist(points[_THUMB_TIP], points[_INDEX_TIP]) / palm
    pinch_strength = max(0.0, 1.0 - pinch_distance / PINCH_DISTANCE_THRESHOLD)
    return HandAnalysis(
        finger_states=states,
        total=sum(states),
        gesture=classify_gesture(states, pinch_distance),
        pinch_strength=pinch_strength,
        pinch_distance=pinch_distance,
    )


def _thumb_is_open(points: Sequence[tuple[float, float]], handedness: str) -> int:
    tip_x, ip_x = points[_THUMB_TIP][0], points[_THUMB_IP][0]
    if handedness.strip().lower().startswith("r"):
        return 1 if tip_x < ip_x else 0
    return 1 if tip_x > ip_x else 0


def classify_gesture(fingers: Sequence[int], pinch_distance: float) -> str:
    if pinch_distance <= PINCH_DISTANCE_THRESHOLD:
        middle, ring, pinky = fingers[2], fingers[3], fingers[4]
        if middle and ring and pinky:
            return "ok"
        if not (middle or ring or pinky):
            return "pinch"
    key = tuple(1 if value else 0 for value in fingers)
    return _GESTURE_BY_FINGERS.get(key, "unknown")


class FingerStateSmoother:
    """Majority vote per finger over the last `window` frames (ties count as up)."""

    def __init__(self, window: int = 5) -> None:
        self._history: deque[tuple[int, ...]] = deque(maxlen=max(1, window))

    def update(self, states: Sequence[int]) -> tuple[int, ...]:
        self._history.append(tuple(states))
        threshold = len(self._history) / 2
        counts = [sum(sample[i] for sample in self._history) for i in range(len(states))]
        return tuple(1 if count >= threshold else 0 for count in counts)


class LabelSmoother:
    """Most frequent label over the last `window` frames; ties keep the oldest label."""

    def __init__(self, window: int = 5) -> None:
        self._history: deque[str] = deque(maxlen=max(1, window))

    def update(self, label: str) -> str:
        self._history.append(label)
        return Counter(self._history).most_common(1)[0][0]
