from __future__ import annotations

import math
from types import SimpleNamespace
from typing import Any

import pytest

from hand_gestures.gestures import (
    GESTURE_LABELS,
    PINCH_DISTANCE_THRESHOLD,
    FingerStateSmoother,
    LabelSmoother,
    analyze_hand,
    ascii_label,
    classify_gesture,
    gesture_label,
)
from tests.helpers import load_fixture

POSES = load_fixture("hand-poses.json")
SMOOTHING = load_fixture("smoothing.json")


@pytest.mark.parametrize("case", POSES["cases"], ids=lambda case: case["id"])
def test_golden_pose(case: dict[str, Any]) -> None:
    analysis = analyze_hand(case["landmarks"], case["handedness"])
    expected = case["expected"]

    assert list(analysis.finger_states) == expected["finger_states"]
    assert analysis.total == expected["total"]
    assert analysis.gesture == expected["gesture"]
    assert analysis.label == expected["label"]
    assert analysis.pinch_distance == pytest.approx(expected["pinch_distance"], abs=1e-4)


def test_fixture_threshold_matches_the_rules() -> None:
    assert POSES["pinch_threshold"] == PINCH_DISTANCE_THRESHOLD


def test_accepts_objects_and_mappings_like_mediapipe_landmarks() -> None:
    case = POSES["cases"][0]
    as_objects = [SimpleNamespace(x=x, y=y, z=z) for x, y, z in case["landmarks"]]
    as_dicts = [{"x": x, "y": y} for x, y, _ in case["landmarks"]]

    assert analyze_hand(as_objects, "Right") == analyze_hand(as_dicts, "Right")


def test_rejects_incomplete_hands() -> None:
    with pytest.raises(ValueError, match="21 hand landmarks"):
        analyze_hand([[0.5, 0.5, 0.0]] * 20, "Right")


@pytest.mark.parametrize("bad", [math.nan, math.inf])
def test_rejects_non_finite_coordinates(bad: float) -> None:
    landmarks = [[0.5, 0.5, 0.0] for _ in range(21)]
    landmarks[8] = [bad, 0.2, 0.0]
    with pytest.raises(ValueError, match="finite"):
        analyze_hand(landmarks, "Right")


def test_pinch_threshold_is_inclusive() -> None:
    assert classify_gesture((0, 0, 1, 1, 1), PINCH_DISTANCE_THRESHOLD) == "ok"
    assert classify_gesture((0, 0, 1, 1, 1), PINCH_DISTANCE_THRESHOLD + 1e-9) == "unknown"


def test_pinch_with_mixed_fingers_falls_back_to_the_finger_map() -> None:
    assert classify_gesture((0, 1, 1, 0, 0), 0.1) == "peace"


def test_every_gesture_has_a_label() -> None:
    assert gesture_label("does-not-exist") == GESTURE_LABELS["unknown"]
    assert set(GESTURE_LABELS) == {
        "fist", "open_palm", "peace", "rock", "thumb", "index",
        "l_shape", "three", "four", "ok", "pinch", "unknown",
    }  # fmt: skip


def test_ascii_label_strips_accents_for_opencv() -> None:
    assert ascii_label("Mão aberta") == "Mao aberta"
    assert ascii_label("Pinça") == "Pinca"
    assert ascii_label("Três") == "Tres"


def test_finger_state_smoother_matches_the_fixture() -> None:
    smoother = FingerStateSmoother(SMOOTHING["window"])
    outputs = [list(smoother.update(state)) for state in SMOOTHING["finger_states"]["input"]]
    assert outputs == SMOOTHING["finger_states"]["expected"]


def test_label_smoother_matches_the_fixture() -> None:
    smoother = LabelSmoother(SMOOTHING["window"])
    outputs = [smoother.update(label) for label in SMOOTHING["labels"]["input"]]
    assert outputs == SMOOTHING["labels"]["expected"]


def test_smoothers_clamp_the_window_to_one() -> None:
    assert FingerStateSmoother(0).update((1, 0, 0, 0, 0)) == (1, 0, 0, 0, 0)
    labels = LabelSmoother(-3)
    labels.update("fist")
    assert labels.update("peace") == "peace"
