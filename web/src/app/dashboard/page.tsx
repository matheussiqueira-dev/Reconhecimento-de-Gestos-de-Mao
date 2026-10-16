import type { Metadata } from "next";
import { SessionDashboard } from "@/components/dashboard/SessionDashboard";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  path: "/dashboard",
  title: "Painel da sessão",
  description:
    "Métricas reais da sua sessão na demo: tempo de câmera, quadros processados, quadros por segundo, inferência e gestos.",
});

export default function DashboardPage() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <h1 className="text-h1">Painel da sessão</h1>
        <p className="text-lead text-fg-secondary">
          O que a demo mediu enquanto a sua câmera esteve ativa nesta aba: desempenho do modelo e quais gestos
          apareceram. Sem dados de exemplo.
        </p>
      </div>
      <SessionDashboard />
    </div>
  );
}
