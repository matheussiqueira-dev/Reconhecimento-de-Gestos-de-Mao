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

Processa os quadros localmente e não faz requisições de rede durante o uso. A instalação baixa pacotes do PyPI.

## Limites de uso

O projeto é educacional e de portfólio. Não use como sistema de autenticação, vigilância, uso clínico ou decisão automatizada de alto impacto.
