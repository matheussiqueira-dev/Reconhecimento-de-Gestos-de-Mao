# Segurança

## Superfície

Site 100% estático: sem API, banco, upload, autenticação, CORS ou Function. A entrada externa é a câmera do próprio visitante, processada no navegador, e o arquivo do modelo baixado do Google Cloud Storage.

## Headers (`web/next.config.ts`)

| Header | Valor |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`; `style-src 'self' 'unsafe-inline'`; `img-src 'self' blob: data:`; `font-src 'self'`; `connect-src 'self' https://storage.googleapis.com`; `worker-src 'self' blob:`; `media-src 'self' blob:`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'self'` |
| `Permissions-Policy` | `camera=(self), microphone=(), geolocation=(), payment=(), usb=()` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Powered-By` | removido (`poweredByHeader: false`) |

`'unsafe-inline'` em script e style segue o modelo "Without Nonces" da documentação do Next.js; o motivo está no [ADR 0003](adr/0003-csp-without-nonces.md). `'wasm-unsafe-eval'` é necessário para o MediaPipe compilar o WebAssembly. O runtime WASM é servido pelo próprio site com `Cache-Control: public, max-age=31536000, immutable` (a versão está no caminho).

Os testes e2e verificam os headers e que o runtime real carrega sem violação de CSP.

## Ponto de teste

`window.__GESTOS_E2E__` (troca o modelo por poses sintéticas) só é lido em builds com `NEXT_PUBLIC_E2E_STUBS=1`. O `next.config.ts` sempre define a variável, então em builds normais o ramo é eliminado pelo minificador (verificado: 0 ocorrências da string nos chunks).

## Dependências

- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades (verificado localmente em 2026-10-10; o CI repete a checagem a cada PR).
- Exceção documentada (só desenvolvimento): `braces` (GHSA-vfj7-8cjw-p6xm, alta), via `micromatch` → `fast-glob` → `@next/eslint-plugin-next` → `eslint-config-next`. Não há versão corrigida publicada (`braces *`) e o `npm audit fix --force` rebaixaria o `eslint-config-next` para antes da 14.3. O pacote só processa padrões de glob do próprio repositório durante o lint; nada disso vai para o site.
- Python: versões fixadas em `python/requirements*.txt`; `pip-audit` não está no CI (pendência).

## Relatar um problema

Abra uma issue no GitHub sem detalhes sensíveis e peça um canal privado.
