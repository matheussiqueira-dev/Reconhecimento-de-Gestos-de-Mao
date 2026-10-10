from __future__ import annotations

from collections.abc import Iterator

import pytest

from hand_gestures.metrics import GestureMetrics


def fake_clock(times: list[float]) -> Iterator[float]:
    yield from times


def make_metrics(times: list[float], history_size: int = 120) -> GestureMetrics:
    ticks = fake_clock(times)
    return GestureMetrics(history_size=history_size, clock=lambda: next(ticks))


def test_tracks_frames_fps_and_gestures() -> None:
    # started_at, then (update, snapshot) per frame
    metrics = make_metrics([0.0, 0.0, 0.0, 0.1, 0.1, 0.2, 0.2])

    first = metrics.update("Mão aberta", 5)
    second = metrics.update("Mão aberta", 5)
    third = metrics.update("Paz", 2)

    assert (first.frames, second.frames, third.frames) == (1, 2, 3)
    assert first.fps == 0.0
    assert third.fps == pytest.approx(10.0)
    assert third.most_common_gesture == "Mão aberta"
    assert third.average_fingers == pytest.approx(4.0)
    assert third.uptime_seconds == pytest.approx(0.2)


def test_frames_without_a_hand_do_not_count_as_gestures() -> None:
    metrics = make_metrics([0.0, 0.0, 0.0])

    snapshot = metrics.update(None, 0)

    assert snapshot.frames == 1
    assert snapshot.most_common_gesture is None
    assert snapshot.average_fingers == 0.0


def test_history_size_bounds_the_rolling_window() -> None:
    times = [0.0] + [t for i in range(4) for t in (i * 1.0, i * 1.0)]
    metrics = make_metrics(times, history_size=2)
    snapshot = None
    for fingers in (1, 2, 3, 4):
        snapshot = metrics.update("x", fingers)

    assert snapshot is not None
    assert snapshot.average_fingers == pytest.approx(3.5)
    assert snapshot.fps == pytest.approx(1.0)
