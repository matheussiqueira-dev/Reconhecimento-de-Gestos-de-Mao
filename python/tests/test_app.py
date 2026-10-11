from __future__ import annotations

from typing import Any

import pytest

from hand_gestures import app, camera


def test_defaults_do_not_require_a_specific_camera() -> None:
    config = app.parse_args([])

    assert config.camera_name is None
    assert config.camera_index is None
    assert config.max_hands == 2
    assert config.min_detection_confidence == 0.7
    assert config.min_tracking_confidence == 0.5
    assert config.smoothing_window == 5
    assert config.mirror is True


@pytest.mark.parametrize(
    "argv",
    [
        ["--min-detection", "1.5"],
        ["--min-tracking", "-0.1"],
        ["--smoothing", "0"],
        ["--width", "0"],
    ],
)
def test_rejects_out_of_range_options(argv: list[str]) -> None:
    with pytest.raises(SystemExit):
        app.parse_args(argv)


def test_blank_camera_name_means_no_preference() -> None:
    assert app.parse_args(["--camera-name", "   "]).camera_name is None


class FakeCapture:
    def __init__(self, index: int) -> None:
        self.index = index


def patch_camera(
    monkeypatch: pytest.MonkeyPatch, working: set[int], names: list[str] | None
) -> None:
    def open_by_index(index: int, *_args: Any) -> FakeCapture | None:
        return FakeCapture(index) if index in working else None

    def open_first(indices: Any, *_args: Any) -> tuple[FakeCapture | None, int | None]:
        for index in indices:
            if index in working:
                return FakeCapture(index), index
        return None, None

    monkeypatch.setattr(app, "open_camera_by_index", open_by_index)
    monkeypatch.setattr(app, "open_first_available", open_first)
    monkeypatch.setattr(app, "get_device_names", lambda: names)


def test_without_preferences_uses_the_first_working_camera(monkeypatch: pytest.MonkeyPatch) -> None:
    patch_camera(monkeypatch, working={2}, names=None)

    cap, label = app.select_camera(app.parse_args([]), backend=None)

    assert isinstance(cap, FakeCapture)
    assert cap.index == 2
    assert label == "Indice 2"


def test_camera_by_name(monkeypatch: pytest.MonkeyPatch) -> None:
    patch_camera(monkeypatch, working={0, 1}, names=["Integrated Webcam", "Logitech Brio 305"])

    cap, label = app.select_camera(app.parse_args(["--camera-name", "brio"]), backend=None)

    assert isinstance(cap, FakeCapture)
    assert cap.index == 1
    assert label == "Logitech Brio 305"


def test_missing_named_camera_fails_unless_fallback_is_allowed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    patch_camera(monkeypatch, working={0}, names=["Integrated Webcam"])

    cap, _ = app.select_camera(app.parse_args(["--camera-name", "Brio"]), backend=None)
    assert cap is None

    cap, label = app.select_camera(
        app.parse_args(["--camera-name", "Brio", "--allow-fallback"]), backend=None
    )
    assert isinstance(cap, FakeCapture)
    assert label == "Indice 0"


def test_find_camera_index_by_name() -> None:
    names = ["Integrated Webcam", "Logitech BRIO 305"]

    assert camera.find_camera_index_by_name("brio 305", names) == 1
    assert camera.find_camera_index_by_name("  ", names) is None
    assert camera.find_camera_index_by_name("Brio", None) is None
    assert camera.find_camera_index_by_name("Kinect", names) is None
