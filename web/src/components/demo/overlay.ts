import type { Landmark } from "@/lib/gestures";

/** Same topology as MediaPipe's HAND_CONNECTIONS (and python/hand_gestures/overlay.py). */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export type OverlayColors = { mark: string; active: string; halo: string };

/** Canvas cannot use var(); read the token values once per session. */
export function readOverlayColors(): OverlayColors {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return { mark: token("--ms-text"), active: token("--ms-accent"), halo: token("--ms-media-halo") };
}

export type OverlayHand = { landmarks: readonly Landmark[]; highlight: boolean };

/**
 * Landmarks arrive in the selfie (mirrored) frame. When the video is shown
 * mirrored they map straight onto it; otherwise they are flipped back.
 */
export function drawOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  hands: readonly OverlayHand[],
  options: { mirrored: boolean; visible: boolean; colors: OverlayColors },
): void {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, width, height);
  if (!options.visible) return;

  // Keep strokes at 2 CSS px (halo 4 px) whatever the display size of the stream.
  const scale = width / Math.max(canvas.getBoundingClientRect().width, 1);
  const lineWidth = 2 * scale;
  const haloWidth = 4 * scale;
  const radius = 2 * scale;
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const hand of hands) {
    const points = hand.landmarks.map(({ x, y }) => ({
      x: (options.mirrored ? x : 1 - x) * width,
      y: y * height,
    }));
    const stroke = (color: string, widthPx: number) => {
      context.strokeStyle = color;
      context.lineWidth = widthPx;
      context.beginPath();
      for (const [start, end] of HAND_CONNECTIONS) {
        const a = points[start];
        const b = points[end];
        if (!a || !b) continue;
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
      }
      context.stroke();
    };
    const dots = (color: string, r: number) => {
      context.fillStyle = color;
      context.beginPath();
      for (const p of points) {
        context.moveTo(p.x + r, p.y);
        context.arc(p.x, p.y, r, 0, Math.PI * 2);
      }
      context.fill();
    };

    const color = hand.highlight ? options.colors.active : options.colors.mark;
    stroke(options.colors.halo, lineWidth + haloWidth);
    dots(options.colors.halo, radius + haloWidth / 2);
    stroke(color, lineWidth);
    dots(color, radius);
  }
}

export function clearOverlay(canvas: HTMLCanvasElement | null): void {
  const context = canvas?.getContext("2d");
  if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
}
