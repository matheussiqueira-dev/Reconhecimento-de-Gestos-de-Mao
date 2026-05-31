"""OpenCV overlay renderer for local feedback."""

from __future__ import annotations

from typing import Any

from python_app.gesture_classifier import Gesture
from python_app.metrics import MetricsSnapshot


def draw_overlay(
    frame: Any,
    gesture: Gesture,
    fingers: int,
    metrics: MetricsSnapshot,
) -> Any:
    """Draws gesture and performance information on a camera frame."""

    try:
        import cv2  # type: ignore[import-not-found]
    except ImportError:
        return frame

    cv2.rectangle(frame, (16, 16), (430, 150), (16, 32, 48), -1)
    cv2.putText(
        frame,
        f"Gesto: {gesture.label}",
        (32, 52),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2,
    )
    cv2.putText(
        frame,
        f"Dedos: {fingers} | FPS: {metrics.fps:.1f}",
        (32, 88),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (52, 211, 153),
        2,
    )
    cv2.putText(
        frame,
        "Pressione q para sair",
        (32, 124),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.58,
        (251, 191, 36),
        2,
    )
    return frame
