/**
 * Explainable gesture rules over the 21 MediaPipe hand landmarks.
 *
 * Same rules as python/hand_gestures/gestures.py (ported from the original
 * desktop app); both implementations are checked against fixtures/gestures.
 * Landmarks must be in the SELFIE frame: see toSelfieFrame in ./frame.
 */

export type Landmark = { readonly x: number; readonly y: number; readonly z?: number };
export type Handedness = "Right" | "Left";
/** [thumb, index, middle, ring, pinky]: 1 = raised. */
export type FingerStates = readonly [number, number, number, number, number];

export type GestureId =
  | "fist"
  | "open_palm"
  | "peace"
  | "rock"
  | "thumb"
  | "index"
  | "l_shape"
  | "three"
  | "four"
  | "ok"
  | "pinch"
  | "unknown";

export type HandAnalysis = {
  readonly fingerStates: FingerStates;
  readonly total: number;
  readonly gesture: GestureId;
  readonly pinchDistance: number;
  readonly pinchStrength: number;
};

export const LANDMARK_COUNT = 21;
export const PINCH_DISTANCE_THRESHOLD = 0.35;

export const GESTURE_LABELS: Readonly<Record<GestureId, string>> = {
  fist: "Punho fechado",
  open_palm: "Mão aberta",
  peace: "Paz",
  rock: "Rock",
  thumb: "Polegar",
  index: "Indicador",
  l_shape: "L",
  three: "Três",
  four: "Quatro",
  ok: "OK",
  pinch: "Pinça",
  unknown: "Gesto não mapeado",
};

/** Finger patterns, in [thumb, index, middle, ring, pinky] order. */
export const GESTURE_BY_FINGERS: ReadonlyArray<readonly [string, GestureId]> = [
  ["00000", "fist"],
  ["11111", "open_palm"],
  ["01100", "peace"],
  ["01001", "rock"],
  ["10000", "thumb"],
  ["01000", "index"],
  ["11000", "l_shape"],
  ["01110", "three"],
  ["01111", "four"],
];

const gestureByPattern = new Map<string, GestureId>(GESTURE_BY_FINGERS);

// (tip, pip) for index, middle, ring and pinky.
const FINGER_TIP_PIP = [
  [8, 6],
  [12, 10],
  [16, 14],
  [20, 18],
] as const;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const INDEX_TIP = 8;
const WRIST = 0;
const MIDDLE_MCP = 9;

export function gestureLabel(gesture: GestureId): string {
  return GESTURE_LABELS[gesture];
}

function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isRightHand(handedness: string): boolean {
  return handedness.trim().toLowerCase().startsWith("r");
}

function point(landmarks: readonly Landmark[], index: number): Landmark {
  const value = landmarks[index];
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) {
    throw new RangeError("Landmark coordinates must be finite numbers.");
  }
  return value;
}

export function analyzeHand(landmarks: readonly Landmark[], handedness: string): HandAnalysis {
  if (landmarks.length < LANDMARK_COUNT) {
    throw new RangeError(`Expected ${LANDMARK_COUNT} hand landmarks, got ${landmarks.length}.`);
  }
  const p = (index: number) => point(landmarks, index);
  for (let index = 0; index < LANDMARK_COUNT; index += 1) p(index);

  const thumbTipX = p(THUMB_TIP).x;
  const thumbIpX = p(THUMB_IP).x;
  const thumb = (isRightHand(handedness) ? thumbTipX < thumbIpX : thumbTipX > thumbIpX) ? 1 : 0;
  const [index, middle, ring, pinky] = FINGER_TIP_PIP.map(([tip, pip]) =>
    p(tip).y < p(pip).y ? 1 : 0,
  ) as [number, number, number, number];
  const fingerStates: FingerStates = [thumb, index, middle, ring, pinky];

  const palm = Math.max(distance(p(WRIST), p(MIDDLE_MCP)), 1e-6);
  const pinchDistance = distance(p(THUMB_TIP), p(INDEX_TIP)) / palm;
  return {
    fingerStates,
    total: thumb + index + middle + ring + pinky,
    gesture: classifyGesture(fingerStates, pinchDistance),
    pinchDistance,
    pinchStrength: Math.max(0, 1 - pinchDistance / PINCH_DISTANCE_THRESHOLD),
  };
}

export function classifyGesture(fingers: FingerStates, pinchDistance: number): GestureId {
  if (pinchDistance <= PINCH_DISTANCE_THRESHOLD) {
    const [, , middle, ring, pinky] = fingers;
    if (middle && ring && pinky) return "ok";
    if (!middle && !ring && !pinky) return "pinch";
  }
  return gestureByPattern.get(fingers.map((value) => (value ? 1 : 0)).join("")) ?? "unknown";
}
