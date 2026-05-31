import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DeveloperCredits } from "@/components/credits/DeveloperCredits";

export const metadata = {
  title: "Dashboard",
  description: "Metricas e visualizacao do reconhecimento de gestos de mao.",
};

export default function DashboardPage() {
  return (
    <div className="content-shell py-10">
      <div className="mb-7 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
          Dashboard inteligente
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)] sm:text-4xl">
          Metricas para acompanhar uma sessao de reconhecimento.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          A interface organiza desempenho, distribuicao de gestos e qualidade de
          deteccao para facilitar debugging, demonstracao e evolucao do produto.
        </p>
      </div>
      <DashboardClient />
      <div className="mt-6">
        <DeveloperCredits compact />
      </div>
    </div>
  );
}
