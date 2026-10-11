"""Desktop hand gesture recognizer: OpenCV capture + MediaPipe Hands + explainable rules.

Run from python/:  python -m hand_gestures [--help]
"""

from __future__ import annotations

import argparse
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from hand_gestures.camera import (
    default_backend,
    find_camera_index_by_name,
    get_device_names,
    open_camera_by_index,
    open_first_available,
    probe_cameras,
)
from hand_gestures.detector import DetectorUnavailableError, HandDetector
from hand_gestures.gestures import (
    FingerStateSmoother,
    LabelSmoother,
    analyze_hand,
    gesture_label,
)
from hand_gestures.metrics import GestureMetrics
from hand_gestures.overlay import HandView, draw_hud, draw_landmarks

WINDOW_NAME = "Gestos de Mao"
PROBE_INDICES = range(6)


@dataclass
class AppConfig:
    width: int
    height: int
    camera_name: str | None
    camera_index: int | None
    allow_fallback: bool
    max_hands: int
    min_detection_confidence: float
    min_tracking_confidence: float
    smoothing_window: int
    mirror: bool
    draw_landmarks: bool
    show_ui: bool
    headless: bool
    max_frames: int
    target_fps: int | None
    list_cameras: bool
    self_check: bool
    debug: bool


def _unit_interval(value: str) -> float:
    number = float(value)
    if not 0.0 <= number <= 1.0:
        raise argparse.ArgumentTypeError("use a value between 0 and 1")
    return number


def _positive_int(value: str) -> int:
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError("use an integer >= 1")
    return number


def parse_args(argv: Sequence[str] | None = None) -> AppConfig:
    parser = argparse.ArgumentParser(description="Reconhecimento de gestos de mao em tempo real.")
    parser.add_argument("--width", type=_positive_int, default=960, help="Largura da captura.")
    parser.add_argument("--height", type=_positive_int, default=540, help="Altura da captura.")
    parser.add_argument(
        "--camera-name",
        default=None,
        help="Parte do nome da camera (ex.: 'Brio 305'). Requer o pacote opcional pygrabber.",
    )
    parser.add_argument("--camera-index", type=int, default=None, help="Indice fixo da camera.")
    parser.add_argument(
        "--allow-fallback",
        action="store_true",
        help="Usa a primeira camera disponivel se a pedida por nome/indice falhar.",
    )
    parser.add_argument("--max-hands", type=_positive_int, default=2, help="Maximo de maos.")
    parser.add_argument("--min-detection", type=_unit_interval, default=0.7)
    parser.add_argument("--min-tracking", type=_unit_interval, default=0.5)
    parser.add_argument("--smoothing", type=_positive_int, default=5, help="Janela de suavizacao.")
    parser.add_argument("--no-mirror", action="store_true", help="Nao espelha o video.")
    parser.add_argument("--no-landmarks", action="store_true", help="Nao desenha landmarks.")
    parser.add_argument("--no-ui", action="store_true", help="Desliga o HUD.")
    parser.add_argument("--headless", action="store_true", help="Roda sem abrir janela.")
    parser.add_argument(
        "--max-frames", type=int, default=0, help="Para apos N quadros (0 = sem limite)."
    )
    parser.add_argument("--fps", type=_positive_int, default=None, help="FPS pedido a camera.")
    parser.add_argument("--list-cameras", action="store_true", help="Lista as cameras e sai.")
    parser.add_argument(
        "--self-check",
        action="store_true",
        help="Inicializa o MediaPipe com um quadro vazio (sem camera) e sai.",
    )
    parser.add_argument("--debug", action="store_true", help="Imprime cada analise no console.")
    args = parser.parse_args(argv)

    camera_name = (args.camera_name or "").strip() or None
    return AppConfig(
        width=args.width,
        height=args.height,
        camera_name=camera_name,
        camera_index=args.camera_index,
        allow_fallback=args.allow_fallback,
        max_hands=args.max_hands,
        min_detection_confidence=args.min_detection,
        min_tracking_confidence=args.min_tracking,
        smoothing_window=args.smoothing,
        mirror=not args.no_mirror,
        draw_landmarks=not args.no_landmarks,
        show_ui=not args.no_ui,
        headless=args.headless,
        max_frames=max(0, args.max_frames),
        target_fps=args.fps,
        list_cameras=args.list_cameras,
        self_check=args.self_check,
        debug=args.debug,
    )


def _print_camera_list(backend: int | None) -> None:
    print("Cameras detectadas:")
    for info in probe_cameras(range(10), backend):
        status = "OK" if info.working else "NO"
        name = f" - {info.name}" if info.name else ""
        print(f"[{status}] indice {info.index}{name}")


