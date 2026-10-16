from __future__ import annotations

import sys
from unittest.mock import MagicMock

import pytest

from hand_gestures import camera


@pytest.fixture
def capture(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    cv2 = MagicMock()
    monkeypatch.setitem(sys.modules, "cv2", cv2)
    cap: MagicMock = cv2.VideoCapture.return_value
    cap.isOpened.return_value = True
    cap.read.return_value = (True, object())
    return cap


@pytest.mark.parametrize("failure", ["closed", "warmup", "read-error", "configure"])
def test_unsuccessful_open_releases_capture(capture: MagicMock, failure: str) -> None:
    if failure == "closed":
        capture.isOpened.return_value = False
    elif failure == "warmup":
        capture.read.return_value = (False, None)
    elif failure == "read-error":
        capture.read.side_effect = RuntimeError("driver read")
    else:
        capture.set.side_effect = RuntimeError("driver settings")
    if failure in {"read-error", "configure"}:
        with pytest.raises(RuntimeError, match="driver"):
            camera.open_camera_by_index(0, 640, 360, None)
    else:
        assert camera.open_camera_by_index(0, 640, 360, None) is None
    capture.release.assert_called_once()


def test_successful_open_transfers_ownership(capture: MagicMock) -> None:
    assert camera.open_camera_by_index(0, 640, 360, None, fps=30) is capture
    assert capture.read.call_count == 2
    capture.release.assert_not_called()


def test_probe_releases_capture(capture: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(camera, "get_device_names", lambda: ["Synthetic"])
    infos = camera.probe_cameras([0], None)
    assert infos == [camera.CameraInfo(index=0, name="Synthetic", working=True)]
    capture.release.assert_called_once()
