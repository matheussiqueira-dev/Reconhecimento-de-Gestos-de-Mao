"""Entry point for the local Python hand gesture recognizer."""

from __future__ import annotations

import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from python_app.camera import CameraOpenError, CameraStream
from python_app.finger_counter import FingerCounter
from python_app.gesture_classifier import Gesture, GestureClassifier
from python_app.hand_detector import HandDetector
from python_app.metrics import GestureMetrics
from python_app.overlay import draw_overlay


def run() -> int:
    try:
        import cv2  # type: ignore[import-not-found]
    except ImportError:
        print("OpenCV is not installed. Run `pip install -r requirements.txt`.")
        return 1

    camera = CameraStream()
    try:
        camera.open()
    except CameraOpenError as exc:
        print(f"Camera unavailable: {exc}")
        return 1

    detector = HandDetector()
    if not detector.available:
        print(
            "MediaPipe unavailable; camera preview will open without recognition. "
            f"Reason: {detector.unavailable_reason}"
        )

    counter = FingerCounter()
    classifier = GestureClassifier()
    metrics = GestureMetrics()
    last_gesture = Gesture("Sem gesto", 1.0, "Nenhuma mao detectada.")
    last_fingers = 0

    try:
        while True:
            ok, frame = camera.read()
            if not ok or frame is None:
                print("Unable to read camera frame.")
                break

            frame = cv2.flip(frame, 1)
            detected_hands = detector.detect(frame)
            if detected_hands:
                hand = detected_hands[0]
                finger_result = counter.count(hand.landmarks, hand.handedness)
                last_fingers = finger_result.total
                last_gesture = classifier.classify(finger_result.fingers)

            snapshot = metrics.update(last_gesture.label, last_fingers)
            frame = draw_overlay(frame, last_gesture, last_fingers, snapshot)
            cv2.imshow("Hand Gesture Recognition Dashboard", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        detector.close()
        camera.release()

    return 0


if __name__ == "__main__":
    raise SystemExit(run())
