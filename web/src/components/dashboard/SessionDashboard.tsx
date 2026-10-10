"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Camera, CircleCheck, Gauge, Hand, Table, Timer, Trash2 } from "lucide-react";
import { gestureLabel, type GestureId } from "@/lib/gestures";
import { formatDecimal, formatDuration, formatInteger, formatPercentPrecise } from "@/lib/format";
import { EMPTY_SESSION, sessionStore, TIMELINE_SECONDS, type SessionSnapshot } from "@/lib/session";

const getServerSnapshot = () => EMPTY_SESSION;

export function SessionDashboard() {
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, getServerSnapshot);

  if (session.runs === 0) {
    return (
      <section className="ms-card grid justify-items-start gap-3" aria-labelledby="empty-title">
        <Camera size={24} strokeWidth={1.75} className="text-fg-tertiary" aria-hidden="true" />
        <h2 id="empty-title" className="text-h3">
          Nenhuma sessão registrada nesta aba
        </h2>
        <p className="text-caption text-fg-secondary">
          Ative a câmera na demo. As métricas aparecem aqui enquanto você testa os gestos e ficam só na
          memória desta aba: recarregar a página apaga tudo.
        </p>
        <Link href="/demo" className="ms-btn ms-btn--primary">
          Abrir a demo
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-small text-fg-secondary" role="status">
          {session.running ? (
            <span className="ms-badge ms-badge--positive">
              <CircleCheck size={14} strokeWidth={1.75} aria-hidden="true" />
              Câmera ativa
            </span>
          ) : (
            <span className="ms-badge">Sessão encerrada</span>
          )}
          {session.runs} {session.runs === 1 ? "execução" : "execuções"} ·{" "}
          {session.delegate === "GPU" ? "GPU (WebGL)" : "CPU"}
        </p>
        {!session.running && (
          <button type="button" className="ms-btn ms-btn--ghost" onClick={() => sessionStore.reset()}>
            <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
            Limpar sessão
          </button>
        )}
      </div>

      <section aria-label="Indicadores da sessão" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<Timer size={20} strokeWidth={1.75} />} label="Tempo com a câmera ativa">
          {formatDuration(session.activeMs)}
        </Kpi>
        <Kpi icon={<Table size={20} strokeWidth={1.75} />} label="Quadros processados">
          {formatInteger(session.framesProcessed)}
        </Kpi>
        <Kpi icon={<Gauge size={20} strokeWidth={1.75} />} label="Quadros por segundo (média)">
          {session.averageFps === null ? "—" : formatDecimal(session.averageFps)}
        </Kpi>
        <Kpi icon={<Hand size={20} strokeWidth={1.75} />} label="Inferência média (ms)">
          {session.averageInferenceMs === null ? "—" : formatDecimal(session.averageInferenceMs)}
        </Kpi>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <GestureDistribution session={session} />
        <FpsTimeline session={session} />
      </div>

      <p className="text-fine text-fg-tertiary">
        Valores medidos neste navegador, quadro a quadro. Nada é enviado nem salvo.
      </p>
    </div>
  );
}

function Kpi({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <article className="ms-card grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption font-semibold text-fg-secondary">{label}</p>
        <span className="text-fg-tertiary" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="ms-num text-kpi text-fg">{children}</p>
    </article>
  );
}

