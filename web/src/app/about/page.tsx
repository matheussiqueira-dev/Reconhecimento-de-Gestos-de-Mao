import { Code2, Eye, Hand, ShieldCheck } from "lucide-react";
import { DeveloperCredits } from "@/components/credits/DeveloperCredits";
import { PrivacyNotice } from "@/components/PrivacyNotice";

export const metadata = {
  title: "About",
  description: "Arquitetura, privacidade e creditos do dashboard de gestos.",
};

const sections = [
  {
    title: "Python modular",
    icon: Code2,
    text: "A versao local separa camera, detector, contador, classificador, metricas e overlay para facilitar manutencao e testes.",
  },
  {
    title: "MediaPipe",
    icon: Eye,
    text: "Os landmarks da mao alimentam uma heuristica simples e explicavel para contar dedos levantados.",
  },
  {
    title: "Next.js",
    icon: Hand,
    text: "A versao web usa App Router, componentes client-side para webcam e build preparado para Vercel.",
  },
  {
    title: "Privacidade",
    icon: ShieldCheck,
    text: "O processamento da webcam ocorre localmente e nao ha armazenamento de imagem, video ou biometria.",
  },
];

export default function AboutPage() {
  return (
    <div className="content-shell py-10">
      <div className="mb-7 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Sobre o projeto
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)] sm:text-4xl">
          Uma demonstracao tecnica de visao computacional e produto web.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          O projeto foi estruturado para portfolio, aprendizado e evolucao
          incremental sem depender de envio de frames para servidores.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <article key={section.title} className="metric-card">
              <Icon aria-hidden="true" className="text-[var(--teal)]" />
              <h2 className="mt-4 text-lg font-semibold text-[var(--ink)]">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {section.text}
              </p>
            </article>
          );
        })}
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.7fr]">
        <PrivacyNotice />
        <DeveloperCredits compact />
      </div>
    </div>
  );
}
