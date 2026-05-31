# Arquitetura

O projeto esta dividido em duas entregas independentes.

## Python local

`python_app/` executa reconhecimento local com OpenCV e MediaPipe. A camera e aberta pelo modulo `camera.py`, os landmarks sao obtidos por `hand_detector.py`, a contagem heuristica fica em `finger_counter.py`, os nomes de gestos em `gesture_classifier.py`, as estatisticas em `metrics.py` e a renderizacao do overlay em `overlay.py`.

As dependencias pesadas sao carregadas em tempo de execucao. Isso permite que testes unitarios validem a logica principal mesmo em ambientes sem webcam ou sem suporte ao pacote MediaPipe.

## Web

`web_app/` e uma aplicacao Next.js App Router preparada para Vercel. As rotas principais sao:

- `/` para a landing page do dashboard.
- `/demo` para a experiencia com webcam no navegador.
- `/dashboard` para metricas e graficos.
- `/about` para detalhes tecnicos, privacidade e creditos.

O componente de webcam e client-side e so acessa `window`, `navigator`, `HTMLVideoElement` e MediaPipe dentro de efeitos ou handlers executados no navegador. Isso evita erros de SSR durante `npm run build`.

## Deploy

Na Vercel, configurar:

- Root Directory: `web_app`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`
