import { GESTURE_BY_FINGERS, GESTURE_LABELS, PINCH_DISTANCE_THRESHOLD } from "@/lib/gestures";
import { formatRatio } from "@/lib/format";

const FINGER_NAMES = ["Polegar", "Indicador", "Médio", "Anelar", "Mínimo"] as const;

function FingerPattern({ pattern }: { pattern: string }) {
  const raised = FINGER_NAMES.filter((_, index) => pattern[index] === "1");
  return (
    <span className="inline-grid grid-cols-5 gap-1" role="img" aria-label={raised.length ? `Levantados: ${raised.join(", ")}` : "Nenhum dedo levantado"}>
      {FINGER_NAMES.map((name, index) => (
        <span
          key={name}
          className="h-4 w-2.5 rounded-xs border border-line-control data-[up=true]:border-fg data-[up=true]:bg-fg"
          data-up={pattern[index] === "1"}
        />
      ))}
    </span>
  );
}

/** Every gesture the rules name, generated from the same table the classifier uses. */
export function GestureCatalog() {
  const threshold = formatRatio(PINCH_DISTANCE_THRESHOLD);
  return (
    <div className="ms-table-scroll" role="region" aria-labelledby="catalog-caption" tabIndex={0}>
      <table className="ms-table">
        <caption id="catalog-caption">
          Gestos reconhecidos e a regra de cada um. Dedos na ordem: polegar, indicador, médio, anelar e mínimo.
        </caption>
        <thead>
          <tr>
            <th scope="col">Gesto</th>
            <th scope="col">Dedos</th>
            <th scope="col">Regra</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{GESTURE_LABELS.ok}</th>
            <td>
              <FingerPattern pattern="00111" />
            </td>
            <td>Pinça (≤ {threshold}) com médio, anelar e mínimo levantados</td>
          </tr>
          <tr>
            <th scope="row">{GESTURE_LABELS.pinch}</th>
            <td>
              <FingerPattern pattern="00000" />
            </td>
            <td>Pinça (≤ {threshold}) com médio, anelar e mínimo abaixados</td>
          </tr>
          {GESTURE_BY_FINGERS.map(([pattern, id]) => (
            <tr key={id}>
              <th scope="row">{GESTURE_LABELS[id]}</th>
              <td>
                <FingerPattern pattern={pattern} />
              </td>
              <td>Exatamente esses dedos levantados</td>
            </tr>
          ))}
          <tr>
            <th scope="row">{GESTURE_LABELS.unknown}</th>
            <td>—</td>
            <td>Qualquer outra combinação</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
