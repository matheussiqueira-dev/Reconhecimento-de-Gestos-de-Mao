# Privacidade

Esta é uma demonstração técnica de visão computacional. O processamento da câmera acontece no seu dispositivo.

## O que sai do navegador

| Requisição | Quando | Destino | Conteúdo |
|---|---|---|---|
| Páginas, JS, CSS, fontes, ícones, runtime WASM | ao navegar | o próprio site (Vercel) | requisição web comum |
| Modelo `hand_landmarker.task` (7,8 MB) | ao clicar em "Ativar câmera", uma vez por visita | `storage.googleapis.com` (Google Cloud Storage) | requisição web comum: IP, navegador; sem cookies (`credentials: "omit"`) e sem referer |

Nenhum quadro, imagem, vídeo, áudio ou ponto da mão é enviado a qualquer servidor.

## O que fica no dispositivo

- Métricas da sessão (quadros, FPS, gestos): só na memória da aba. Recarregar a página apaga.
- Preferências da demo (espelhar vídeo, mostrar pontos): `localStorage`, chave `gestos-de-mao:preferences:v1`.

Não há analytics, Speed Insights, cookies, cadastro nem identificação de pessoas. O app não guarda biometria.

## App desktop (Python)

Processa os quadros localmente e não faz requisições de rede durante a inferência. A instalação baixa pacotes do PyPI. A preparação explícita (`python -m hand_gestures.model`) baixa o modelo oficial do Google Cloud Storage, verifica tamanho e SHA-256 e o mantém em `python/models/`. Essa requisição expõe os dados usuais de conexão, como IP; não envia quadros da câmera. Depois da preparação, o detector usa o arquivo local.

## Limites de uso

O projeto é educacional e de portfólio. Não use como sistema de autenticação, vigilância, uso clínico ou decisão automatizada de alto impacto.
