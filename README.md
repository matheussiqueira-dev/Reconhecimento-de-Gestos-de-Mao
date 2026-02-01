# Sistema de Reconhecimento de Gestos de Mão

Este projeto implementa um sistema de visão computacional em tempo real para detectar mãos e contar dedos usando a webcam do computador. Desenvolvido com Python, OpenCV e MediaPipe.

##  Novidades

- **Seleção automática da Logitech Brio 305** por nome (mais confiável).
- **HUD modernizado** com FPS, status da câmera e cards por mão.
- **Reconhecimento de gestos** (Soco, Paz, Rock, OK, Pinch, etc.).
- **Suavização temporal** para reduzir flicker.
- **Atalhos em tempo real** para alternar HUD/landmarks.

##  Pré-requisitos e Instalação

### Requisitos de Sistema
- Python 3.7 ou superior instalado.
- Webcam funcional.

### Instalação das Dependências

Abra o terminal na pasta do projeto e execute:

```bash
pip install opencv-python mediapipe
```

Para **seleção por nome da câmera** (ex: Brio 305), instale também:

```bash
pip install pygrabber
```

*(Nota: O `mediapipe` já inclui as dependências necessárias para processamento de ML, e o `opencv-python` lida com a parte de vídeo)*

##  Como Rodar

1. Certifique-se de que sua webcam não está sendo usada por outro aplicativo (Zoom, Teams, etc.).
2. Execute o script principal:

```bash
python hand_gestures.py
```

3. Uma janela abrirá mostrando o vídeo da sua webcam.
4. **Levante a mão** para ver os landmarks desenhados, contagem e gesto reconhecido.
5. Pressione a tecla **'q'** com a janela do vídeo selecionada para fechar o programa.

### Dicas rápidas

- **L**: alterna landmarks
- **H**: alterna HUD
- **Q**: sair

### Exemplos de uso

Forçar resolução:

```bash
python hand_gestures.py --width 1280 --height 720
```

Listar câmeras disponíveis:

```bash
python hand_gestures.py --list-cameras
```

Usar fallback se a Brio 305 não for encontrada:

```bash
python hand_gestures.py --allow-fallback
```

##  Como Funciona (Lógica do Código)

O sistema segue este fluxo:

1.  **Captura de Vídeo**: O OpenCV captura frames contínuos da webcam.
2.  **Pré-processamento**:
    - Espelhamos a imagem (`cv2.flip`) para ficar natural como um espelho.
    - Convertemos de BGR (formato do OpenCV) para RGB (formato do MediaPipe).
3.  **Detecção (MediaPipe)**: O modelo `hands` processa a imagem RGB e retorna as coordenadas de 21 pontos (landmarks) por mão detectada.
4.  **Contagem de Dedos (Heurística)**:
    - **4 Dedos Principais (Indicador ao Mínimo)**: Verificamos a altura do ponto da ponta do dedo em relação à articulação do meio. Como no computador a coordenada Y cresce de cima para baixo:
        - Se `Y_ponta < Y_articulação`, o dedo está **levantado**.
    - **Polegar**: O polegar se move lateralmente. Verificamos a posição horizontal (eixo X) da ponta em relação à articulação base.
        - Dependendo se a mão é esquerda ou direita, verificamos se o polegar está "para fora" da palma.
5.  **Gestos e Pinch**:
    - Com base no vetor de dedos e na distância entre polegar e indicador, inferimos gestos como **Paz**, **OK**, **Pinch**, etc.
    - Uma janela de suavização reduz oscilações rápidas.

## 🛠️ Possíveis Melhorias Futuras

Para evoluir este projeto e usar no portfólio, considere implementar:

1.  **Reconhecimento de Gestos Específicos**:
    - Detectar padrões como "Soco Fechado", "Paz e Amor" (dedos 2 e 3 levantados), "Rock" (dedos 2 e 5), etc. 
    - Criar um dicionário mapeando combinações de dedos `[0,1,1,0,0]` para nomes de gestos.
2.  **Controle do PC**:
    - Usar a biblioteca `pyautogui` para controlar o mouse ou volume baseado em gestos (ex: pinça com indicador e polegar controla volume).
3.  **Interface Gráfica (GUI)**:
    - Usar `Streamlit` ou `PyGQt` para criar botões de configuração na tela, ao invés de usar apenas a janela do OpenCV.
4.  **Múltiplas Mãos**:
    - O código já suporta detecção de 2 mãos (`max_num_hands=2`), mas a lógica de contagem pode ser refinada para somar o total de dedos de ambas as mãos.

---
*Desenvolvido para fins educacionais e portfólio.*
