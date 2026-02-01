import argparse
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import cv2
import mediapipe as mp

from camera_utils import (
    default_backend,
    find_camera_index_by_name,
    get_device_names,
    open_camera_by_index,
    open_first_available,
    probe_cameras,
)
from gesture_logic import HandAnalysis, FingerStateSmoother, LabelSmoother, analyze_hand

PREFERRED_CAMERA_NAME = "Brio 305"

WINDOW_NAME = "Hand Gesture Studio"

THEME = {
    "bg": (18, 20, 26),
    "panel": (24, 28, 36),
    "accent": (0, 196, 255),
    "accent_soft": (64, 164, 200),
    "text": (235, 235, 235),
    "muted": (160, 160, 160),
    "warn": (0, 170, 255),
    "danger": (60, 60, 255),
    "border": (48, 52, 60),
}


@dataclass
class AppConfig:
    width: int
    height: int
    camera_name: Optional[str]
    camera_index: Optional[int]
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
    target_fps: Optional[int]
    list_cameras: bool
    debug: bool


class FpsTracker:
    def __init__(self, smoothing: float = 0.9) -> None:
        self._smoothing = smoothing
        self._last_time = time.time()
        self._fps = 0.0

    def update(self) -> float:
        now = time.time()
        delta = now - self._last_time
        self._last_time = now
        if delta > 0:
            current = 1.0 / delta
            if self._fps == 0.0:
                self._fps = current
            else:
                self._fps = self._fps * self._smoothing + current * (1.0 - self._smoothing)
        return self._fps


def parse_args() -> AppConfig:
    parser = argparse.ArgumentParser(description="Sistema de reconhecimento de gestos em tempo real.")
    parser.add_argument("--width", type=int, default=960, help="Largura da captura.")
    parser.add_argument("--height", type=int, default=540, help="Altura da captura.")
    parser.add_argument(
        "--camera-name",
        type=str,
        default=PREFERRED_CAMERA_NAME,
        help="Nome da camera preferida (ex: Brio 305).",
    )
    parser.add_argument("--camera-index", type=int, default=None, help="Indice da camera, se desejar forcar.")
    parser.add_argument(
        "--allow-fallback",
        action="store_true",
        help="Permite usar qualquer camera caso a preferida nao seja encontrada.",
    )
    parser.add_argument("--max-hands", type=int, default=2, help="Numero maximo de maos.")
    parser.add_argument("--min-detection", type=float, default=0.7, help="Confianca minima de deteccao.")
    parser.add_argument("--min-tracking", type=float, default=0.5, help="Confianca minima de rastreamento.")
    parser.add_argument("--smoothing", type=int, default=5, help="Janela de suavizacao dos gestos.")
    parser.add_argument("--no-mirror", action="store_true", help="Desliga o espelhamento do video.")
    parser.add_argument("--no-landmarks", action="store_true", help="Nao desenha landmarks.")
    parser.add_argument("--no-ui", action="store_true", help="Desliga o HUD.")
    parser.add_argument("--headless", action="store_true", help="Roda sem abrir janela de video.")
    parser.add_argument("--max-frames", type=int, default=0, help="Numero maximo de frames (0 = infinito).")
    parser.add_argument("--fps", type=int, default=None, help="FPS alvo (se suportado pela camera).")
    parser.add_argument("--list-cameras", action="store_true", help="Lista cameras disponiveis e sai.")
    parser.add_argument("--debug", action="store_true", help="Exibe informacoes de debug no console.")
    args = parser.parse_args()

    camera_name = args.camera_name.strip() if args.camera_name else None
    if camera_name == "":
        camera_name = None

    return AppConfig(
        width=args.width,
        height=args.height,
        camera_name=camera_name,
        camera_index=args.camera_index,
        allow_fallback=args.allow_fallback,
        max_hands=args.max_hands,
        min_detection_confidence=args.min_detection,
        min_tracking_confidence=args.min_tracking,
        smoothing_window=max(1, args.smoothing),
        mirror=not args.no_mirror,
        draw_landmarks=not args.no_landmarks,
        show_ui=not args.no_ui,
        headless=args.headless,
        max_frames=max(0, args.max_frames),
        target_fps=args.fps,
        list_cameras=args.list_cameras,
        debug=args.debug,
    )


def _draw_text(frame, text: str, x: int, y: int, scale: float, color, thickness: int = 1) -> None:
    cv2.putText(
        frame,
        text,
        (x + 1, y + 1),
        cv2.FONT_HERSHEY_DUPLEX,
        scale,
        (0, 0, 0),
        thickness + 2,
        cv2.LINE_AA,
    )
    cv2.putText(
        frame,
        text,
        (x, y),
        cv2.FONT_HERSHEY_DUPLEX,
        scale,
        color,
        thickness,
        cv2.LINE_AA,
    )


