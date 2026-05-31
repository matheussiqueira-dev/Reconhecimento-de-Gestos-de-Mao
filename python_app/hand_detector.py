"""MediaPipe hand detector with lazy imports for testable modules."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class DetectedHand:
    landmarks: list[Any]
    handedness: str


class HandDetector:
    """Wraps MediaPipe Hands and degrades gracefully when unavailable."""

    def __init__(
        self,
        max_num_hands: int = 1,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.6,
    ) -> None:
        self.available = False
        self.unavailable_reason = ""
        self._cv2: Any | None = None
        self._hands: Any | None = None

        try:
            import cv2  # type: ignore[import-not-found]
            import mediapipe as mp  # type: ignore[import-not-found]
        except ImportError as exc:
            self.unavailable_reason = str(exc)
            return

        self._cv2 = cv2
        self._hands = mp.solutions.hands.Hands(
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self.available = True

    def detect(self, frame: Any) -> list[DetectedHand]:
        if not self.available or self._cv2 is None or self._hands is None:
            return []

        rgb_frame = self._cv2.cvtColor(frame, self._cv2.COLOR_BGR2RGB)
        result = self._hands.process(rgb_frame)
        if not result.multi_hand_landmarks:
            return []

        detected: list[DetectedHand] = []
        handedness_values = result.multi_handedness or []
        for index, hand_landmarks in enumerate(result.multi_hand_landmarks):
            handedness = "Right"
            if index < len(handedness_values):
                classifications = handedness_values[index].classification
                if classifications:
                    handedness = classifications[0].label
            detected.append(DetectedHand(hand_landmarks.landmark, handedness))
        return detected

    def close(self) -> None:
        if self._hands:
            self._hands.close()
