import { hasWebGL2 } from "@/lib/camera";
import { LANDMARKER_OPTIONS, MODEL_URL, WASM_BASE_PATH } from "./config";

export type Delegate = "GPU" | "CPU";

export type TrackerResult = {
  landmarks: ReadonlyArray<ReadonlyArray<{ x: number; y: number; z?: number }>>;
  handedness: ReadonlyArray<ReadonlyArray<{ categoryName: string; score: number }>>;
};

/** The slice of MediaPipe's HandLandmarker the demo uses. */
export interface HandTracker {
  readonly delegate: Delegate;
  detectForVideo(video: HTMLVideoElement, timestampMs: number): TrackerResult;
  close(): void;
}

export type LoadStage = "model" | "runtime";

export class TrackerLoadError extends Error {
  constructor(
    readonly kind: "model-download" | "model-init",
    options?: { cause?: unknown },
  ) {
    super(kind === "model-download" ? "Model download failed" : "Model initialisation failed", options);
    this.name = "TrackerLoadError";
  }
}

declare global {
  interface Window {
    /** Present only in end-to-end test builds (NEXT_PUBLIC_E2E_STUBS=1). */
    __GESTOS_E2E__?: { createTracker: () => Promise<HandTracker> };
  }
}

// Kept for the whole visit: stopping and starting again does not re-download 7.8 MB.
let cachedModel: Uint8Array | null = null;

async function downloadModel(
  signal: AbortSignal,
  onProgress: (ratio: number | null) => void,
): Promise<Uint8Array> {
  if (cachedModel) {
    onProgress(1);
    return cachedModel;
  }
  let response: Response;
  try {
    response = await fetch(MODEL_URL, { signal, credentials: "omit", referrerPolicy: "no-referrer" });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new TrackerLoadError("model-download", { cause: error });
  }
  if (!response.ok || !response.body) {
    throw new TrackerLoadError("model-download", { cause: new Error(`HTTP ${response.status}`) });
  }

  const total = Number(response.headers.get("content-length")) || 0;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  onProgress(total ? 0 : null);
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      onProgress(total ? Math.min(received / total, 1) : null);
    }
  } catch (error) {
    if (signal.aborted) throw error;
    throw new TrackerLoadError("model-download", { cause: error });
  }

  const model = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    model.set(chunk, offset);
    offset += chunk.byteLength;
  }
  cachedModel = model;
  return model;
}

export async function createHandTracker(options: {
  signal: AbortSignal;
  onStage: (stage: LoadStage) => void;
  onProgress: (ratio: number | null) => void;
  /** Force the CPU delegate, e.g. after the GPU path failed during inference. */
  delegate?: Delegate;
}): Promise<HandTracker> {
  if (process.env.NEXT_PUBLIC_E2E_STUBS === "1" && window.__GESTOS_E2E__) {
    options.onStage("runtime");
    return window.__GESTOS_E2E__.createTracker();
  }

  options.onStage("model");
  const model = await downloadModel(options.signal, options.onProgress);

  options.onStage("runtime");
  try {
    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
    const create = async (delegate: Delegate): Promise<HandTracker> => {
      const landmarker = await HandLandmarker.createFromOptions(fileset, {
        // MediaPipe copies the buffer into its heap; pass a copy so the cache stays intact.
        baseOptions: { modelAssetBuffer: model.slice(), delegate },
        runningMode: "VIDEO",
        ...LANDMARKER_OPTIONS,
      });
      return {
        delegate,
        detectForVideo: (video, timestampMs) => landmarker.detectForVideo(video, timestampMs),
        close: () => landmarker.close(),
      };
    };
    if (options.delegate !== "CPU" && hasWebGL2()) {
      try {
        return await create("GPU");
      } catch {
        // Some GPUs/drivers reject the WebGL delegate; the CPU path is slower but works.
      }
    }
    return await create("CPU");
  } catch (error) {
    throw new TrackerLoadError("model-init", { cause: error });
  }
}
