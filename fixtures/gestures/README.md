# Fixtures de gestos

Poses **sintéticas** (geometria simples, nenhuma pessoa real) com o resultado esperado escrito à mão. São a fonte de paridade entre as duas implementações:

- `python/tests/test_gestures.py` (pytest);
- `web/tests/unit/gestures.test.ts` (Vitest) e `web/tests/e2e/demo.spec.ts` (Playwright).

| Arquivo | Conteúdo |
|---|---|
| `hand-poses.json` | 15 mãos (21 pontos, coordenadas normalizadas do MediaPipe no quadro selfie) com estados dos dedos, total, gesto, rótulo e distância de pinça esperados |
| `smoothing.json` | sequências de entrada e saída esperada para a suavização de dedos e de rótulos (janela 5) |
| `generate.py` | gera os dois arquivos; só stdlib |

```bash
python fixtures/gestures/generate.py
```

Se uma regra mudar, atualize o gerador, rode-o e ajuste as duas implementações até os dois conjuntos de testes passarem.
