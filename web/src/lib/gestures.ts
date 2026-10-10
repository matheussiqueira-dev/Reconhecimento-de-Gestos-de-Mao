export type FingerName = "thumb" | "index" | "middle" | "ring" | "pinky";

export type FingerState = Record<FingerName, boolean>;

export type LandmarkPoint = {
  x: number;
  y: number;
  z?: number;
};

export type GestureSummary = {
  label: string;
  confidence: number;
  fingers: number;
  state: FingerState;
};

export const REQUIRED_PRIVACY_NOTICE =
  "Esta aplicação é uma demonstração técnica de visão computacional. O processamento ocorre localmente no navegador e nenhuma imagem da webcam é enviada para servidores.";

const fingerNames: FingerName[] = ["thumb", "index", "middle", "ring", "pinky"];
const tipIds = [4, 8, 12, 16, 20] as const;
const pipIds = [3, 6, 10, 14, 18] as const;

export function countFingersFromLandmarks(
  landmarks: readonly LandmarkPoint[],
  handedness = "Right",
): FingerState {
  if (landmarks.length < 21) {
    return {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    };
  }

  const normalizedHandedness = handedness.toLowerCase();
  const thumbOpen =
    normalizedHandedness === "right"
      ? landmarks[tipIds[0]].x < landmarks[pipIds[0]].x
      : landmarks[tipIds[0]].x > landmarks[pipIds[0]].x;

  const values = [thumbOpen];
  for (let index = 1; index < tipIds.length; index += 1) {
    values.push(landmarks[tipIds[index]].y < landmarks[pipIds[index]].y);
  }

  return fingerNames.reduce(
    (state, finger, index) => ({
      ...state,
      [finger]: values[index],
    }),
    {} as FingerState,
  );
}

export function summarizeGesture(state: FingerState): GestureSummary {
  const raised = fingerNames.filter((finger) => state[finger]);
  const fingers = raised.length;
  const { thumb, index, middle, ring, pinky } = state;

  if (fingers === 0) {
    return { label: "Punho fechado", confidence: 0.96, fingers, state };
  }
  if (fingers === 5) {
    return { label: "Palma aberta", confidence: 0.97, fingers, state };
  }
  if (index && middle && !ring && !pinky) {
    return { label: "Paz", confidence: 0.94, fingers, state };
  }
  if (thumb && !index && !middle && !ring && !pinky) {
    return { label: "Joinha", confidence: 0.92, fingers, state };
  }
  if (!thumb && index && !middle && !ring && !pinky) {
    return { label: "Apontando", confidence: 0.91, fingers, state };
  }
  if (index && pinky && !middle && !ring) {
    return { label: "Rock", confidence: 0.9, fingers, state };
  }

  return {
    label: `${fingers} dedo(s)`,
    confidence: 0.82,
    fingers,
    state,
  };
}
