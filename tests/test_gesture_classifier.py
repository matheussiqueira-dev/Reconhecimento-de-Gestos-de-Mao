from python_app.gesture_classifier import GestureClassifier


def test_classifies_open_palm():
    gesture = GestureClassifier().classify((True, True, True, True, True))

    assert gesture.label == "Palma aberta"
    assert gesture.confidence > 0.9


def test_classifies_pointing():
    gesture = GestureClassifier().classify((False, True, False, False, False))

    assert gesture.label == "Apontando"


def test_classifies_fallback_count():
    gesture = GestureClassifier().classify((True, False, True, False, True))

    assert gesture.label == "3 dedo(s)"
