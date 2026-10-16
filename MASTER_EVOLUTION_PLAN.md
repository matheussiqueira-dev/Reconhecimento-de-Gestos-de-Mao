# Plano executivo de evolução

Data: 2026-10-16. Este documento separa implementação, evidência e investimento futuro.

## Resultado executivo

O diagnóstico encontrou uma base já modernizada em outubro de 2026: web estática,
regras compartilhadas, métricas medidas e CI. A evolução atual corrige o acoplamento
desktop à API antiga do MediaPipe e ao Protobuf vulnerável, fortalece o ciclo de vida
dos recursos e amplia a evidência automatizada. Não é uma reescrita nem uma certificação
de prontidão enterprise. Não foram introduzidos serviço pago ou processamento remoto.

| Antes desta rodada | Implementação atual | Limite da evidência |
|---|---|---|
| MediaPipe legado 0.10.21 / Protobuf 4.25.9 | Tasks 0.10.35 sem Protobuf/JAX na árvore resolvida | Smoke com quadro vazio; mãos reais pendentes |
| Limpeza principal só após inicialização | `ExitStack` cobre inicialização e loop | Drivers físicos não foram exercitados |
| Detector fora da cobertura | Adaptador e modelo testados isoladamente | Stubs não medem comportamento visual do modelo |
| Sem auditoria Python no CI | `pip check` e `pip-audit --strict` | Workflow ainda não executado remotamente |
| Orientação técnica distribuída | Overview, roadmap, ADR e plano unificados | Propostas futuras continuam não implementadas |

## Princípios de arquitetura

1. Preservar inferência local: não há motivo atual para enviar vídeo a um backend.
2. Regras e métricas são domínio; MediaPipe, câmera e armazenamento são adaptadores.
3. Adotar interfaces pequenas quando houver substituição real; evitar framework de DI
   ou microsserviços para uma aplicação sem backend.
4. Manter os dois consumidores das fixtures sincronizados quando regras mudarem.
5. Medir antes de alegar melhoria de performance. Um build verde não demonstra FPS,
   latência perceptível, acessibilidade completa ou acurácia com usuários reais.
6. Usar infraestrutura existente e dependências abertas; revisar termos e limites de
   hospedagem antes de prometer custo zero para uso comercial em escala.

## Blocos críticos refatorados por domínio

### Recursos de câmera

Padrão aplicado em `python/hand_gestures/app.py` e `camera.py`:

```python
with ExitStack() as resources:
    resources.callback(cap.release)
    # Aquecer/configurar; uma falha mantém a limpeza registrada.
    resources.pop_all()  # Transfere propriedade somente após sucesso.
```

Na orquestração, os callbacks de detector, captura e janela permanecem registrados até
o término. A pilha tenta executar os outros callbacks mesmo se um deles falhar.
Erros operacionais retornam código 1 e mensagem de recuperação sem stack nativa na UI.

### Inferência temporal

Trecho do adaptador `python/hand_gestures/detector.py`:

```python
timestamp_ms = max(
    self._last_timestamp_ms + 1,
    int((time.monotonic() - self._started_at) * 1000),
)
self._last_timestamp_ms = timestamp_ms
result = self._hands.detect_for_video(image, timestamp_ms)
```

Preserva ordem temporal quando a resolução do relógio resulta em timestamps iguais.
O adaptador converte o resultado Tasks para `DetectedHand`; as regras não importam MediaPipe.

### Modelo e cadeia de fornecimento

Trecho do módulo `python/hand_gestures/model.py`:

```python
if len(data) != MODEL_SIZE_BYTES or hashlib.sha256(data).hexdigest() != MODEL_SHA256:
    raise ModelUnavailableError("Model integrity check failed.")
```

A implementação completa limita a leitura, usa HTTPS com verificação padrão, timeout,
arquivo temporário e substituição atômica. O hash é referência do artefato obtido em
2026-10-16, não uma assinatura do fornecedor. Uma atualização do modelo exige revisão
da procedência e alteração consciente do pin. Levar a mesma checagem ao loader web é
um próximo endurecimento possível, ainda não implementado.

### Testes do ciclo de vida

