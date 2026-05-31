from python_app.metrics import GestureMetrics


def test_metrics_track_frames_and_gestures():
    metrics = GestureMetrics()

    first = metrics.update("Palma aberta", 5)
    second = metrics.update("Palma aberta", 5)

    assert first.frames == 1
    assert second.frames == 2
    assert second.most_common_gesture == "Palma aberta"
    assert second.average_fingers == 5
