# AGENTS.md: Reconhecimento-de-Gestos-de-Mao

Regras gerais: `C:\Users\mathe\Documents\Programação\AGENTS.md` e o padrão em `padrao-projetos/`. Aqui fica só o que é específico deste repositório.

## Estrutura

- `web/`: Next.js 16 App Router + Tailwind 4. É o Root Directory da Vercel.
- `python/`: app desktop (OpenCV + MediaPipe Tasks 0.10.35), Python 3.12. Fora do deploy.
- `fixtures/gestures/`: poses sintéticas e resultado esperado, lidos pelo pytest e pelo Vitest. Ao mudar uma regra, mude os dois lados e as fixtures juntos (`python fixtures/gestures/generate.py`).
- `tools/brand/`: gera ícones, favicon, monograma e OG a partir de `ms-tokens.css`.

## Comandos

```bash
cd web && npm ci && npm run lint && npm run typecheck && npm test && npm run build
cd web && npm run test:e2e          # Playwright + axe; build com NEXT_PUBLIC_E2E_STUBS=1 na porta 3200
cd python && pip install -r requirements-dev.txt && sh scripts/check.sh
cd python && pip install -r requirements.txt && python -m hand_gestures.model && python -m hand_gestures --self-check
```

## Exceções e armadilhas

- Playwright local usa o Edge instalado (`PLAYWRIGHT_CHANNEL=msedge`, padrão): o App Control do Windows bloqueia o Chromium baixado. O CI usa `chromium`.
- Python local: 3.12.10 confirmado em 2026-10-16. Runtime Tasks 0.10.35 validado com `--self-check` em ambiente isolado. Preserve Python 3.12 no CI.
- O modelo Python é preparado por `python -m hand_gestures.model` e fica em `python/models/` (ignorado). Tamanho e SHA-256 são verificados antes de carregar; não adicione download automático ao loop.
- `web/src/app/ms-tokens.css` é cópia byte a byte do padrão v1.0; um teste confere o SHA-256. Não edite.
- O runtime WASM em `web/public/mediapipe/` é gerado (ignorado pelo Git). Ao atualizar `@mediapipe/tasks-vision`, atualize `MEDIAPIPE_VERSION` em `web/src/lib/mediapipe/config.ts`; o teste de config falha se divergir.
- `NEXT_PUBLIC_E2E_STUBS` só existe para o build de e2e; o `next.config.ts` sempre a define para o ramo sumir dos builds normais.
- Em grids de layout use trilhas `minmax(0,1fr)` (`grid-cols-1`): o palco da câmera tem `aspect-ratio`, e em trilha `auto` a altura do conteúdo vira largura mínima (estouro em 320 px).
- Hex só nos tokens e na allowlist (theme-color, `<html>` inline, manifest, assets). Canvas lê cores com `getComputedStyle`.
- O comando de formatação do ruff fica em `python/scripts/check.sh` e `fix.sh`.
