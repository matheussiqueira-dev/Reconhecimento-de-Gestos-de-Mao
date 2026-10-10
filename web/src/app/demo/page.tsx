import { WebcamGestureDemo } from "@/components/demo/WebcamGestureDemo";
import { DeveloperCredits } from "@/components/credits/DeveloperCredits";
import { PrivacyNotice } from "@/components/PrivacyNotice";

export const metadata = {
  title: "Demo",
  description: "Demo com webcam para reconhecimento local de gestos de mao.",
};

export default function DemoPage() {
  return (
    <div className="content-shell py-10">
      <div className="mb-7 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Demo com webcam
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)] sm:text-4xl">
          Reconhecimento local direto no navegador.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          A camera so inicia apos sua permissao. O componente carrega MediaPipe no
          client-side e calcula contagem de dedos sem enviar frames ao servidor.
        </p>
      </div>
      <WebcamGestureDemo />
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.7fr]">
        <PrivacyNotice />
        <DeveloperCredits compact />
      </div>
    </div>
  );
}
