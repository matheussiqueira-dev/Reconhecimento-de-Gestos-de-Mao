"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Activity, Gauge, Hand, Timer } from "lucide-react";

function ChartLoading() {
  return (
    <div className="grid h-full place-items-center text-sm text-[var(--muted)]">
      Carregando grafico
    </div>
  );
}

const DistributionChart = dynamic(
  () => import("./GestureCharts").then((module) => module.DistributionChart),
  {
    ssr: false,
    loading: ChartLoading,
  },
);

const PerformanceChart = dynamic(
  () => import("./GestureCharts").then((module) => module.PerformanceChart),
  {
    ssr: false,
    loading: ChartLoading,
  },
);

export function DashboardClient() {
  const cards = useMemo(
    () => [
      {
        label: "FPS medio",
        value: "58.6",
        helper: "Janela de 60s",
        color: "var(--teal)",
        icon: Gauge,
      },
      {
        label: "Gesto dominante",
        value: "Palma",
        helper: "42 eventos",
        color: "var(--blue)",
        icon: Hand,
      },
      {
        label: "Confianca",
        value: "96%",
        helper: "Media ponderada",
        color: "var(--amber)",
        icon: Activity,
      },
      {
        label: "Tempo ativo",
        value: "12m",
        helper: "Sessao local",
        color: "var(--red)",
        icon: Timer,
      },
    ],
    [],
  );

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="metric-card">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--muted)]">{card.label}</p>
                <Icon aria-hidden="true" style={{ color: card.color }} size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold" style={{ color: card.color }}>
                {card.value}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">{card.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            Distribuicao de gestos
          </h2>
          <div className="mt-4 h-72">
            <DistributionChart />
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">
            Desempenho da sessao
          </h2>
          <div className="mt-4 h-72">
            <PerformanceChart />
          </div>
        </div>
      </section>
    </div>
  );
}
