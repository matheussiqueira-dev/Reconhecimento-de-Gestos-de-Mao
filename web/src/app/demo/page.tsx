import type { Metadata } from "next";
import { CameraDemo } from "@/components/demo/CameraDemo";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/demo",
  title: "Demo",
  description:
    "Ative a câmera e veja o MediaPipe localizar sua mão e as regras nomearem o gesto em tempo real, sem enviar o vídeo.",
});

const TIPS = [
  "Mostre a palma de frente para a câmera, a cerca de meio metro.",
  "Prefira luz frontal; contraluz e pouca luz derrubam a detecção.",
  "Mantenha uma pose por meio segundo: a leitura usa os últimos 5 quadros.",
  "Polegar, L e OK dependem da lateralidade; com o vídeo espelhado, a mão direita aparece à direita.",
] as const;

export default function DemoPage() {
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="grid gap-3">
        <h1 className="text-h1">Demo com câmera</h1>
        <p className="text-lead text-fg-secondary">
          Ative a câmera e mostre uma ou duas mãos. O gesto, os dedos levantados e a confiança do modelo
          aparecem no painel de leitura, atualizados cerca de dez vezes por segundo.
        </p>
      </div>

      <CameraDemo />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="tips-title" className="grid gap-3">
          <h2 id="tips-title" className="text-h3">
            Para uma leitura estável
          </h2>
          <ul className="grid list-disc gap-2 pl-5 text-caption text-fg-secondary">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
        <PrivacyNotice />
      </div>
    </div>
  );
}
