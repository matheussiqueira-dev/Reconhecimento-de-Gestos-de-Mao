"""Session metrics measured from the live loop (nothing here is estimated or simulated)."""

from __future__ import annotations

from collections import Counter, deque
from collections.abc import Callable
from dataclasses import dataclass, field
from time import perf_counter


@dataclass(frozen=True)
class MetricsSnapshot:
    frames: int
    fps: float
    uptime_seconds: float
    most_common_gesture: str | None
    average_fingers: float


@dataclass
class GestureMetrics:
    """Rolling FPS and gesture statistics over the last `history_size` frames."""

    history_size: int = 120
    clock: Callable[[], float] = perf_counter
    frames: int = 0
    _started_at: float = field(init=False)
    _last_frame_at: float | None = field(init=False, default=None)
    _frame_intervals: deque[float] = field(init=False)
    _finger_counts: deque[int] = field(init=False)
    _gestures: Counter[str] = field(init=False, default_factory=Counter)

    def __post_init__(self) -> None:
        size = max(1, self.history_size)
        self._started_at = self.clock()
        self._frame_intervals = deque(maxlen=size)
        self._finger_counts = deque(maxlen=size)

    def update(self, gesture: str | None, fingers: int) -> MetricsSnapshot:
        """Record one processed frame; `gesture` is None when no hand is visible."""
        now = self.clock()
        if self._last_frame_at is not None:
            self._frame_intervals.append(max(now - self._last_frame_at, 1e-6))
        self._last_frame_at = now
        self.frames += 1
        if gesture is not None:
            self._gestures[gesture] += 1
            self._finger_counts.append(fingers)
        return self.snapshot()

    def snapshot(self) -> MetricsSnapshot:
        intervals = self._frame_intervals
        fps = len(intervals) / sum(intervals) if intervals else 0.0
        counts = self._finger_counts
        most_common = self._gestures.most_common(1)
        return MetricsSnapshot(
            frames=self.frames,
            fps=fps,
            uptime_seconds=self.clock() - self._started_at,
            most_common_gesture=most_common[0][0] if most_common else None,
            average_fingers=sum(counts) / len(counts) if counts else 0.0,
        )
