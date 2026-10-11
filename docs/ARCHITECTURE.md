# Arquitetura

## Visão geral

| Parte | Onde roda | Entrada | Saída |
|---|---|---|---|
| `web/` | navegador (site estático na Vercel) | câmera via `getUserMedia` | overlay, leitura e painel da sessão |
| `python/` | desktop do usuário | câmera via OpenCV | janela com HUD |
| `fixtures/gestures/` | testes | poses sintéticas | resultado esperado escrito à mão |

Não há servidor de aplicação: nenhuma rota de API, banco, upload ou Function. O deploy é só HTML, JS, CSS e o runtime WASM.

## Web

1. **Câmera** (`src/components/demo/CameraDemo.tsx`): `getUserMedia` com `ideal` 640×360, `facingMode: "user"`, sem áudio. Cada `DOMException` vira uma mensagem PT-BR (`src/lib/camera.ts`).
2. **Modelo** (`src/lib/mediapipe/loader.ts`): baixa `hand_landmarker.task` com progresso real e guarda em memória até o fim da visita; carrega o runtime de `/mediapipe/0.10.35/wasm` (copiado de `node_modules` por `scripts/copy-mediapipe-wasm.mjs`); tenta o delegate GPU quando há WebGL2 e cai para CPU.
3. **Inferência**: `detectForVideo` a cada quadro novo do vídeo (`requestVideoFrameCallback`, com `requestAnimationFrame` como alternativa), até 2 mãos, detecção 0,7, presença 0,5, rastreamento 0,5.
4. **Regras** (`src/lib/gestures`): o resultado é convertido para o quadro selfie (x espelhado, lateralidade trocada) e classificado; a suavização usa 5 quadros por lado da mão.
5. **Apresentação**: o overlay é desenhado direto no canvas a cada quadro; o estado React é atualizado a ~10 Hz; anúncios para leitor de tela no máximo a cada 1,5 s.
6. **Sessão** (`src/lib/session.ts`): um store em memória, publicado a 4 Hz, alimenta `/dashboard` por `useSyncExternalStore`.

Parar ou sair da página encerra todas as `MediaStreamTrack`, chama `HandLandmarker.close()` e cancela o loop. Um contador de geração descarta inícios assíncronos que terminam depois de um "Parar".

### Quadro selfie

O MediaPipe rotula direita/esquerda supondo imagem espelhada. O app Python espelha o quadro antes da inferência (`cv2.flip`); a web passa o quadro cru e depois espelha os pontos e troca o rótulo (`toSelfieFrame`). Assim as duas versões aplicam as regras no mesmo referencial, e as fixtures valem para ambas.

## Python

`python/hand_gestures/`:

- `gestures.py`: regras e suavização (mesmo contrato da web);
- `camera.py`: backend DirectShow no Windows, busca por nome (pygrabber opcional), sondagem de índices;
- `detector.py`: MediaPipe Hands legado (`mp.solutions`), até 2 mãos, com score de lateralidade;
- `metrics.py`: FPS e estatísticas medidas;
- `overlay.py`: HUD em OpenCV com as cores dos tokens em BGR;
- `app.py`: CLI, loop e teclas.

OpenCV e MediaPipe são importados sob demanda, então os testes rodam só com `requirements-dev.txt`.

## Decisões

Veja [docs/adr/](adr/).
