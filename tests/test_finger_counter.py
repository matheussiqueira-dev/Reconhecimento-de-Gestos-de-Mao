from types import SimpleNamespace

import pytest

from python_app.finger_counter import FingerCounter


def make_landmarks(open_fingers: tuple[bool, bool, bool, bool, bool]):
    landmarks = [SimpleNamespace(x=0.5, y=0.6) for _ in range(21)]
    tip_ids = (4, 8, 12, 16, 20)
    pip_ids = (3, 6, 10, 14, 18)

    for index, is_open in enumerate(open_fingers):
        tip_id = tip_ids[index]
        pip_id = pip_ids[index]
        if index == 0:
            landmarks[tip_id].x = 0.3 if is_open else 0.7
            landmarks[pip_id].x = 0.5
        else:
            landmarks[tip_id].y = 0.3 if is_open else 0.8
            landmarks[pip_id].y = 0.6
    return landmarks


def test_counts_open_palm_for_right_hand():
    result = FingerCounter().count(make_landmarks((True, True, True, True, True)))

    assert result.total == 5
    assert result.as_dict["thumb"] is True


def test_counts_closed_fist():
    result = FingerCounter().count(make_landmarks((False, False, False, False, False)))

    assert result.total == 0
    assert result.fingers == (False, False, False, False, False)


def test_rejects_incomplete_landmarks():
    with pytest.raises(ValueError):
        FingerCounter().count([])
