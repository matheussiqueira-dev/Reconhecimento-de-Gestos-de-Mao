# ADR 0004: Nenhuma persistência no servidor; sessão em memória

- Status: aceito
- Data: 2026-10-10

## Contexto

O PR #1 mostrava um "dashboard inteligente" com números fixos (FPS 58,6, confiança 96%, 42 eventos) e gráficos de exemplo. O padrão do portfólio proíbe números fabricados exibidos como reais.

## Decisão

- O painel (`/dashboard`) mostra só o que a demo mediu nesta aba: tempo de câmera, quadros processados, FPS, inferência média, distribuição de gestos e linha do tempo por segundo.
- Os dados ficam num store em memória (`web/src/lib/session.ts`), compartilhado entre `/demo` e `/dashboard` pela navegação client-side. Recarregar a página apaga tudo; o painel diz isso no estado vazio.
- Preferências da demo (espelhar, mostrar pontos) ficam no `localStorage`, sempre em try/catch e validadas na leitura.
- Não há banco, cookies, analytics nem exportação.

## Consequências

- Nada a proteger no servidor, nada a apagar por LGPD.
- O painel fica vazio para quem chega direto nele, por design, com um atalho para a demo.
- Exportar a sessão em JSON fica como melhoria opcional.