def _draw_panel(frame, x: int, y: int, w: int, h: int, alpha: float = 0.75) -> None:
    overlay = frame.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), THEME["panel"], -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    cv2.rectangle(frame, (x, y), (x + w, y + h), THEME["border"], 1)


def _draw_finger_bars(frame, x: int, y: int, states: List[int], scale: float) -> None:
    bar_w = int(10 * scale)
    bar_h = int(26 * scale)
    gap = int(6 * scale)
    for idx, state in enumerate(states):
        left = x + idx * (bar_w + gap)
        top = y - bar_h
        color = THEME["accent"] if state else THEME["muted"]
        cv2.rectangle(frame, (left, top), (left + bar_w, y), color, -1)


def _draw_pinch_meter(frame, x: int, y: int, strength: float, scale: float) -> None:
    meter_w = int(100 * scale)
    meter_h = int(8 * scale)
    strength = max(0.0, min(1.0, strength))
    filled = int(meter_w * strength)
    cv2.rectangle(frame, (x, y), (x + meter_w, y + meter_h), THEME["muted"], -1)
    cv2.rectangle(frame, (x, y), (x + filled, y + meter_h), THEME["accent"], -1)


def _draw_ui(
    frame,
    camera_name: str,
    fps: float,
    hands_data: List[Dict],
    show_landmarks: bool,
    show_ui: bool,
) -> None:
    if not show_ui:
        return

    height, width = frame.shape[:2]
    scale = max(0.7, min(1.25, width / 960))
    pad = int(14 * scale)
    top_h = int(64 * scale)

    left_w = int(width * 0.6)
    right_w = width - left_w - (pad * 3)
    left_x = pad
    right_x = left_x + left_w + pad

    _draw_panel(frame, left_x, pad, left_w, top_h)
    _draw_panel(frame, right_x, pad, right_w, top_h)

    _draw_text(frame, "Hand Gesture Studio", left_x + pad, pad + int(26 * scale), scale * 0.75, THEME["text"])
    _draw_text(
        frame,
        f"Camera: {camera_name}",
        left_x + pad,
        pad + int(50 * scale),
        scale * 0.55,
        THEME["muted"],
    )

    _draw_text(frame, f"FPS: {fps:4.1f}", right_x + pad, pad + int(28 * scale), scale * 0.7, THEME["text"])
    _draw_text(
        frame,
        f"Maos: {len(hands_data)}",
        right_x + pad,
        pad + int(52 * scale),
        scale * 0.55,
        THEME["muted"],
    )

    card_w = int(width * 0.36)
    card_h = int(120 * scale)
    base_y = pad + top_h + pad

    for idx, data in enumerate(hands_data[:2]):
        card_x = pad
        card_y = base_y + idx * (card_h + pad)
        if card_y + card_h > height - pad:
            break
        _draw_panel(frame, card_x, card_y, card_w, card_h)
        label = f"{data['label']} ({data['score']:.0%})"
        _draw_text(frame, label, card_x + pad, card_y + int(28 * scale), scale * 0.6, THEME["text"])
        _draw_text(
            frame,
            f"Gesto: {data['gesture']}",
            card_x + pad,
            card_y + int(56 * scale),
            scale * 0.55,
            THEME["accent"],
        )
        _draw_text(
            frame,
            f"Dedos: {data['total']}",
            card_x + pad,
            card_y + int(82 * scale),
            scale * 0.5,
            THEME["muted"],
        )
        bars_y = card_y + card_h - int(18 * scale)
        _draw_finger_bars(frame, card_x + pad, bars_y, data["states"], scale)
        _draw_pinch_meter(frame, card_x + pad + int(90 * scale), bars_y - int(8 * scale), data["pinch"], scale)

    hint = "Q: sair  |  L: landmarks  |  H: HUD"
    hint_color = THEME["muted"] if show_landmarks else THEME["accent_soft"]
    _draw_text(
        frame,
        hint,
        pad,
        height - pad,
        scale * 0.45,
        hint_color,
    )


def _print_camera_list(backend: Optional[int]) -> None:
    infos = probe_cameras(range(10), backend=backend)
    print("Cameras detectadas:")
    for info in infos:
        status = "OK" if info.working else "NO"
        name = f" - {info.name}" if info.name else ""
        print(f"[{status}] index {info.index}{name}")


