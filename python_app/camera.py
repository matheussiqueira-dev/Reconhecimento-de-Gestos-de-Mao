"""Camera access helpers with clear runtime fallback behavior."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class CameraConfig:
    """Configuration for the OpenCV camera stream."""

    index: int = 0
    width: int = 1280
    height: int = 720


class CameraOpenError(RuntimeError):
    """Raised when the webcam cannot be opened safely."""


class CameraStream:
    """Small wrapper around OpenCV VideoCapture."""

    def __init__(self, config: CameraConfig | None = None) -> None:
        self.config = config or CameraConfig()
        self._capture: Any | None = None
        self._cv2: Any | None = None

    @property
    def is_open(self) -> bool:
        return bool(self._capture and self._capture.isOpened())

    def open(self) -> None:
        try:
            import cv2  # type: ignore[import-not-found]
        except ImportError as exc:
            raise CameraOpenError(
                "OpenCV is not installed. Run `pip install -r requirements.txt`."
            ) from exc

        capture = cv2.VideoCapture(self.config.index)
        if not capture.isOpened():
            capture.release()
            raise CameraOpenError(
                "No webcam was detected. Check the camera permission and device index."
            )

        capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.width)
        capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.height)
        self._cv2 = cv2
        self._capture = capture

    def read(self) -> tuple[bool, Any | None]:
        if not self._capture:
            return False, None
        return self._capture.read()

    def release(self) -> None:
        if self._capture:
            self._capture.release()
        if self._cv2:
            self._cv2.destroyAllWindows()
        self._capture = None
