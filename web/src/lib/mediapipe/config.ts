/** Must match the exact version pinned in package.json (checked by a unit test). */
export const MEDIAPIPE_VERSION = "0.10.35";

/** Self-hosted runtime, copied from node_modules by scripts/copy-mediapipe-wasm.mjs. */
export const WASM_BASE_PATH = `/mediapipe/${MEDIAPIPE_VERSION}/wasm`;

/**
 * Google's published Hand Landmarker model (float16, v1, Apache-2.0). It is fetched
 * from Google Cloud Storage only after the visitor turns the camera on; no frame
 * or landmark is ever sent anywhere.
 */
export const MODEL_ORIGIN = "https://storage.googleapis.com";
export const MODEL_URL = `${MODEL_ORIGIN}/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`;

/** Same thresholds as the desktop app (python/hand_gestures/app.py). */
export const LANDMARKER_OPTIONS = {
  numHands: 2,
  minHandDetectionConfidence: 0.7,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
} as const;

/** 16:9 like the camera container; browsers pick the closest mode the device has. */
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: "user",
    width: { ideal: 640 },
    height: { ideal: 360 },
  },
};
