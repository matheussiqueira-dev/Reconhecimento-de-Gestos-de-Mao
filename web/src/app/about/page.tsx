import type { Metadata } from "next";
import { GestureCatalog } from "@/components/GestureCatalog";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { formatDecimal, formatRatio } from "@/lib/format";
import { PINCH_DISTANCE_THRESHOLD } from "@/lib/gestures";
import { LANDMARKER_OPTIONS, MEDIAPIPE_VERSION } from "@/lib/mediapipe/config";
import { pageMetadata } from "@/lib/metadata";
import { REPOSITORY_URL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "Como funciona",
  description:
    "Arquitetura, regras dos gestos, suavização, lateralidade, limitações e privacidade da demo de reconhecimento de gestos de mão.",
});

export default function AboutPage() {
  return (
    <div className="grid max-w-[var(--ms-layout-max)] gap-12">
      <div className="grid gap-3">
        <h1 className="text-h1">Como funciona</h1>
        <p className="text-lead text-fg-secondary">
          Visão computacional no navegador, com regras que dá para ler e conferir.
        </p>
      </div>

      <section aria-labelledby="pipeline-title" className="ms-prose">
        <h2 id="pipeline-title" className="text-h2">
          Do vídeo ao gesto
        </h2>
        <ul>
          <li>
            A câmera é aberta com <code>getUserMedia</code> em 640×360 (ou o modo mais próximo) e só depois do seu
            clique.
          </li>
          <li>
            O MediaPipe Tasks Vision {MEDIAPIPE_VERSION} roda em WebAssembly servido por este site. O modelo Hand
            Landmarker (float16, Apache-2.0) vem do Google Cloud Storage. Com WebGL2 a inferência usa a GPU;
            sem ele, a CPU.
          </li>
          <li>
            Até {LANDMARKER_OPTIONS.numHands} mãos por quadro, com detecção mínima de{" "}
            {formatDecimal(LANDMARKER_OPTIONS.minHandDetectionConfidence)} e rastreamento mínimo de{" "}
            {formatDecimal(LANDMARKER_OPTIONS.minTrackingConfidence)}, os mesmos limiares do app Python.
          </li>
          <li>
            Cada mão vira 21 pontos normalizados. As regras abaixo transformam esses pontos em dedos levantados e
            num gesto; nenhuma rede neural decide o nome do gesto.
          </li>
        </ul>
      </section>

      <section aria-labelledby="rules-title" className="grid gap-4">
        <div className="ms-prose">
          <h2 id="rules-title" className="text-h2">
            As regras
          </h2>
          <ul>
            <li>
              Indicador, médio, anelar e mínimo: o dedo está levantado quando a ponta fica acima da articulação do
              meio (pontos 8/6, 12/10, 16/14 e 20/18).
            </li>
            <li>
              Polegar: compara a ponta (4) com a articulação (3) no eixo horizontal; o lado depende de a mão ser
              direita ou esquerda.
            </li>
            <li>
              Pinça: distância entre as pontas do polegar e do indicador dividida pelo tamanho da palma (punho até a
              base do médio). Até {formatRatio(PINCH_DISTANCE_THRESHOLD)}, vira OK ou Pinça.
            </li>
          </ul>
        </div>
        <GestureCatalog />
      </section>

      <section aria-labelledby="smoothing-title" className="ms-prose">
        <h2 id="smoothing-title" className="text-h2">
          Suavização e lateralidade
        </h2>
        <p>
          Cada dedo vale o que apareceu em pelo menos metade dos últimos 5 quadros, e o gesto exibido é o mais
          frequente nesses quadros. Quando uma mão sai do quadro, o histórico dela é descartado, então a tela mostra
          “Nenhuma mão detectada” em vez do último gesto.
        </p>
        <p>
          O MediaPipe rotula direita e esquerda supondo uma imagem espelhada (selfie). O app desktop espelha o quadro
          antes da inferência; a web espelha os pontos e troca o rótulo depois. Assim as duas versões aplicam as
          regras no mesmo referencial, e a confiança exibida é o score que o modelo dá para essa lateralidade.
        </p>
      </section>

      <section aria-labelledby="python-title" className="ms-prose">
        <h2 id="python-title" className="text-h2">
          Implementação Python de referência
        </h2>
        <p>
          A pasta <code>python/</code> do{" "}
          <a href={REPOSITORY_URL} className="ms-link" target="_blank" rel="noopener noreferrer">
            repositório<span className="ms-sr-only"> (abre em nova aba)</span>
          </a>{" "}
          tem o app desktop original (OpenCV + MediaPipe 0.10.21, Python 3.12): HUD com até duas mãos, medidor de
          pinça, seleção de câmera por nome e atalhos de teclado. Ele não faz parte do site. Os mesmos casos de
          teste sintéticos verificam as regras em Python e em TypeScript.
        </p>
      </section>

      <section aria-labelledby="limits-title" className="ms-prose">
        <h2 id="limits-title" className="text-h2">
          Limitações
        </h2>
        <ul>
          <li>As regras assumem a mão em pé, com a palma voltada para a câmera; mão deitada ou de costas engana a contagem.</li>
          <li>Dedos sobrepostos, pouca luz e contraluz reduzem a precisão.</li>
          <li>Um punho com a ponta do polegar encostada na ponta do indicador pode ser lido como Pinça.</li>
          <li>Não é um sistema de identificação, autenticação, acessibilidade assistiva nem uso clínico.</li>
        </ul>
      </section>

      <PrivacyNotice />
    </div>
  );
}
