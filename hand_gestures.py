import cv2
import mediapipe as mp
import time

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
    cap = None
    for camera_index in [0, 1]:
        print(f"Tentando conectar à câmera no índice {camera_index}...")
        temp_cap = cv2.VideoCapture(camera_index)
        
        # Tenta ler um frame para garantir que está funcionando
        if temp_cap.isOpened():
            ret, _ = temp_cap.read()
            if ret:
                cap = temp_cap
                cap.set(3, LARGURA_CAM)
                cap.set(4, ALTURA_CAM)
                print(f"Câmera conectada com sucesso no índice {camera_index}!")
                break
            else:
                print(f"Câmera aberta no índice {camera_index}, mas falhou ao ler frame.")
                temp_cap.release()
        else:
             print(f"Falha ao abrir câmera no índice {camera_index}.")

    if cap is None or not cap.isOpened():
        print("Erro Crítico: Nenhuma câmera funcional encontrada (tentados índices 0 e 1).")
        return

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
                total_dedos, lista_dedos = contar_dedos(hand_landmarks, hand_handedness)
                
                # Exibir contagem na tela
                # Posição do texto baseada na detecção do punho (landmark 0)
                h, w, c = frame.shape
                cx, cy = int(hand_landmarks.landmark[0].x * w), int(hand_landmarks.landmark[0].y * h)
                
                cv2.putText(frame, f'Dedos: {total_dedos}', (cx - 50, cy + 50), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, COR_TEXTO, 2)
                
                # Opcional: Mostrar status de cada dedo no console para debug
                # print(f"Mão: {hand_handedness.classification[0].label}, Dedos: {lista_dedos}")

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

def contar_dedos(hand_landmarks, hand_handedness):
    """
    Conta quantos dedos estão levantados baseado nos landmarks.
    Retorna o total e uma lista de estados (1=levantado, 0=abaixado).
    """
    
    # IDs das pontas dos dedos (Tips)
    # Polegar: 4, Indicador: 8, Médio: 12, Anular: 16, Mínimo: 20
    finger_tips = [4, 8, 12, 16, 20]
    
    # Lista para armazenar estado de cada dedo (0 ou 1)
    fingers_status = []
    
    # Lógica para os 4 dedos (Indicador, Médio, Anular, Mínimo)
    # Compara a ponta (TIP) com a segunda articulação (PIP - Proximal Interphalangeal)
    # Como Y cresce para baixo na imagem, TIP < PIP significa dedo levantado.
    
    # Dedo Indicador (8) vs PIP (6)
    if hand_landmarks.landmark[8].y < hand_landmarks.landmark[6].y:
        fingers_status.append(1)
    else:
        fingers_status.append(0)
        
    # Dedo Médio (12) vs PIP (10)
    if hand_landmarks.landmark[12].y < hand_landmarks.landmark[10].y:
        fingers_status.append(1)
    else:
        fingers_status.append(0)

    # Dedo Anular (16) vs PIP (14)
    if hand_landmarks.landmark[16].y < hand_landmarks.landmark[14].y:
        fingers_status.append(1)
    else:
        fingers_status.append(0)

    # Dedo Mínimo (20) vs PIP (18)
    if hand_landmarks.landmark[20].y < hand_landmarks.landmark[18].y:
        fingers_status.append(1)
    else:
        fingers_status.append(0)

    # Lógica Especial para o Polegar
    # O polegar se move lateralmente. Comparar X da ponta (4) com X da articulação MCP (2) ou IP (3).
    # Precisamos saber se é mão esquerda ou direita para saber a direção "aberta".
    # Nota: Como espelhamos a imagem (flip), a "Right" do MediaPipe parecerá Esquerda na tela e vice-versa,
    # mas a label interna `hand_handedness.classification[0].label` se refere à mão real do usuário (se não espelhado) 
    # ou à mão detectada na imagem RGB.
    
    # Label "Right" = Mão Direita do usuário. Na imagem espelhada, o polegar abre para a Esquerda da tela (X menor).
    # Label "Left" = Mão Esquerda do usuário. Na imagem espelhada, o polegar abre para a Direita da tela (X maior).
    
    label = hand_handedness.classification[0].label  # "Left" ou "Right"
    
    # Coordenadas X do polegar
    thumb_tip_x = hand_landmarks.landmark[4].x
    thumb_ip_x = hand_landmarks.landmark[3].x # Usando articulação IP para referência
    
    thumb_is_open = False
    
    # ATENÇÃO: Devido ao `cv2.flip(frame, 1)` feito antes do processamento, a imagem enviada ao MediaPipe está espelhada.
    # Isso pode inverter a detecção de Left/Right dependendo da versão, mas geralmente:
    # Se eu levanto minha mão DIREITA na webcam espelhada -> Ela aparece no lado direito da tela (como se fosse um espelho).
    # O MediaPipe analisando a imagem espelhada pode classificar como "Left" (porque parece uma mão esquerda visualmente?).
    # Vamos simplificar: testar a posição relativa ao centro da mão ou apenas X relativo.
    
    # Lógica agnóstica simplificada (funciona bem para "High Five"):
    # Se a mão é "Right" (pelo MediaPipe), o polegar abre para a esquerda da imagem (X menor) se não estiver espelhado.
    # Mas como ESPELHAMOS a imagem ANTES:
    # Se usuário levanta mão DIREITA -> Imagem mostra mão à direita. O polegar aponta para a ESQUERDA (centro do corpo).
    # Vamos usar a regra: Polegar está "fora" se estiver mais longe do centro da palma do que a base.
    # Mas a regra de X simples funciona bem:
    
    if label == "Right":
        # Mão Direita: Polegar aberto se Tip.x < IP.x (mais à esquerda na imagem) 
        # *Correção*: Se usarmos flip, a lógica inverte? Vamos assumir comportamento padrão:
        # Se Tip.x < IP.x, polegar está aberto para a esquerda.
        if thumb_tip_x < thumb_ip_x:
            thumb_is_open = True
    else: # Left
        # Mão Esquerda: Polegar aberto se Tip.x > IP.x (mais à direita na imagem)
        if thumb_tip_x > thumb_ip_x:
            thumb_is_open = True
            
    # Inserir o estado do polegar no INÍCIO da lista (para ficar [Polegar, Ind, Med, Anu, Min])
    if thumb_is_open:
        fingers_status.insert(0, 1)
    else:
        fingers_status.insert(0, 0)
        
    return fingers_status.count(1), fingers_status

if __name__ == "__main__":
    main()
