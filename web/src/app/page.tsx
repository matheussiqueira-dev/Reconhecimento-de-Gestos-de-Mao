import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GestureCatalog } from "@/components/GestureCatalog";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { pageMetadata } from "@/lib/metadata";
import { REPOSITORY_URL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ path: "/" });

const STEPS = [
  {
    title: "Câmera local",
    text: "O navegador lê a webcam só depois da sua permissão. Os quadros ficam no dispositivo.",
  },
  {
    title: "21 pontos por mão",
    text: "O MediaPipe Hand Landmarker (WebAssembly, GPU quando disponível) localiza até duas mãos por quadro.",
  },
  {
    title: "Regras explicáveis",
    text: "Pontas acima das articulações contam como dedos levantados; a distância polegar–indicador define a pinça. Uma janela de 5 quadros evita oscilação.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="grid gap-16">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid content-start gap-6">
          <h1 className="max-w-[18ch] text-display">Gestos de mão lidos pela câmera, no navegador</h1>
          <p className="text-lead text-fg-secondary">
            Uma demo de visão computacional: o MediaPipe localiza a mão, regras escritas à mão contam os dedos e
            nomeiam 11 gestos, e um painel mostra as métricas reais da sua sessão. Nada sai do seu dispositivo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/demo" className="ms-btn ms-btn--primary">
              Abrir a demo
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <Link href="/about" className="ms-btn ms-btn--secondary">
              Como funciona
            </Link>
          </div>
          <p className="text-caption text-fg-tertiary">
            Requer uma câmera e um navegador recente. O modelo (7,8 MB) só é baixado quando você ativa a câmera.
          </p>
        </div>
        <section aria-labelledby="catalog-title" className="grid gap-3">
          <h2 id="catalog-title" className="text-h3">
            Gestos reconhecidos
          </h2>
          <GestureCatalog />
        </section>
      </section>

      <section aria-labelledby="steps-title" className="grid gap-6">
        <h2 id="steps-title" className="text-h2">
          Do quadro ao gesto em três etapas
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="ms-card grid content-start gap-2">
              <p className="ms-num text-caption font-semibold text-fg-tertiary">Etapa {index + 1}</p>
              <h3 className="text-h4">{step.title}</h3>
              <p className="text-caption text-fg-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="python-title" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-3">
          <h2 id="python-title" className="text-h2">
            Duas implementações, as mesmas regras
          </h2>
          <p className="text-fg-secondary">
            Este site usa as regras em TypeScript. O repositório também traz o app desktop original em Python
            (OpenCV + MediaPipe), com HUD e seleção de câmera. As duas versões passam pelos mesmos casos de teste.
          </p>
          <p>
            <a href={REPOSITORY_URL} className="ms-link" target="_blank" rel="noopener noreferrer">
              Ver o código no GitHub<span className="ms-sr-only"> (abre em nova aba)</span>
            </a>
          </p>
        </div>
        <PrivacyNotice />
      </section>
    </div>
  );
}
