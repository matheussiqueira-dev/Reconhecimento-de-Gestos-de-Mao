"""Gesture labels derived from raised finger states."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Gesture:
    label: str
    confidence: float
    description: str


class GestureClassifier:
    """Classifies common hand poses from five boolean finger states."""

    def classify(self, fingers: tuple[bool, bool, bool, bool, bool]) -> Gesture:
        thumb, index, middle, ring, pinky = fingers
        total = sum(1 for value in fingers if value)

        if total == 0:
            return Gesture("Punho fechado", 0.96, "Nenhum dedo levantado.")
        if total == 5:
            return Gesture("Palma aberta", 0.97, "Todos os dedos levantados.")
        if (index, middle, ring, pinky) == (True, True, False, False):
            return Gesture("Paz", 0.94, "Indicador e medio levantados.")
        if thumb and not any((index, middle, ring, pinky)):
            return Gesture("Joinha", 0.92, "Apenas o polegar levantado.")
        if index and not any((thumb, middle, ring, pinky)):
            return Gesture("Apontando", 0.91, "Apenas o indicador levantado.")
        if index and pinky and not middle and not ring:
            return Gesture("Rock", 0.9, "Indicador e minimo levantados.")

        return Gesture(f"{total} dedo(s)", 0.82, "Contagem heuristica de dedos.")
