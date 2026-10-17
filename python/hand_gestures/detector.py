"""MediaPipe Tasks adapter; gesture rules stay independent of the inference runtime."""

from __future__ import annotations

import time
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from types import TracebackType
from typing import Any

from hand_gestures.gestures import LandmarkLike
from hand_gestures.model import DEFAULT_MODEL_PATH, ModelUnavailableError, read_model


class DetectorUnavailableError(RuntimeError):
    """The runtime or the verified model could not be initialised."""


@dataclass(frozen=True)
class DetectedHand:
    landmarks: Sequence[LandmarkLike]
    handedness: str  # "Right" or "Left", assuming a mirrored (selfie) frame
    score: float  # the model's handedness confidence, 0..1


class HandDetector:
    def __init__(
        self,
        max_num_hands: int = 2,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.5,
        *,
        model_path: Path = DEFAULT_MODEL_PATH,
    ) -> None:
        try:
            import mediapipe as mp

            model = read_model(model_path)
            options = mp.tasks.vision.HandLandmarkerOptions(
                base_options=mp.tasks.BaseOptions(model_asset_buffer=model),
                running_mode=mp.tasks.vision.RunningMode.VIDEO,
                num_hands=max_num_hands,
                min_hand_detection_confidence=min_detection_confidence,
                min_hand_presence_confidence=0.5,
                min_tracking_confidence=min_tracking_confidence,
            )
            self._image = mp.Image
            self._image_format = mp.ImageFormat.SRGB
            self._hands = mp.tasks.vision.HandLandmarker.create_from_options(options)
        except ImportError as exc:
            raise DetectorUnavailableError(
                "MediaPipe is not installed. Run `pip install -r requirements.txt`."
            ) from exc
        except ModelUnavailableError as exc:
            raise DetectorUnavailableError(str(exc)) from exc
        except (AttributeError, OSError, RuntimeError, ValueError) as exc:
            raise DetectorUnavailableError(
                "Could not initialise MediaPipe Tasks. Check the pinned runtime and model."
            ) from exc
        self._started_at = time.monotonic()
        self._last_timestamp_ms = -1
        self._closed = False

    def detect(self, rgb_frame: Any) -> list[DetectedHand]:
        """Process an RGB selfie frame with a strictly increasing video timestamp."""
        if self._closed:
            raise RuntimeError("The hand detector is closed.")
        timestamp_ms = max(
            self._last_timestamp_ms + 1, int((time.monotonic() - self._started_at) * 1000)
        )
        self._last_timestamp_ms = timestamp_ms
        image = self._image(image_format=self._image_format, data=rgb_frame)
        result = self._hands.detect_for_video(image, timestamp_ms)
        detected: list[DetectedHand] = []
        for index, landmarks in enumerate(result.hand_landmarks):
            categories = result.handedness[index] if index < len(result.handedness) else []
            category = categories[0] if categories else None
            detected.append(
                DetectedHand(
                    landmarks,
                    str(category.category_name) if category else "Right",
                    float(category.score) if category else 0.0,
                )
            )
        return detected

    def close(self) -> None:
        if not self._closed:
            self._closed = True
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
