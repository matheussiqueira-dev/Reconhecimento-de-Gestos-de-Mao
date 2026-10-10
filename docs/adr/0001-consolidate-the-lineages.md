# ADR 0001: Consolidar as três linhagens numa base só

- Status: aceito
- Data: 2026-10-10

## Contexto

O repositório tinha três históricos:

- `main` (`6066186`): só o app desktop Python inicial (contagem de dedos).
- `master` (`f241994`): histórico órfão, sem ancestral comum com a `main`, com a lógica mais rica (gestos nomeados, pinça/OK, suavização, seleção de câmera por nome, HUD), nunca integrada.
- PR #1 (`codex/finalize-vercel-dashboard-pr`, `0bd6f91` = `main` + 2 commits, em draft): a única versão web (Next.js) e um app Python modular que apagava a lógica do `master` e trazia "confianças" constantes.

Havia ainda `codex/finalize-vercel-dashboard`, duplicata órfã do PR.

## Decisão

1. A base é o PR #1: a branch `chore/vercel-standard-v1` parte de `origin/codex/finalize-vercel-dashboard-pr`, que já descende da `main` (o merge final na `main` é fast-forward).
2. O `master` entra por `git merge --allow-unrelated-histories`, mantendo `.gitignore` e README do PR. Os três commits do `master` ficam alcançáveis a partir da `main`, e a lógica dele vira a base de `python/hand_gestures/gestures.py` e de `web/src/lib/gestures`.
3. Estrutura: `web/` (o site, Root Directory na Vercel) e `python/` (referência desktop testada no CI), com `fixtures/gestures/` compartilhado.
4. Nenhuma branch é apagada nesta mudança. Apagar `master` e a duplicata é seguro depois do merge (o histórico fica preservado), mas é decisão do dono.

## Consequências

- `git log` da `main` passa a mostrar o histórico do `master`.
- O app Python do PR (contagem + 6 rótulos) é substituído pela lógica do `master`; seus módulos de estrutura (detector, métricas) são mantidos e corrigidos.
- As regras têm um contrato único, verificado nos dois lados pelas mesmas fixtures.
