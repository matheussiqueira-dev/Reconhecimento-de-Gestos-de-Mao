"""MediaPipe Hands (legacy `mp.solutions` API) behind a small, testable interface.

`mp.solutions` was removed in mediapipe 0.10.30; requirements.txt pins 0.10.21,
the last release that ships it with Python 3.12 wheels.
"""

from __future__ import annotations

from dataclasses import dataclass
from types import TracebackType
from typing import Any


class DetectorUnavailableError(RuntimeError):
    """MediaPipe is missing or is a release without the legacy Hands solution."""


@dataclass(frozen=True)
class DetectedHand:
    landmarks: Any  # sequence of 21 NormalizedLandmark (x, y, z in 0..1)
    handedness: str  # "Right" or "Left", assuming a mirrored (selfie) frame
    score: float  # the model's handedness confidence, 0..1


class HandDetector:
    def __init__(
        self,
        max_num_hands: int = 2,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.5,
    ) -> None:
        try:
            import mediapipe as mp
        except ImportError as exc:
            raise DetectorUnavailableError(
                "MediaPipe is not installed. Run `pip install -r requirements.txt`."
            ) from exc
        solutions = getattr(mp, "solutions", None)
        if solutions is None:
            raise DetectorUnavailableError(
                f"mediapipe {getattr(mp, '__version__', '?')} has no `solutions` module; "
                "install the pinned version from requirements.txt (0.10.21)."
            )
        self._hands = solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def detect(self, rgb_frame: Any) -> list[DetectedHand]:
        """Run inference on an RGB frame that is already flipped (selfie view)."""
        result = self._hands.process(rgb_frame)
        if not result.multi_hand_landmarks:
            return []
        detected: list[DetectedHand] = []
        handedness = result.multi_handedness or []
        for index, hand_landmarks in enumerate(result.multi_hand_landmarks):
            label, score = "Right", 0.0
            if index < len(handedness) and handedness[index].classification:
                category = handedness[index].classification[0]
                label, score = str(category.label), float(category.score)
            detected.append(DetectedHand(hand_landmarks.landmark, label, score))
        return detected

    def close(self) -> None:
        self._hands.close()

    def __enter__(self) -> HandDetector:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.close()
