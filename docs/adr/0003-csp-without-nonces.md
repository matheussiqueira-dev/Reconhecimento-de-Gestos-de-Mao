# ADR 0003: CSP sem nonces

- Status: aceito (padrão do Bloco A, sujeito à revisão do dono)
- Data: 2026-10-10

## Contexto

O App Router do Next.js injeta scripts inline de inicialização. Uma CSP sem `'unsafe-inline'` exige nonce, e nonce exige renderização dinâmica por requisição: as quatro rotas deixariam de ser estáticas e passariam a rodar numa Function. A outra saída, SRI (`experimental.sri`), ainda é experimental e, no Next 16, depende do bundler webpack.

## Decisão

Seguir o modelo "Without Nonces" da documentação do Next.js (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`):

- `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'` (`'unsafe-eval'` só em desenvolvimento);
- `style-src 'self' 'unsafe-inline'`;
- `connect-src 'self' https://storage.googleapis.com`; demais diretivas restritivas (veja `docs/SECURITY.md`).

## Consequências

- O site continua 100% estático e sem Functions.
- `'unsafe-inline'` enfraquece a proteção contra XSS. O risco residual é baixo: não há entrada de usuário renderizada como HTML, nem dados de terceiros no DOM, nem `innerHTML` com dados (o único `dangerouslySetInnerHTML` é o JSON-LD estático, com `<` escapado).
- Migrar para nonces ou SRI é uma decisão do dono, a reavaliar quando o SRI do Next deixar de ser experimental.
