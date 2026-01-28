import cv2
import mediapipe as mp
import time

from camera_utils import open_first_available
from gesture_logic import count_fingers

# --- Configurações e Constantes ---
LARGURA_CAM, ALTURA_CAM = 640, 480  # Resolução da captura
CONFIDENCE_DETECCAO = 0.7
CONFIDENCE_RASTREAMENTO = 0.5
THICKNESS_DESENHO = 2
RAIO_CIRCULO = 4

# Cores (BGR)
COR_TEXTO = (255, 0, 0)      # Azul
COR_LANDMARK = (0, 255, 0)   # Verde
COR_CONEXAO = (0, 255, 0)    # Verde
COR_DEDO_OFF = (0, 0, 255)   # Vermelho (detalhe se quiser diferenciar)

def main():
    """Função principal do sistema de reconhecimento de gestos."""
    
    # 1. Inicialização da Webcam
    # Tenta índices comuns de câmera (0, 1) até encontrar um que funcione
    camera_indices = [0, 1]
    for camera_index in camera_indices:
        print(f"Tentando conectar à câmera no índice {camera_index}...")
    cap, camera_index = open_first_available(camera_indices, LARGURA_CAM, ALTURA_CAM)

    if cap is None or not cap.isOpened():
        print("Erro Crítico: Nenhuma câmera funcional encontrada (tentados índices 0 e 1).")
        return
    print(f"Câmera conectada com sucesso no índice {camera_index}!")

    # 2. Inicialização do MediaPipe Hands
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    
    # Configuração do modelo
    hands = mp_hands.Hands(
        static_image_mode=False,        # Modo vídeo (mais rápido que processar imagens independentes)
        max_num_hands=2,                # Detectar até 2 mãos
        min_detection_confidence=CONFIDENCE_DETECCAO,
        min_tracking_confidence=CONFIDENCE_RASTREAMENTO
    )

    print("Sistema iniciado. Pressione 'q' na janela do vídeo para sair.")

    # Loop de processamento de frames
    while True:
        sucesso, frame = cap.read()
        if not sucesso:
            print("Ignorando frame vazio (câmera desconectada?).")
            continue

        # Espelhar o frame horizontalmente para efeito "espelho" (mais natural para o usuário)
        frame = cv2.flip(frame, 1)

        # Converter BGR (padrão OpenCV) para RGB (padrão MediaPipe)
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Processar a detecção de mão
        resultado = hands.process(img_rgb)

        # Se houver mãos detectadas
        if resultado.multi_hand_landmarks:
            for hand_landmarks, hand_handedness in zip(resultado.multi_hand_landmarks, resultado.multi_handedness):
                
                # Desenhar os landmarks e conexões na imagem original
                mp_drawing.draw_landmarks(
                    frame, 
                    hand_landmarks, 
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=COR_CONEXAO, thickness=THICKNESS_DESENHO, circle_radius=RAIO_CIRCULO),
                    mp_drawing.DrawingSpec(color=COR_LANDMARK, thickness=THICKNESS_DESENHO, circle_radius=RAIO_CIRCULO)
                )

                # Contar dedos
                total_dedos, lista_dedos = count_fingers(
                    hand_landmarks.landmark,
                    hand_handedness.classification[0].label,
                )
                
                # Exibir contagem na tela
                # Posição do texto baseada na detecção do punho (landmark 0)
                h, w, c = frame.shape
                cx, cy = int(hand_landmarks.landmark[0].x * w), int(hand_landmarks.landmark[0].y * h)
                
                cv2.putText(frame, f'Dedos: {total_dedos}', (cx - 50, cy + 50), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, COR_TEXTO, 2)
                
# Opcional: Mostrar status de cada dedo no console para debug
# print(f\"Mão: {hand_handedness.classification[0].label}, Dedos: {lista_dedos}\")

        # Calcular e exibir FPS
        # (Opcional, mas útil para performance)
        
        # Exibir a imagem final
        cv2.imshow('Detector de Gestos - Python', frame)

        # Sair ao pressionar 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Limpeza final
    cap.release()
    cv2.destroyAllWindows()
    hands.close()

if __name__ == "__main__":
    main()
