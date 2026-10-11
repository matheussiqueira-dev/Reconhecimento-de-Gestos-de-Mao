import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

type PoseCase = {
  id: string;
  handedness: "Right" | "Left";
  landmarks: [number, number, number][];
  expected: { total: number; gesture: string; label: string };
};

export const POSES: PoseCase[] = (
  JSON.parse(
    // Playwright loads specs as CommonJS here, so __dirname (not import.meta) is available.
    readFileSync(join(__dirname, "../../../fixtures/gestures/hand-poses.json"), "utf8"),
  ) as { cases: PoseCase[] }
).cases;

export function pose(id: string): PoseCase {
  const found = POSES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Unknown fixture ${id}`);
  return found;
}

/**
 * Replaces the camera with an animated canvas stream and MediaPipe with a stub that
 * returns the golden fixture currently selected by the test. The stub answers in the
 * raw (unmirrored) frame, exactly as MediaPipe would, so the app's selfie conversion
 * is exercised too.
 */
export async function installStubs(page: Page, options: { deny?: boolean; realModel?: boolean } = {}) {
  await page.addInitScript(
    ({ deny, realModel }) => {
      type Fixture = { handedness: string; landmarks: [number, number, number][] };
      const state = {
        current: null as Fixture | null,
        created: 0,
        closed: 0,
        liveTracks: 0,
        deny,
      };
      Object.assign(window, { __E2E_STATE__: state });

      navigator.mediaDevices.getUserMedia = async () => {
        if (state.deny) throw new DOMException("Permission denied", "NotAllowedError");
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 360;
        const context = canvas.getContext("2d");
        let frame = 0;
        const paint = () => {
          if (context) {
            context.fillStyle = frame % 2 ? "rgb(20, 22, 28)" : "rgb(30, 32, 38)";
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
          frame += 1;
          requestAnimationFrame(paint);
        };
        paint();
        const stream = canvas.captureStream(30);
        for (const track of stream.getTracks()) {
          state.liveTracks += 1;
          const stop = track.stop.bind(track);
          track.stop = () => {
            if (track.readyState === "live") state.liveTracks -= 1;
            stop();
          };
        }
        return stream;
      };

      if (realModel) return;
      Object.assign(window, {
        __GESTOS_E2E__: {
          createTracker: async () => {
            state.created += 1;
            return {
              delegate: "CPU",
              detectForVideo: () => {
                const fixture = state.current;
                if (!fixture) return { landmarks: [], handedness: [] };
                return {
                  landmarks: [fixture.landmarks.map(([x, y, z]) => ({ x: 1 - x, y, z }))],
                  handedness: [
                    [{ categoryName: fixture.handedness === "Right" ? "Left" : "Right", score: 0.97 }],
                  ],
                };
              },
              close: () => {
                state.closed += 1;
              },
            };
          },
        },
      });
    },
    { deny: options.deny ?? false, realModel: options.realModel ?? false },
  );
}

export async function showPose(page: Page, fixture: PoseCase | null) {
  await page.evaluate((value) => {
    (window as unknown as { __E2E_STATE__: { current: unknown } }).__E2E_STATE__.current = value;
  }, fixture && { handedness: fixture.handedness, landmarks: fixture.landmarks });
}

export async function stubState(page: Page) {
  return page.evaluate(
    () =>
      (window as unknown as { __E2E_STATE__: { created: number; closed: number; liveTracks: number } })
        .__E2E_STATE__,
  );
}
