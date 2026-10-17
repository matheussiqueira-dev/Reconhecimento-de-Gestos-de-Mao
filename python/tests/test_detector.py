from __future__ import annotations

import sys
import time
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from hand_gestures import detector


@pytest.fixture
def runtime(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    runtime = MagicMock()
    monkeypatch.setitem(sys.modules, "mediapipe", runtime)
    monkeypatch.setattr(detector, "read_model", lambda _path: b"verified model")
    return runtime


def test_tasks_options_and_strictly_increasing_video_timestamps(
    runtime: MagicMock, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(time, "monotonic", lambda: 100.0)
    backend = runtime.tasks.vision.HandLandmarker.create_from_options.return_value
    points = [SimpleNamespace(x=0.2, y=0.3)] * 21
    backend.detect_for_video.return_value = SimpleNamespace(
        hand_landmarks=[points, points],
        handedness=[[SimpleNamespace(category_name="Left", score=0.91)], []],
    )
    with detector.HandDetector(min_tracking_confidence=0.6) as tracker:
        hands = tracker.detect(object())
        tracker.detect(object())
    options = runtime.tasks.vision.HandLandmarkerOptions.call_args.kwargs
    assert options["num_hands"] == 2
    assert options["min_hand_detection_confidence"] == 0.7
    assert options["min_tracking_confidence"] == 0.6
    assert [call.args[1] for call in backend.detect_for_video.call_args_list] == [0, 1]
    assert hands[0].landmarks == points
    assert hands[0].handedness == "Left"
    assert hands[0].score == 0.91
    assert hands[1].score == 0.0
    tracker.close()
    backend.close.assert_called_once()
    with pytest.raises(RuntimeError, match="closed"):
        tracker.detect(object())


def test_no_hands_and_cleanup_after_inference_failure(runtime: MagicMock) -> None:
    backend = runtime.tasks.vision.HandLandmarker.create_from_options.return_value
    backend.detect_for_video.return_value = SimpleNamespace(hand_landmarks=[], handedness=[])
    tracker = detector.HandDetector()
    assert tracker.detect(object()) == []
    backend.detect_for_video.side_effect = RuntimeError("inference failed")
    with pytest.raises(RuntimeError, match="inference"), tracker:
        tracker.detect(object())
    backend.close.assert_called_once()


def test_missing_model_has_actionable_error(runtime: MagicMock, tmp_path: Path) -> None:
    with pytest.MonkeyPatch.context() as patch:
        from hand_gestures.model import read_model

        patch.setattr(detector, "read_model", read_model)
        with pytest.raises(detector.DetectorUnavailableError, match=r"hand_gestures\.model"):
            detector.HandDetector(model_path=tmp_path / "absent.task")
    runtime.tasks.vision.HandLandmarker.create_from_options.assert_not_called()


def test_runtime_initialisation_failure_is_wrapped(runtime: MagicMock) -> None:
    runtime.tasks.vision.HandLandmarker.create_from_options.side_effect = ValueError("native error")
    with pytest.raises(detector.DetectorUnavailableError, match="Could not initialise"):
        detector.HandDetector()
