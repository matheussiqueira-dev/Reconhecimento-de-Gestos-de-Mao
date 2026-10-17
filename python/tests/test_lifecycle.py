from __future__ import annotations

import sys
from unittest.mock import MagicMock

import pytest

from hand_gestures import app
from hand_gestures.detector import DetectorUnavailableError


@pytest.fixture
def devices(monkeypatch: pytest.MonkeyPatch) -> tuple[MagicMock, MagicMock, MagicMock]:
    cv2, capture, tracker = MagicMock(), MagicMock(), MagicMock()
    cv2.error = RuntimeError
    monkeypatch.setitem(sys.modules, "cv2", cv2)
    monkeypatch.setattr(app, "default_backend", lambda: None)
    monkeypatch.setattr(app, "HandDetector", MagicMock(return_value=tracker))
    monkeypatch.setattr(app, "select_camera", MagicMock(return_value=(capture, "Synthetic")))
    capture.read.return_value = (True, object())
    tracker.detect.return_value = []
    return cv2, capture, tracker


def test_frame_limit_releases_resources(devices: tuple[MagicMock, MagicMock, MagicMock]) -> None:
    cv2, capture, tracker = devices
    config = app.parse_args(["--headless", "--no-ui", "--no-landmarks", "--max-frames", "2"])
    assert app.run(config) == 0
    assert tracker.detect.call_count == 2
    capture.release.assert_called_once()
    tracker.close.assert_called_once()
    cv2.destroyAllWindows.assert_not_called()


@pytest.mark.parametrize("failure", ["read", "infer", "window", "release", "conversion"])
def test_failures_release_camera_and_detector(
    devices: tuple[MagicMock, MagicMock, MagicMock], failure: str
) -> None:
    cv2, capture, tracker = devices
    if failure == "read":
        capture.read.return_value = (False, None)
    elif failure == "infer":
        tracker.detect.side_effect = RuntimeError("inference failure")
    elif failure == "window":
        cv2.namedWindow.side_effect = RuntimeError("window failure")
    elif failure == "release":
        capture.release.side_effect = RuntimeError("driver failure")
    else:
        cv2.cvtColor.side_effect = RuntimeError("conversion failure")
    config = app.parse_args(["--no-ui", "--no-landmarks", "--max-frames", "1"])
    assert app.run(config) == 1
    capture.release.assert_called_once()
    tracker.close.assert_called_once()
    cv2.destroyAllWindows.assert_called_once()


def test_selection_failure_closes_detector(
    devices: tuple[MagicMock, MagicMock, MagicMock], monkeypatch: pytest.MonkeyPatch
) -> None:
    _, capture, tracker = devices
    monkeypatch.setattr(app, "select_camera", MagicMock(side_effect=RuntimeError("driver")))
    assert app.run(app.parse_args([])) == 1
    tracker.close.assert_called_once()
    capture.release.assert_not_called()


def test_missing_runtime_has_actionable_exit(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(app, "run", MagicMock(side_effect=ImportError("cv2")))
    assert app.main([]) == 1
    output = capsys.readouterr()
    assert "requirements.txt" in output.out
    assert "ImportError: cv2" in output.err


def test_runtime_failure_reports_its_root_cause(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    missing = OSError("libEGL.so.1: cannot open shared object file")
    failure = DetectorUnavailableError("Could not initialise MediaPipe Tasks.")
    failure.__cause__ = missing
    monkeypatch.setattr(app, "self_check", MagicMock(side_effect=failure))

    assert app.main(["--self-check"]) == 1
    err = capsys.readouterr().err
    assert "DetectorUnavailableError: Could not initialise MediaPipe Tasks." in err
    assert "OSError: libEGL.so.1: cannot open shared object file" in err