def _select_camera(config: AppConfig, backend: Optional[int]) -> Tuple[Optional[cv2.VideoCapture], Optional[str]]:
    device_names = get_device_names()

    if config.list_cameras:
        _print_camera_list(backend)
        return None, None

    if config.camera_name:
        if not device_names:
            print("Nao foi possivel listar cameras por nome.")
            print("Instale o pacote 'pygrabber' ou use --camera-index.")
            if not config.allow_fallback:
                return None, None
        else:
            index = find_camera_index_by_name(config.camera_name, device_names)
            if index is None:
                print(f"Camera '{config.camera_name}' nao encontrada.")
                print(f"Disponiveis: {device_names}")
                if not config.allow_fallback:
                    return None, None
            else:
                cap = open_camera_by_index(index, config.width, config.height, backend, fps=config.target_fps)
                if cap is None:
                    print(f"Falha ao abrir a camera no indice {index}.")
                    return None, None
                name = device_names[index] if device_names and index < len(device_names) else config.camera_name
                return cap, name

    if config.camera_index is not None:
        cap = open_camera_by_index(config.camera_index, config.width, config.height, backend, fps=config.target_fps)
        if cap is None:
            print(f"Falha ao abrir a camera no indice {config.camera_index}.")
            return None, None
        name = None
        if device_names and config.camera_index < len(device_names):
            name = device_names[config.camera_index]
        return cap, name or f"Index {config.camera_index}"

    if not config.allow_fallback:
        print("Nenhuma camera preferida selecionada e fallback desativado.")
        return None, None

    cap, _ = open_first_available(range(6), config.width, config.height, backend, fps=config.target_fps)
    if cap is None:
        print("Nenhuma camera funcional encontrada.")
        return None, None
    return cap, "Camera"


def main() -> None:
    config = parse_args()
    backend = default_backend()

    cap, camera_label = _select_camera(config, backend)
    if cap is None:
        return

    if not config.headless:
        cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    fps_tracker = FpsTracker()

    finger_smoothers: Dict[str, FingerStateSmoother] = {}
    label_smoothers: Dict[str, LabelSmoother] = {}

    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=config.max_hands,
        min_detection_confidence=config.min_detection_confidence,
        min_tracking_confidence=config.min_tracking_confidence,
    ) as hands:
        frame_count = 0
        print("Sistema iniciado. Pressione 'q' para sair.")

        while True:
            success, frame = cap.read()
            if not success:
                print("Frame vazio recebido. Verifique a camera.")
                break

            if config.mirror:
                frame = cv2.flip(frame, 1)

            img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img_rgb.flags.writeable = False
            result = hands.process(img_rgb)
            img_rgb.flags.writeable = True

            hands_ui: List[Dict] = []
            if result.multi_hand_landmarks and result.multi_handedness:
                for hand_landmarks, handedness in zip(result.multi_hand_landmarks, result.multi_handedness):
                    label = handedness.classification[0].label
                    score = handedness.classification[0].score
                    analysis: HandAnalysis = analyze_hand(hand_landmarks.landmark, label)

                    smoother_key = label.lower()
                    if smoother_key not in finger_smoothers:
                        finger_smoothers[smoother_key] = FingerStateSmoother(config.smoothing_window)
                        label_smoothers[smoother_key] = LabelSmoother(config.smoothing_window)

                    smooth_states = finger_smoothers[smoother_key].update(analysis.finger_states)
                    smooth_label = label_smoothers[smoother_key].update(analysis.gesture)
                    total = sum(smooth_states)

                    hands_ui.append(
                        {
                            "label": label.capitalize(),
                            "score": score,
                            "gesture": smooth_label,
                            "total": total,
                            "states": smooth_states,
                            "pinch": analysis.pinch_strength,
                        }
                    )

                    if config.draw_landmarks:
                        mp_drawing.draw_landmarks(
                            frame,
                            hand_landmarks,
                            mp_hands.HAND_CONNECTIONS,
                            mp_drawing.DrawingSpec(color=THEME["accent"], thickness=2, circle_radius=3),
                            mp_drawing.DrawingSpec(color=THEME["accent"], thickness=2, circle_radius=3),
                        )

                    if config.debug:
                        print(f"[{label}] dedos={smooth_states} gesto={smooth_label} pinch={analysis.pinch_strength:.2f}")

            fps = fps_tracker.update()
            label = camera_label or config.camera_name or "Camera"
            _draw_ui(frame, label, fps, hands_ui, config.draw_landmarks, config.show_ui)

            if not config.headless:
                cv2.imshow(WINDOW_NAME, frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    break
                if key == ord("l"):
                    config.draw_landmarks = not config.draw_landmarks
                if key == ord("h"):
                    config.show_ui = not config.show_ui

            frame_count += 1
            if config.max_frames and frame_count >= config.max_frames:
                break

    cap.release()
    if not config.headless:
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
