# ADR 0005: Migrar o desktop para MediaPipe Tasks

- Status: implementado localmente; não publicado
- Data: 2026-10-16

## Problema

O adaptador `mp.solutions.hands` exigia MediaPipe 0.10.21 e `protobuf<5`.
O pin Protobuf 4.25.9 está no intervalo afetado por
[CVE-2026-0994](https://github.com/advisories/GHSA-7gcm-g887-7qv7), cuja correção
indicada começa em 5.29.6. Elevar apenas Protobuf quebraria o contrato de instalação.
A presença da dependência não comprova que o aplicativo expõe o caminho vulnerável.

## Decisão

Usar MediaPipe Tasks 0.10.35, mesma versão da web, com `HandLandmarker` em modo VIDEO.
Os metadados dessa distribuição não exigem Protobuf nem JAX. Um ambiente Python 3.12
limpo resolve as dependências, que ficam fixadas em `python/requirements.txt`.
Não usar `--no-deps` para instalar o runtime nem forçar versões incompatíveis.

O adaptador mantém `detect(rgb_frame)`, `DetectedHand` e `close()`. As regras geométricas,
limiares de pinça, suavização e fixtures não mudam. Há timestamps monotônicos estritamente
crescentes e fechamento idempotente. Os campos de landmarks usam um protocolo de domínio;
os objetos sem stubs das bibliotecas externas ficam restritos à fronteira do adaptador.

O modelo float16 v1 é o mesmo asset versionado da web. `python -m hand_gestures.model`
faz download explícito com timeout, limite de leitura, tamanho exato e SHA-256 fixado.
O arquivo é gravado por substituição atômica e ignorado pelo Git. A inferência lê e verifica
o arquivo local, sem rede. Um arquivo existente inválido falha com instrução de recuperação.

## Consequências e limites

- O primeiro uso exige preparação do modelo; o downloader precisa de rede.
- A aplicação pode inferir offline depois de preparar modelo e dependências.
- O hash garante correspondência ao artefato revisado, não qualidade ou acurácia do modelo.
- O novo detector foi inicializado e processou um quadro vazio real no Windows/Python 3.12.
- Fixtures exercitam as regras, não medem precisão com mãos reais.
- Troca de API/modelo pode alterar landmarks e rastreamento; validação manual física continua necessária.
- O CI passa a instalar o runtime, executar `pip check`, `pip-audit`, preparar o modelo e rodar o smoke test.

## Referências

- [Guia oficial de Hand Landmarker Python](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/python).
- [Metadados da distribuição 0.10.35](https://pypi.org/pypi/mediapipe/0.10.35/json).
- [Modelo versionado](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task).
