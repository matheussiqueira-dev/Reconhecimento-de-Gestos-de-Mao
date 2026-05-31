"""Finger counting heuristics based on MediaPipe hand landmarks."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Protocol


class LandmarkLike(Protocol):
    x: float
    y: float


FINGER_NAMES = ("thumb", "index", "middle", "ring", "pinky")
TIP_IDS = (4, 8, 12, 16, 20)
PIP_IDS = (3, 6, 10, 14, 18)


@dataclass(frozen=True)
class FingerCountResult:
    fingers: tuple[bool, bool, bool, bool, bool]
    total: int

    @property
    def as_dict(self) -> dict[str, bool]:
        return dict(zip(FINGER_NAMES, self.fingers, strict=True))


def _xy(point: LandmarkLike | dict[str, float] | Iterable[float]) -> tuple[float, float]:
    if hasattr(point, "x") and hasattr(point, "y"):
        return float(point.x), float(point.y)
    if isinstance(point, dict):
        return float(point["x"]), float(point["y"])
    values = list(point)
    if len(values) < 2:
        raise ValueError("Landmark iterables must contain at least x and y.")
    return float(values[0]), float(values[1])


class FingerCounter:
    """Counts raised fingers from the 21 MediaPipe landmarks."""

    def count(
        self,
        landmarks: list[LandmarkLike | dict[str, float] | Iterable[float]],
        handedness: str = "Right",
    ) -> FingerCountResult:
        if len(landmarks) < 21:
            raise ValueError("Expected at least 21 hand landmarks.")

        thumb_tip_x, _ = _xy(landmarks[TIP_IDS[0]])
        thumb_pip_x, _ = _xy(landmarks[PIP_IDS[0]])
        normalized_handedness = handedness.lower()
        thumb_open = (
            thumb_tip_x < thumb_pip_x
            if normalized_handedness == "right"
            else thumb_tip_x > thumb_pip_x
        )

        raised = [thumb_open]
        for tip_id, pip_id in zip(TIP_IDS[1:], PIP_IDS[1:], strict=True):
            _, tip_y = _xy(landmarks[tip_id])
            _, pip_y = _xy(landmarks[pip_id])
            raised.append(tip_y < pip_y)

        fingers = tuple(raised)
        return FingerCountResult(
            fingers=fingers,  # type: ignore[arg-type]
            total=sum(1 for value in fingers if value),
        )
