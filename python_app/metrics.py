"""Session metrics for the hand gesture recognizer."""

from __future__ import annotations

from collections import Counter, deque
from dataclasses import dataclass, field
from time import perf_counter


@dataclass(frozen=True)
class MetricsSnapshot:
    frames: int
    fps: float
    uptime_seconds: float
    most_common_gesture: str
    average_fingers: float


@dataclass
class GestureMetrics:
    """Tracks FPS and aggregate gesture statistics."""

    history_size: int = 120
    started_at: float = field(default_factory=perf_counter)
    frames: int = 0
    _last_frame_at: float | None = None
    _fps_values: deque[float] = field(default_factory=lambda: deque(maxlen=120))
    _gestures: Counter[str] = field(default_factory=Counter)
    _finger_counts: deque[int] = field(default_factory=lambda: deque(maxlen=120))

    def update(self, gesture: str, fingers: int) -> MetricsSnapshot:
        now = perf_counter()
        if self._last_frame_at is not None:
            delta = max(now - self._last_frame_at, 1e-6)
            self._fps_values.append(1 / delta)
        self._last_frame_at = now

        self.frames += 1
        self._gestures[gesture] += 1
        self._finger_counts.append(fingers)
        return self.snapshot()

    def snapshot(self) -> MetricsSnapshot:
        uptime = perf_counter() - self.started_at
        fps = (
            sum(self._fps_values) / len(self._fps_values)
            if self._fps_values
            else 0.0
        )
        average_fingers = (
            sum(self._finger_counts) / len(self._finger_counts)
            if self._finger_counts
            else 0.0
        )
        most_common = self._gestures.most_common(1)
        return MetricsSnapshot(
            frames=self.frames,
            fps=fps,
            uptime_seconds=uptime,
            most_common_gesture=most_common[0][0] if most_common else "Sem gesto",
            average_fingers=average_fingers,
        )