function GestureDistribution({ session }: { session: SessionSnapshot }) {
  const rows = (Object.entries(session.gestureFrames) as [GestureId, number][])
    .filter(([, frames]) => frames > 0)
    .sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] ?? 0;
  const handShare = session.framesProcessed ? session.framesWithHand / session.framesProcessed : 0;
  const top = rows[0];

  return (
    <figure className="ms-card m-0 grid content-start gap-4" aria-labelledby="distribution-title">
      <div className="grid gap-1">
        <h2 id="distribution-title" className="text-h3">
          {top ? `${gestureLabel(top[0])} foi o gesto mais frequente` : "Nenhuma mão apareceu ainda"}
        </h2>
        <figcaption className="text-caption text-fg-secondary">
          Quadros por gesto (primeira mão, após a suavização). Mão visível em{" "}
          {formatPercentPrecise(handShare)} dos quadros.
        </figcaption>
      </div>

      {rows.length === 0 ? (
        <p className="text-caption text-fg-secondary">Mostre a mão para a câmera na demo.</p>
      ) : (
        <>
          <ul
            className="grid gap-3"
            role="img"
            aria-label={rows.map(([id, frames]) => `${gestureLabel(id)}: ${frames} quadros`).join("; ")}
          >
            {rows.map(([id, frames]) => (
              <li key={id} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-3">
                <span className="text-caption text-fg">{gestureLabel(id)}</span>
                <span className="ms-bar-track">
                  <span className="ms-bar-fill block" style={{ width: `${(frames / max) * 100}%` }} />
                </span>
                <span className="ms-num text-right text-caption text-fg-secondary">{formatInteger(frames)}</span>
              </li>
            ))}
          </ul>
          <details className="ms-disclosure">
            <summary>Ver dados em tabela</summary>
            <div className="ms-table-scroll mt-3" role="region" aria-labelledby="distribution-table-caption" tabIndex={0}>
              <table className="ms-table">
                <caption id="distribution-table-caption">Quadros por gesto nesta sessão</caption>
                <thead>
                  <tr>
                    <th scope="col">Gesto</th>
                    <th scope="col" className="ms-num">
                      Quadros
                    </th>
                    <th scope="col" className="ms-num">
                      Participação (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([id, frames]) => (
                    <tr key={id}>
                      <th scope="row">{gestureLabel(id)}</th>
                      <td className="ms-num">{formatInteger(frames)}</td>
                      <td className="ms-num">{formatPercentPrecise(frames / Math.max(session.framesWithHand, 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </figure>
  );
}

function FpsTimeline({ session }: { session: SessionSnapshot }) {
  const points = session.fpsTimeline;
  const maxFps = Math.max(30, ...points.map((point) => point.fps));
  const yMax = Math.ceil(maxFps / 10) * 10;
  const average = points.length ? points.reduce((sum, point) => sum + point.fps, 0) / points.length : 0;
  const first = points[0]?.second ?? 0;
  const span = Math.max((points.at(-1)?.second ?? 0) - first, 1);
  const path = points
    .map((point) => `${((point.second - first) / span) * 100},${100 - (point.fps / yMax) * 100}`)
    .join(" ");

  return (
    <figure className="ms-card m-0 grid content-start gap-4" aria-labelledby="fps-title">
      <div className="grid gap-1">
        <h2 id="fps-title" className="text-h3">
          {points.length ? `${formatDecimal(average)} quadros/s em média` : "Ainda sem quadros processados"}
        </h2>
        <figcaption className="text-caption text-fg-secondary">
          Quadros processados em cada segundo de câmera ativa (últimos {TIMELINE_SECONDS} s).
        </figcaption>
      </div>

      {points.length > 1 && (
        <>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
            <div className="ms-num flex flex-col justify-between text-right text-micro text-fg-tertiary" aria-hidden="true">
              <span>{yMax}</span>
              <span>{yMax / 2}</span>
              <span>0</span>
            </div>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-40 w-full"
              role="img"
              aria-label={`Quadros por segundo ao longo de ${points.length} segundos; média de ${formatDecimal(average)}.`}
            >
              {[0, 50, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                  stroke="var(--ms-chart-grid)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <polyline
                points={path}
                fill="none"
                stroke="var(--ms-chart-1)"
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span />
            <div className="ms-num flex justify-between text-micro text-fg-tertiary" aria-hidden="true">
              <span>{first} s</span>
              <span>{first + span} s</span>
            </div>
          </div>
          <details className="ms-disclosure">
            <summary>Ver dados em tabela</summary>
            <div className="ms-table-scroll mt-3 max-h-64" role="region" aria-labelledby="fps-table-caption" tabIndex={0}>
              <table className="ms-table">
                <caption id="fps-table-caption">Quadros processados por segundo</caption>
                <thead>
                  <tr>
                    <th scope="col" className="ms-num">
                      Segundo
                    </th>
                    <th scope="col" className="ms-num">
                      Quadros
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={point.second}>
                      <th scope="row" className="ms-num">
                        {point.second}
                      </th>
                      <td className="ms-num">{point.fps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </figure>
  );
}