Desktop: câmera inexistente, aquecimento sem frames, erro do driver, configuração,
criação da janela, conversão, inferência, limite de quadros e falha de fechamento.
Modelo: corrupção, tamanho divergente, cache local e limpeza de escrita temporária.
Web: inicialização tardia após navegação, fallback GPU/CPU e falha da CPU, além da suíte existente.

## Benchmarking direcionado

O [exemplo oficial de Worker do MediaPipe](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/hand-landmarker.worker.ts)
mostra inferência com bitmap e devolução dos resultados. É uma referência de estrutura,
não evidência de ganho de performance neste projeto. O [guia oficial Python](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/python)
distingue execução síncrona de VIDEO e assíncrona de LIVE_STREAM; VIDEO preserva um
fluxo determinístico no loop desktop atual.

[TensorFlow.js Hand Pose Detection](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)
é alternativa para experimento; a consulta de conteúdo dessa página não foi concluída
nesta rodada, portanto não fundamenta alegações comparativas de precisão ou velocidade.
[ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/) é alternativa se existir
um modelo ONNX próprio. Não há hoje dataset ou requisito que justifique substituir o motor.

Essas referências não constituem estudo quantitativo de mercado, entrevistas com usuários
ou ranking competitivo. A oportunidade inferida é tornar a demo imediatamente avaliável,
explicável e exportável, antes de ampliar o catálogo de tecnologias.

## Guias táticos das próximas features

### 1. Demo guiada sem câmera

- Criar um adaptador público de dados sintéticos separado do hook privado de e2e.
- Usar as fixtures existentes com playback determinístico, pausa e seleção de gesto.
- Manter aviso visível de dados sintéticos no palco e no painel.
- Não misturar métricas sintéticas com métricas de câmera real.
- Aceite: nenhuma chamada `getUserMedia`, funcionamento por teclado e teste em 320 px.

### 2. Exportação de sessão

- Capturar snapshot imutável no clique e gerar JSON/CSV por `Blob`, sem serviço externo.
- Incluir versão do schema, app, origem real/sintética, contagem de quadros e unidades.
- Explicar a semântica atual de primeira mão e suavização, sem chamar contagem por quadro
  de número de eventos físicos.
- Não exportar frames ou landmarks por padrão. Revogar o object URL após uso.
- Aceite: arquivo reaberto em teste com os mesmos agregados e origem explícita.

### 3. Worker de inferência

- Separar contrato de mensagens: init, detect, result, error e dispose, com geração e frameId.
- Permitir um quadro em voo; descartar próximos até concluir, sem fila crescente.
- Transferir `ImageBitmap`, fechar após uso e descartar respostas de geração antiga.
- Preservar fallback CPU e testar stop durante init/inferência.
- Comparar main thread e Worker no mesmo hardware, modelo, resolução e cenário.
- Aceite: responsividade medida e ausência de vazamento após ciclos repetidos. Não fixar
  meta de FPS universal nem prometer que Worker acelera a inferência.

### 4. Robustez geométrica e comandos

- Para rotação, projetar landmarks num referencial da palma ou usar ângulos articulares;
  alterar Python/TS/fixtures na mesma mudança.
- Acrescentar poses rotacionadas, mãos cruzadas e oclusões sem inventar ground truth real.
- Validar amostra real autorizada com iluminação, câmera e perfil documentados.
- Comandos por gesto precisam de permanência temporal, cooldown e confirmação para ações
  de maior impacto; começar por ações locais reversíveis.

## Sequência e controle de qualidade

Primeiro concluir revisão manual do runtime físico e revisão do diff desta entrega.
Depois priorizar demo guiada e exportação, pois tornam o produto avaliável sem depender
da câmera do recrutador. Worker e novos critérios geométricos vêm após baseline medido.
Autenticação, contas, banco e observabilidade SaaS não estão no escopo atual.

Antes de publicar, repetir build normal sem stubs, checks relevantes e sessão manual.
Push, PR e deploy não foram executados nesta rodada. A decisão de publicação deve considerar
o alerta de desenvolvimento ainda documentado e o resultado do CI remoto após push autorizado.
