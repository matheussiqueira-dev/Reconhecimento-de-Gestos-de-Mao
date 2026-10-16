# Roadmap, ferramentas e evidências

Atualização: 2026-10-16. Nenhuma publicação, integração paga ou plugin instalado.

## Execução da modernização

| Fase | Trabalho | Estado |
|---|---|---|
| 1 — Diagnóstico | Histórico, arquitetura, manifests, runtime local e auditorias | Executado; relatório inicial entregue |
| 2 — Refatoração | Tasks Python, remoção da árvore legada, limpeza de recursos, testes e CI | Implementado localmente |
| 3 — Pesquisa | Referências oficiais, comparação de motores e propostas de features | Pesquisa direcionada e escopo documentados; features propostas não implementadas |
| 4 — Documentação | Visão técnica, roadmap, plano executivo e ADR | Documentos criados; não publicados |

## Skills e ferramentas efetivamente utilizadas

| Ferramenta/skill | Aplicação |
|---|---|
| `repository-health-check` | Diagnóstico baseado em Git, configuração e checks existentes |
| `security-review` | Revisão das dependências e fronteiras alteradas, sem teste intrusivo |
| PowerShell, Git e ripgrep | Inspeção local, histórico, escopo de arquivos e preservação de WIP |
| npm e registro npm | Versões exatas, lockfile, instalação e auditoria |
| Python venv e pip | Ambientes isolados, resolução e `pip check` |
| Ruff, mypy e pytest-cov | Estilo, tipagem e regressões Python |
| Vitest, Playwright e axe | Contratos TS, ciclo de câmera e acessibilidade automatizada |
| Documentação Google e GitHub | Confirmação da API Tasks e comparação de abordagens |
| `pip-audit` 2.10.1 | Nova etapa de auditoria do runtime no CI |

Nenhum agente delegado foi criado. Não foram habilitados plugins de terceiros nem
conectores com acesso a contas: os recursos existentes bastaram para esta entrega.

## Dependências e decisões

- MediaPipe Python 0.10.35: substitui `mp.solutions` por Tasks e remove a exigência
  de Protobuf vulnerável. A web já usava essa versão; não houve migração major de MediaPipe.
- OpenCV e NumPy: preservados para reduzir mudanças simultâneas no pipeline.
- Next.js/ESLint Config 16.4.2, Playwright 1.64.1 e Vitest 5.0.5: atualizações patch.
- React, TypeScript e ESLint: mantidos; majors dependem de validação própria. `npm ci` emitiu aviso de fim de suporte do ESLint 9.39.5; avaliar ESLint 10 em mudança específica. As atualizações patch diretas também atualizaram transitivas no lockfile.
- `pip-audit`: ferramenta de CI, não dependência de inferência ou do visitante.
- Downloader, hash, limpeza e timestamps: biblioteca padrão Python; sem pacote novo.

## Registro de validação

| Check | Resultado local |
|---|---|
| Python Ruff e formatação | Passaram |
| Python mypy estrito | Passou, 19 arquivos |
| pytest | 68 passaram |
| Cobertura | Total 85%; regras 99%; detector 98%; câmera 79% |
| Runtime Tasks/Python 3.12.10 | Smoke real em quadro vazio passou |
| `pip check` do ambiente runtime isolado | Sem requisitos quebrados |
| `pip-audit` dos pins completos | Sem vulnerabilidades conhecidas reportadas |
| Web: `npm ci`, lint e typecheck | Passaram |
| Web: Vitest | 40 passaram |
| Web: Playwright/Edge | 35 passaram, incluindo runtime real com vídeo sintético |
| Web: acessibilidade automatizada | Sem violações serious/critical nos cenários axe; não é auditoria manual completa |
| Web: build normal sem stubs | Passou; nenhuma referência a `__GESTOS_E2E__` nos chunks |
| npm audit de produção | Nenhuma vulnerabilidade reportada |
| npm audit completo | 5 entradas high na cadeia de `braces`, um advisory raiz |
| CI remoto / deploy | Não executados nesta entrega |
| Mão física / câmera física | Não verificado nesta entrega |

A primeira auditoria local dos pins usou `--no-deps --disable-pip`, pois a lista foi resolvida
e congelada em ambiente isolado; não foi uma instalação que ignorou dependências.
A validação final também passou com resolução normal e `--strict`, como no CI. A aprovação de CI remoto
depende de uma execução futura, após publicação autorizada do código.

## Backlog priorizado com critérios de aceite

| Ordem | Proposta | Valor | Critério de aceite |
|---|---|---|---|
| 1 | Demo guiada sem câmera | Permitir avaliação imediata por recrutadores | Rótulo sintético permanente, nenhuma permissão de câmera, métricas separadas das reais |
| 2 | Exportação local de sessão | Mostrar rastreabilidade analítica | JSON/CSV com versão e origem, sem imagem, exportação iniciada pelo usuário |
| 3 | Inferência em Web Worker | Proteger interações durante inferência | Fila limitada a um quadro, descarte de resultados tardios, benchmark comparativo |
| 4 | Regras resistentes à rotação | Reduzir dependência de mão vertical | Casos compartilhados PT/TS, fixtures rotacionadas e conjunto real com origem autorizada |
| 5 | Comandos por gesto | Demonstrar aplicação prática | Confirmação temporal, cooldown, opção de desligar e ações locais reversíveis |
| 6 | Qualidade de captura | Guiar posicionamento e iluminação | Separar heurística de qualidade da confiança do modelo; testar recuperações |

Os detalhes táticos estão em `MASTER_EVOLUTION_PLAN.md`. Os itens acima são propostas,
não promessas de prazo, ganhos de FPS ou acurácia. A implementação deve seguir essa ordem
após revisão do escopo, sem adicionar autenticação ou backend sem necessidade de produto.

## Bibliotecas gratuitas consideradas

| Opção | Uso possível | Decisão |
|---|---|---|
| MediaPipe Tasks | Landmarks locais | Mantido; já resolve o problema |
| Web Workers, ImageBitmap, Blob e Web Crypto | Concorrência, exportação e integridade | APIs nativas preferidas para a próxima etapa |
| TensorFlow.js Hand Pose Detection | Experimento comparativo de inferência | Não instalado; precisaria justificar bundle, modelo e conversão de coordenadas |
| ONNX Runtime Web | Modelo próprio ONNX no navegador | Não instalado; só se houver modelo/dataset e requisito que MediaPipe não atenda |

Referências: [Tasks Python](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/python),
[Worker oficial](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/hand-landmarker.worker.ts),
[TensorFlow.js](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection),
[ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/).

## Próxima operação

Revisar diff e executar uma sessão manual com mão real antes de divulgar a migração como
validada para reconhecimento físico. A branch contém mudanças locais sem commit/push;
publicação não faz parte do resultado local. O alerta de desenvolvimento de `braces`
permanece documentado em `docs/SECURITY.md`, sem downgrade forçado para ocultá-lo.
