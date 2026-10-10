import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Shared with python/tests: fixtures/gestures at the repository root.
const FIXTURES_DIR = fileURLToPath(new URL("../../../fixtures/gestures/", import.meta.url));

export type PoseCase = {
  id: string;
  handedness: "Right" | "Left";
  landmarks: [number, number, number][];
  expected: {
    finger_states: number[];
    total: number;
    gesture: string;
    label: string;
    pinch_distance: number;
  };
};

export type PoseFixture = { pinch_threshold: number; cases: PoseCase[] };

export type SmoothingFixture = {
  window: number;
  finger_states: { input: number[][]; expected: number[][] };
  labels: { input: string[]; expected: string[] };
};

export function loadFixture<T>(name: string): T {
  return JSON.parse(readFileSync(`${FIXTURES_DIR}${name}`, "utf8")) as T;
}
