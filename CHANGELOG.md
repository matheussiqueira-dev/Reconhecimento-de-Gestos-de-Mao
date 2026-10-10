# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem [SemVer](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-10-10

Consolida a `main`, o PR #1 (versão web) e o histórico órfão do `master`. Veja [ADR 0001](docs/adr/0001-consolidate-the-lineages.md).

### Adicionado

- Gestos do `master` na web e no Python: Três, Quatro, L, OK e Pinça (|4-8| / |0-9| ≤ 0,35), com suavização por maioria em 5 quadros.
- Fixtures douradas sintéticas compartilhadas por pytest e Vitest.
- Até duas mãos na web; score real de lateralidade no lugar das confianças fixas.
- Estados da câmera: permissão negada (com passos), sem câmera, em uso, resolução, contexto inseguro, WebAssembly ausente, falha de modelo; "Nenhuma mão detectada".
- Painel com métricas medidas da sessão e tabelas alternativas.
- Headers de segurança (CSP, Permissions-Policy, nosniff, Referrer-Policy, frame-ancestors).
- Metadata, OG, JSON-LD, robots, sitemap, manifest e ícones gerados.
- Testes e2e (Playwright + axe) e CI com lint, typecheck, testes, build, audit e smoke test do runtime Python.
- `python -m hand_gestures --self-check`.

### Alterado

- Web em `web/` e desktop em `python/hand_gestures/`.
- Next.js 16.2.6 → 16.4.0 (corrige o alerta crítico das versões ≤ 16.3.7), React 19.2.8, Tailwind 4.3.3, lucide-react 1.55.0.
- Runtime WASM do MediaPipe servido pelo próprio site.
- Identidade visual: tokens `ms-tokens.css` v1.0, dark-only, IBM Plex Sans, header e footer padrão.
- Python fixado em 3.12 e `mediapipe` 0.10.21 (a 0.10.30+ removeu `mp.solutions`).

### Removido

- Vercel Web Analytics e Recharts.
- Números de vitrine ("58.4 FPS", "18 ms", painel com dados fixos).
- Exigência da câmera "Brio 305" no app desktop (agora `--camera-name` opcional).
- `check_camera.py` (substituído por `--list-cameras`).

### Corrigido

- Loop infinito quando a câmera parava de enviar quadros (desktop).
- Último gesto mantido na tela depois que a mão saía do quadro.
- `HandLandmarker` nunca fechado e câmera sem `close()` ao sair da página.
- `tsc` falhando por `baseUrl` obsoleto no TypeScript 6.
- `pytest -q` sem encontrar o pacote.

## [1.0.0] - 2025-12-07

- App desktop inicial: contagem de dedos com OpenCV e MediaPipe.
