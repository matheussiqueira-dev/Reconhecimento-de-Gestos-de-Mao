import type { Handedness, Landmark } from "./analyze";

/**
 * The browser feeds MediaPipe the raw (unmirrored) camera frame, but MediaPipe
 * labels handedness as if the frame were mirrored, so its label is the opposite
 * of the visitor's real hand. The desktop app flips the frame before inference
 * instead. Mirroring the x coordinates and swapping the label converts a web
 * result into that same selfie frame, so both apps share one set of rules.
 */
export function toSelfieFrame(
  landmarks: readonly Landmark[],
  rawHandedness: string,
): { landmarks: Landmark[]; handedness: Handedness } {
  const isRight = rawHandedness.trim().toLowerCase().startsWith("r");
  return {
    landmarks: landmarks.map(({ x, y, z }) => ({ x: 1 - x, y, z })),
    handedness: isRight ? "Left" : "Right",
  };
}
