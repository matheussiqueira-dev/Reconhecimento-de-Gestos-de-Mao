# ADR 0002: Site Next.js estático na Vercel, inferência no navegador

- Status: aceito
- Data: 2026-10-10

## Contexto

A demo precisa da câmera do visitante. Mandar quadros a um servidor custaria banda e Functions, aumentaria a superfície de ataque e quebraria a promessa de privacidade.

## Decisão

- Um projeto Vercel, Root Directory `web`, preset Next.js fixado em `web/vercel.json` (o projeto foi criado com o preset Other).
- Todas as rotas são estáticas; não há Functions, API, banco nem variáveis obrigatórias.
- A inferência roda no navegador com `@mediapipe/tasks-vision` 0.10.35 (`HandLandmarker`, modo VIDEO, até 2 mãos, GPU com fallback para CPU).
- O runtime WASM (~22 MB, 4 arquivos) é copiado de `node_modules` para `public/mediapipe/<versão>/` no `predev`/`prebuild` e servido com cache imutável. Um teste garante que a versão do caminho é a do `package.json`.
- O modelo `hand_landmarker.task` (7,8 MB) continua no Google Cloud Storage, por decisão do dono em 2026-10-10. A CSP libera só essa origem no `connect-src`.
- O app Python não é publicado; o `.vercelignore` o deixa fora de uploads pela CLI.
- Upgrade para `@mediapipe/tasks-vision` 1.x fica para uma decisão futura.

## Consequências

- Custo de compute zero; a cota relevante é a de transferência (o WASM de ~11 MB por variante baixa uma vez por visitante e fica em cache).
- A câmera exige contexto seguro, garantido pelo HTTPS forçado da Vercel.
- Se o Google mover o modelo, a demo para de carregar o modelo até o `MODEL_URL` ser atualizado; o self-host é a alternativa registrada.
