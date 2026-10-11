"""OpenCV HUD for the desktop app (layout from the master branch hand_gestures.py).

Colours are the shared ms-tokens values converted to OpenCV's BGR order.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from hand_gestures.gestures import ascii_label

BGR = tuple[int, int, int]

# ms-tokens.css v1.0, as (blue, green, red).
THEME: dict[str, BGR] = {
    "surface": (28, 22, 19),  # --ms-surface
    "border": (133, 115, 107),  # --ms-border-control
    "text": (236, 231, 228),  # --ms-text
    "muted": (184, 171, 163),  # --ms-text-secondary
    "inactive": (122, 107, 100),  # --ms-text-disabled
    "accent": (254, 242, 0),  # --ms-accent (the gesture being performed)
    "halo": (8, 6, 4),  # --ms-media-halo, drawn opaque under every mark
}

HAND_CONNECTIONS: tuple[tuple[int, int], ...] = (
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17),
)  # fmt: skip


@dataclass(frozen=True)
class HandView:
    side: str  # "Direita" / "Esquerda"
    score: float
    gesture: str
    total: int
    states: Sequence[int]
    pinch_strength: float


def _cv2() -> Any:
    import cv2

    return cv2


def draw_text(frame: Any, text: str, origin: tuple[int, int], scale: float, color: BGR) -> None:
    cv2 = _cv2()
    x, y = origin
    safe = ascii_label(text)
    cv2.putText(frame, safe, (x, y), cv2.FONT_HERSHEY_DUPLEX, scale, THEME["halo"], 3, cv2.LINE_AA)
    cv2.putText(frame, safe, (x, y), cv2.FONT_HERSHEY_DUPLEX, scale, color, 1, cv2.LINE_AA)


def draw_panel(frame: Any, x: int, y: int, w: int, h: int, *, alpha: float = 0.85) -> None:
    cv2 = _cv2()
    overlay = frame.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), THEME["surface"], -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    cv2.rectangle(frame, (x, y), (x + w, y + h), THEME["border"], 1)


def draw_landmarks(frame: Any, landmarks: Sequence[Any], highlight: bool) -> None:
    """Halo first, then the line, so marks stay readable over bright frames."""
    cv2 = _cv2()
    height, width = frame.shape[:2]
    points = [(int(p.x * width), int(p.y * height)) for p in landmarks]
    color = THEME["accent"] if highlight else THEME["text"]
    for start, end in HAND_CONNECTIONS:
        cv2.line(frame, points[start], points[end], THEME["halo"], 4, cv2.LINE_AA)
        cv2.line(frame, points[start], points[end], color, 2, cv2.LINE_AA)
    for point in points:
        cv2.circle(frame, point, 4, THEME["halo"], -1, cv2.LINE_AA)
        cv2.circle(frame, point, 2, color, -1, cv2.LINE_AA)


def _draw_finger_bars(frame: Any, x: int, y: int, states: Sequence[int], scale: float) -> None:
    cv2 = _cv2()
    bar_w, bar_h, gap = int(10 * scale), int(26 * scale), int(6 * scale)
    for idx, state in enumerate(states):
        left = x + idx * (bar_w + gap)
        color = THEME["accent"] if state else THEME["inactive"]
        cv2.rectangle(frame, (left, y - bar_h), (left + bar_w, y), color, -1)


def _draw_pinch_meter(frame: Any, x: int, y: int, strength: float, scale: float) -> None:
    cv2 = _cv2()
    meter_w, meter_h = int(100 * scale), int(8 * scale)
    filled = int(meter_w * max(0.0, min(1.0, strength)))
    cv2.rectangle(frame, (x, y), (x + meter_w, y + meter_h), THEME["inactive"], -1)
    cv2.rectangle(frame, (x, y), (x + filled, y + meter_h), THEME["accent"], -1)


def draw_hud(frame: Any, camera_name: str, fps: float, hands: Sequence[HandView]) -> None:
    height, width = frame.shape[:2]
    scale = max(0.7, min(1.25, width / 960))
    pad = int(14 * scale)
    top_h = int(64 * scale)
    left_w = int(width * 0.6)
    right_w = width - left_w - pad * 3
    right_x = pad + left_w + pad

    draw_panel(frame, pad, pad, left_w, top_h)
    draw_panel(frame, right_x, pad, right_w, top_h)
    draw_text(frame, "Gestos de Mao", (pad * 2, pad + int(26 * scale)), scale * 0.75, THEME["text"])
    draw_text(
        frame,
        f"Camera: {camera_name}",
        (pad * 2, pad + int(50 * scale)),
        scale * 0.55,
        THEME["muted"],
    )
    draw_text(
        frame,
        f"FPS: {fps:4.1f}",
        (right_x + pad, pad + int(28 * scale)),
        scale * 0.7,
        THEME["text"],
    )
    draw_text(
        frame,
        f"Maos: {len(hands)}",
        (right_x + pad, pad + int(52 * scale)),
        scale * 0.55,
        THEME["muted"],
    )

    card_w, card_h = int(width * 0.36), int(120 * scale)
    base_y = pad + top_h + pad
    if not hands:
        draw_panel(frame, pad, base_y, card_w, int(48 * scale))
        draw_text(
            frame,
            "Nenhuma mao detectada",
            (pad * 2, base_y + int(30 * scale)),
            scale * 0.6,
            THEME["muted"],
        )

    for idx, hand in enumerate(hands[:2]):
        card_y = base_y + idx * (card_h + pad)
        if card_y + card_h > height - pad:
            break
        draw_panel(frame, pad, card_y, card_w, card_h)
        draw_text(
            frame,
            f"Mao {hand.side} (modelo {hand.score:.0%})",
            (pad * 2, card_y + int(28 * scale)),
            scale * 0.6,
            THEME["text"],
        )
        draw_text(
            frame,
            f"Gesto: {hand.gesture}",
            (pad * 2, card_y + int(56 * scale)),
            scale * 0.55,
            THEME["accent"],
        )
        draw_text(
            frame,
            f"Dedos: {hand.total}",
            (pad * 2, card_y + int(82 * scale)),
            scale * 0.5,
            THEME["muted"],
        )
        bars_y = card_y + card_h - int(18 * scale)
        _draw_finger_bars(frame, pad * 2, bars_y, hand.states, scale)
        _draw_pinch_meter(
            frame, pad * 2 + int(90 * scale), bars_y - int(8 * scale), hand.pinch_strength, scale
        )

    draw_text(
        frame,
        "Q: sair  |  L: landmarks  |  H: HUD",
        (pad, height - pad),
        scale * 0.45,
        THEME["muted"],
    )
