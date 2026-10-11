"""Generate the golden gesture fixtures shared by pytest (python/) and Vitest (web/).

The hands are SYNTHETIC: simple geometric poses, not recordings of a real person.
Coordinates follow MediaPipe's normalized image space (x to the right, y down,
0..1) in the SELFIE frame, i.e. the frame the desktop app feeds to MediaPipe
after cv2.flip and the frame the web app converts to before classifying.

Every expected value below is written by hand from the intended pose; nothing
is computed by the code under test. Run from the repository root:

    python fixtures/gestures/generate.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Literal

Point = tuple[float, float, float]
Hand = Literal["Right", "Left"]

OUT_DIR = Path(__file__).resolve().parent

WRIST: Point = (0.50, 0.80, 0.0)
FINGER_MCP_X = {"index": 0.44, "middle": 0.50, "ring": 0.56, "pinky": 0.61}
FINGER_MCP_Y = {"index": 0.60, "middle": 0.58, "ring": 0.60, "pinky": 0.63}

THUMB_CMC: Point = (0.45, 0.76, 0.0)
THUMB_MCP: Point = (0.41, 0.71, 0.0)
THUMB_IP: Point = (0.38, 0.66, 0.0)
THUMB_TIP_OPEN: Point = (0.34, 0.62, 0.0)  # left of the IP joint: open for a right hand
THUMB_TIP_FOLDED: Point = (0.47, 0.70, 0.0)  # across the palm, away from the index tip

# OK / pinch: thumb and index tips touch, index finger bent towards the thumb.
PINCH_THUMB_IP: Point = (0.37, 0.665, 0.0)
PINCH_THUMB_TIP: Point = (0.39, 0.612, 0.0)
PINCH_INDEX: tuple[Point, Point, Point] = (
    (0.43, 0.53, 0.0),  # PIP
    (0.40, 0.55, 0.0),  # DIP
    (0.385, 0.60, 0.0),  # TIP (below the PIP: finger down)
)


def finger(name: str, extended: bool) -> list[Point]:
    """MCP, PIP, DIP and TIP of a long finger, straight up or curled."""
    x, y = FINGER_MCP_X[name], FINGER_MCP_Y[name]
    if extended:
        return [(x, y, 0.0), (x, y - 0.08, 0.0), (x, y - 0.14, 0.0), (x, y - 0.19, 0.0)]
    return [(x, y, 0.0), (x, y - 0.05, 0.0), (x, y - 0.01, 0.0), (x, y + 0.02, 0.0)]


def right_hand(
    thumb: bool,
    index: bool,
    middle: bool,
    ring: bool,
    pinky: bool,
    *,
    pinch: bool = False,
) -> list[Point]:
    points: list[Point] = [WRIST, THUMB_CMC, THUMB_MCP]
    if pinch:
        points += [PINCH_THUMB_IP, PINCH_THUMB_TIP]
        index_points = [finger("index", False)[0], *PINCH_INDEX]
    else:
        points += [THUMB_IP, THUMB_TIP_OPEN if thumb else THUMB_TIP_FOLDED]
        index_points = finger("index", index)
    points += index_points
    points += finger("middle", middle)
    points += finger("ring", ring)
    points += finger("pinky", pinky)
    assert len(points) == 21
    return points


def mirror(points: list[Point]) -> list[Point]:
    """A left hand is the right hand reflected around the vertical axis."""
    return [(round(1.0 - x, 6), y, z) for x, y, z in points]


def pinch_distance(points: list[Point]) -> float:
    palm = math.dist(points[0][:2], points[9][:2])
    return math.dist(points[4][:2], points[8][:2]) / palm


def case(
    case_id: str,
    hand: Hand,
    points: list[Point],
    finger_states: list[int],
    gesture: str,
    label: str,
) -> dict[str, object]:
    return {
        "id": case_id,
        "handedness": hand,
        "landmarks": [[round(c, 6) for c in p] for p in points],
        "expected": {
            "finger_states": finger_states,
            "total": sum(finger_states),
            "gesture": gesture,
            "label": label,
            "pinch_distance": round(pinch_distance(points), 4),
        },
    }


def build_cases() -> list[dict[str, object]]:
    r = right_hand
    return [
        case("fist-right", "Right", r(False, False, False, False, False), [0, 0, 0, 0, 0], "fist", "Punho fechado"),
        case("fist-left", "Left", mirror(r(False, False, False, False, False)), [0, 0, 0, 0, 0], "fist", "Punho fechado"),
        case("open-palm-right", "Right", r(True, True, True, True, True), [1, 1, 1, 1, 1], "open_palm", "Mão aberta"),
        case("open-palm-left", "Left", mirror(r(True, True, True, True, True)), [1, 1, 1, 1, 1], "open_palm", "Mão aberta"),
        case("peace-right", "Right", r(False, True, True, False, False), [0, 1, 1, 0, 0], "peace", "Paz"),
        case("rock-right", "Right", r(False, True, False, False, True), [0, 1, 0, 0, 1], "rock", "Rock"),
        case("thumb-right", "Right", r(True, False, False, False, False), [1, 0, 0, 0, 0], "thumb", "Polegar"),
        case("thumb-left", "Left", mirror(r(True, False, False, False, False)), [1, 0, 0, 0, 0], "thumb", "Polegar"),
        case("index-right", "Right", r(False, True, False, False, False), [0, 1, 0, 0, 0], "index", "Indicador"),
        case("l-shape-right", "Right", r(True, True, False, False, False), [1, 1, 0, 0, 0], "l_shape", "L"),
        case("three-right", "Right", r(False, True, True, True, False), [0, 1, 1, 1, 0], "three", "Três"),
        case("four-right", "Right", r(False, True, True, True, True), [0, 1, 1, 1, 1], "four", "Quatro"),
        case("ok-right", "Right", r(False, False, True, True, True, pinch=True), [0, 0, 1, 1, 1], "ok", "OK"),
        case("pinch-right", "Right", r(False, False, False, False, False, pinch=True), [0, 0, 0, 0, 0], "pinch", "Pinça"),
        case("unmapped-right", "Right", r(True, False, False, False, True), [1, 0, 0, 0, 1], "unknown", "Gesto não mapeado"),
    ]


SMOOTHING = {
    "window": 5,
    "finger_states": {
        "input": [
            [0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [1, 1, 0, 0, 0],
            [1, 1, 1, 0, 0],
            [1, 1, 1, 0, 0],
        ],
        # A finger is up when it is up in at least half of the window (ties count as up).
        "expected": [
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 0, 0],
            [1, 1, 0, 0, 0],
        ],
    },
    "labels": {
        "input": ["fist", "fist", "open_palm", "open_palm", "peace", "open_palm", "peace", "peace"],
        # Most frequent label in the window; a tie keeps the label seen first in the window.
        "expected": ["fist", "fist", "fist", "fist", "fist", "open_palm", "open_palm", "peace"],
    },
}


def main() -> None:
    poses = {
        "description": "Synthetic hand poses (not real people) for the gesture rules. Selfie frame, MediaPipe normalized coordinates.",
        "pinch_threshold": 0.35,
        "cases": build_cases(),
    }
    for name, payload in (("hand-poses.json", poses), ("smoothing.json", SMOOTHING)):
        text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
        (OUT_DIR / name).write_text(text, encoding="utf-8", newline="\n")
        print(f"wrote {name}")


if __name__ == "__main__":
    main()
