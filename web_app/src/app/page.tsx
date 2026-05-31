import Link from "next/link";
import { ArrowRight, Camera, Gauge, Hand, ShieldCheck } from "lucide-react";
import { DeveloperCredits } from "@/components/credits/DeveloperCredits";
import { PrivacyNotice } from "@/components/PrivacyNotice";

const featureItems = [
  {
    title: "Webcam local",
    description: "Captura sob permissao do usuario e processamento no navegador.",
    icon: Camera,
  },
  {
    title: "Contagem de dedos",
    description: "Heuristica sobre landmarks para identificar dedos levantados.",
    icon: Hand,
  },
  {
    title: "Metricas em tempo real",
    description: "FPS, confianca, gesto dominante e distribuicao de eventos.",
    icon: Gauge,
  },
  {
    title: "Privacidade clara",
    description: "Sem envio de frames, sem biometria armazenada e sem identificacao.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <div>
      <section className="border-b border-[var(--border)] bg-white">
        <div className="content-shell grid min-h-[calc(100vh-64px)] items-center gap-10 py-10 lg:grid-cols-[1fr_0.86fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
              Hand Gesture Recognition Dashboard
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-[var(--ink)] sm:text-5xl">
              Reconhecimento de gestos de mao com Python, MediaPipe e Next.js.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Uma entrega tecnica completa com versao Python local, demo web com
              webcam, dashboard inteligente, documentacao de privacidade e deploy
              preparado para Vercel.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="focus-ring inline-flex items-center gap-2 rounded-md bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b5f59]"
              >
                Abrir demo
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                href="/dashboard"
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--blue)]"
              >
                Ver dashboard
              </Link>
            </div>
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-[var(--border)] bg-[var(--ink)] px-5 py-4 text-white">
              <p className="text-sm text-slate-300">Live recognition panel</p>
              <p className="mt-1 text-2xl font-semibold">Palma aberta</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {[
                ["FPS", "58.4", "var(--teal)"],
                ["Dedos", "5", "var(--blue)"],
                ["Confianca", "97%", "var(--amber)"],
                ["Latencia", "18 ms", "var(--red)"],
              ].map(([label, value, color]) => (
                <div key={label} className="metric-card">
                  <p className="text-sm text-[var(--muted)]">{label}</p>
                  <p className="mt-3 text-3xl font-bold" style={{ color }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-shell py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {featureItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="metric-card">
                <Icon aria-hidden="true" className="text-[var(--teal)]" />
                <h2 className="mt-4 text-lg font-semibold text-[var(--ink)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-shell grid gap-5 pb-12 lg:grid-cols-[1fr_0.7fr]">
        <PrivacyNotice />
        <DeveloperCredits compact />
      </section>
    </div>
  );
}