def select_camera(config: AppConfig, backend: int | None) -> tuple[Any | None, str]:
    """Open the camera asked for by name or index; otherwise the first one that delivers frames."""
    size = (config.width, config.height)
    if config.camera_name:
        device_names = get_device_names()
        index = find_camera_index_by_name(config.camera_name, device_names)
        if index is not None:
            cap = open_camera_by_index(index, *size, backend, config.target_fps)
            if cap is not None:
                return cap, (device_names or [config.camera_name])[index]
            print(f"Falha ao abrir a camera '{config.camera_name}' (indice {index}).")
        elif device_names is None:
            print(
                "Nao foi possivel listar cameras por nome: "
                "instale 'pygrabber' ou use --camera-index."
            )
        else:
            print(f"Camera '{config.camera_name}' nao encontrada. Disponiveis: {device_names}")
        if not config.allow_fallback:
            return None, ""
    elif config.camera_index is not None:
        cap = open_camera_by_index(config.camera_index, *size, backend, config.target_fps)
        if cap is not None:
            return cap, f"Indice {config.camera_index}"
        print(f"Falha ao abrir a camera no indice {config.camera_index}.")
        if not config.allow_fallback:
            return None, ""

    cap, index = open_first_available(PROBE_INDICES, *size, backend, config.target_fps)
    if cap is None:
        print("Nenhuma camera funcional encontrada.")
        return None, ""
    return cap, f"Indice {index}"


def self_check(config: AppConfig) -> int:
    """Initialise MediaPipe on one blank frame: checks the pinned runtime without a camera."""
    import mediapipe as mp
    import numpy as np

    frame = np.zeros((config.height, config.width, 3), dtype=np.uint8)
    with HandDetector(config.max_hands, config.min_detection_confidence) as detector:
        hands = detector.detect(frame)
    print(f"mediapipe {mp.__version__}: Hands OK, {len(hands)} mao(s) num quadro vazio.")
    return 0


def run(config: AppConfig) -> int:
    import cv2

    backend = default_backend()
    if config.list_cameras:
        _print_camera_list(backend)
        return 0

    try:
        detector = HandDetector(
            config.max_hands, config.min_detection_confidence, config.min_tracking_confidence
        )
    except DetectorUnavailableError as exc:
        print(exc)
        return 1

    cap, camera_label = select_camera(config, backend)
    if cap is None:
        detector.close()
        return 1

    if not config.headless:
        cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)

    metrics = GestureMetrics()
    finger_smoothers: dict[str, FingerStateSmoother] = {}
    label_smoothers: dict[str, LabelSmoother] = {}
    exit_code = 0
    print("Sistema iniciado. Pressione 'q' na janela do video para sair.")

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("A camera parou de enviar quadros. Verifique a conexao.")
                exit_code = 1
                break
            if config.mirror:
                frame = cv2.flip(frame, 1)

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            detected = detector.detect(rgb)

            views: list[HandView] = []
            for hand in detected:
                analysis = analyze_hand(hand.landmarks, hand.handedness)
                key = hand.handedness.lower()
                fingers = finger_smoothers.setdefault(
                    key, FingerStateSmoother(config.smoothing_window)
                )
                labels = label_smoothers.setdefault(key, LabelSmoother(config.smoothing_window))
                states = fingers.update(analysis.finger_states)
                gesture = labels.update(analysis.gesture)
                views.append(
                    HandView(
                        side="Direita" if key.startswith("r") else "Esquerda",
                        score=hand.score,
                        gesture=gesture_label(gesture),
                        total=sum(states),
                        states=states,
                        pinch_strength=analysis.pinch_strength,
                    )
                )
                if config.draw_landmarks:
                    draw_landmarks(frame, hand.landmarks, highlight=gesture != "unknown")
                if config.debug:
                    pinch = analysis.pinch_distance
                    print(f"[{hand.handedness}] dedos={states} gesto={gesture} pinch={pinch:.2f}")

            # A hand that left the frame must not carry its old votes into the next detection.
            present = {hand.handedness.lower() for hand in detected}
            for stale in finger_smoothers.keys() - present:
                del finger_smoothers[stale], label_smoothers[stale]

            first = views[0] if views else None
            snapshot = metrics.update(first.gesture if first else None, first.total if first else 0)
            if config.show_ui:
                draw_hud(frame, camera_label, snapshot.fps, views)

            if not config.headless:
                cv2.imshow(WINDOW_NAME, frame)
                key_code = cv2.waitKey(1) & 0xFF
                if key_code == ord("q"):
                    break
                if key_code == ord("l"):
                    config.draw_landmarks = not config.draw_landmarks
                if key_code == ord("h"):
                    config.show_ui = not config.show_ui

            if config.max_frames and metrics.frames >= config.max_frames:
                break
    finally:
        detector.close()
        cap.release()
        if not config.headless:
            cv2.destroyAllWindows()
    return exit_code


def main(argv: Sequence[str] | None = None) -> int:
    config = parse_args(argv)
    if config.self_check:
        return self_check(config)
    return run(config)
