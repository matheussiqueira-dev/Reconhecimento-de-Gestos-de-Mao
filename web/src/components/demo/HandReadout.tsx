import { gestureLabel, PINCH_DISTANCE_THRESHOLD, type HandReading } from "@/lib/gestures";
import { formatPercent, formatRatio } from "@/lib/format";

const FINGERS = [
  { short: "P", name: "Polegar" },
  { short: "I", name: "Indicador" },
  { short: "M", name: "Médio" },
  { short: "A", name: "Anelar" },
  { short: "Mín", name: "Mínimo" },
] as const;

export function HandReadout({ reading }: { reading: HandReading }) {
  const side = reading.handedness === "Right" ? "direita" : "esquerda";
  const titleId = `hand-${reading.handedness}`;
  return (
    <section aria-labelledby={titleId} className="grid gap-3">
      <h3 id={titleId} className="text-h4 text-fg">
        Mão {side}
      </h3>
      <p className="text-kpi text-fg" data-testid={`gesture-${reading.handedness}`}>
        {gestureLabel(reading.gesture)}
      </p>
      <p className="text-small text-fg-secondary">
        Dedos levantados:{" "}
        <strong className="ms-num font-semibold text-fg" data-testid={`fingers-${reading.handedness}`}>
          {reading.total}
        </strong>{" "}
        de 5
      </p>
      <ul className="grid grid-cols-5 gap-2" aria-label="Estado de cada dedo">
        {FINGERS.map((finger, index) => {
          const raised = reading.fingerStates[index] === 1;
          return (
            <li key={finger.name} className="ms-finger" data-raised={raised}>
              <span aria-hidden="true">{finger.short}</span>
              <span className="ms-sr-only">
                {finger.name}: {raised ? "levantado" : "abaixado"}
              </span>
            </li>
          );
        })}
      </ul>
      <dl className="grid gap-1 text-caption">
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-fg-secondary">Confiança do modelo na lateralidade</dt>
          <dd className="ms-num text-fg">{formatPercent(reading.score)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-fg-secondary">Pinça (polegar–indicador ÷ palma)</dt>
          <dd className="ms-num text-fg">
            {formatRatio(reading.pinchDistance)}{" "}
            <span className="text-fg-tertiary">(limiar {formatRatio(PINCH_DISTANCE_THRESHOLD)})</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
