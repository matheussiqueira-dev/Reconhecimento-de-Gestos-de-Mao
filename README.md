# Hand Gesture Recognition Dashboard

Dashboard de reconhecimento de gestos de mao desenvolvido por Matheus Siqueira. O projeto combina uma versao Python local com OpenCV e MediaPipe e uma versao web em Next.js preparada para deploy na Vercel.

## Visao geral

A aplicacao detecta maos, extrai landmarks, conta dedos levantados e apresenta gestos comuns como palma aberta, punho fechado, joinha, paz e apontando. A versao web adiciona landing page, demo com webcam, dashboard de metricas, PWA basico, SEO tecnico e documentacao de privacidade.

## Funcionalidades

- Reconhecimento local com Python, OpenCV e MediaPipe.
- Arquitetura Python modular em `python_app/`.
- Demo web com webcam processada no navegador.
- Dashboard com metricas, graficos e status da sessao.
- Rotas `/`, `/demo`, `/dashboard` e `/about`.
- PWA basico com `manifest.json`.
- Creditos permanentes e clicaveis de Matheus Siqueira.
- Documentacao de arquitetura e privacidade.
- Testes unitarios para contagem, classificacao e metricas.

## Demonstracao

A versao Python abre uma janela do OpenCV e mostra o overlay de gesto, dedos e FPS. A versao web roda em Next.js e deve ser publicada na Vercel com `web_app` como Root Directory.

## Tecnologias

- Python
- OpenCV
- MediaPipe
- Pytest
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- Vercel Analytics

## Estrutura do projeto

```txt
.
├── docs/
│   ├── ARCHITECTURE.md
│   └── PRIVACY.md
├── python_app/
│   ├── camera.py
│   ├── finger_counter.py
│   ├── gesture_classifier.py
│   ├── hand_detector.py
│   ├── main.py
│   ├── metrics.py
│   └── overlay.py
├── tests/
├── web_app/
│   ├── public/
│   └── src/
├── README.md
└── requirements.txt
```

## Como rodar a versao Python

```bash
pip install -r requirements.txt
python python_app/main.py
pytest -q
```

Observacao: MediaPipe pode ainda nao disponibilizar wheel para algumas versoes muito recentes do Python. Nesse caso, use Python 3.11 ou 3.12 para a experiencia completa com webcam e MediaPipe.

## Como rodar a versao Web

```bash
cd web_app
npm install
npm run dev
npm run lint
npm run build
```

## Como publicar na Vercel

Importe o repositorio na Vercel e use:

```txt
Root Directory: web_app
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

Nao publique a pasta Python como app Vercel. A aplicacao web que deve ir para a Vercel esta em `web_app/`.

## Como funciona a deteccao de maos

Na versao Python, o OpenCV captura frames da webcam e o MediaPipe Hands identifica 21 landmarks por mao. Na versao web, o componente de demo carrega MediaPipe no navegador depois que o usuario concede permissao de camera.

## Como funciona a contagem de dedos

A contagem compara a posicao da ponta de cada dedo com suas articulacoes. Para indicador, medio, anelar e minimo, a ponta acima da articulacao indica dedo levantado. Para o polegar, a regra considera a lateralidade da mao.

## Como funciona o dashboard

O dashboard apresenta metricas de FPS, frames processados, gesto dominante, confianca e distribuicao de gestos. Ele foi desenhado para explicar o funcionamento do reconhecedor e servir como base para evolucoes futuras.

## Privacidade

Esta aplicação é uma demonstração técnica de visão computacional. O processamento ocorre localmente no navegador e nenhuma imagem da webcam é enviada para servidores.

O app nao faz identificacao pessoal, nao armazena biometria e nao grava frames da webcam.

## Limitacoes conhecidas

- Iluminacao baixa pode reduzir a precisao.
- Oclusao dos dedos pode gerar contagem incorreta.
- A versao Python depende de webcam local e suporte do MediaPipe ao Python instalado.
- A demo web depende de permissao de camera e suporte do navegador a `getUserMedia`.

## Roadmap

- Exportar sessoes anonimas de metricas.
- Adicionar novos gestos customizaveis.
- Melhorar suporte a multiplas maos.
- Criar testes end-to-end da demo web.
- Adicionar CI com validacao Python e Next.js.

## Creditos

Desenvolvido por Matheus Siqueira.

Portfolio: [www.matheussiqueira.dev](https://www.matheussiqueira.dev)

GitHub: [matheussiqueira-dev](https://github.com/matheussiqueira-dev)
