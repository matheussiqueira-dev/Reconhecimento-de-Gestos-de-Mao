import { describe, expect, it } from "vitest";
import {
  analyzeHand,
  classifyGesture,
  FingerStateSmoother,
  GESTURE_LABELS,
  gestureLabel,
  LabelSmoother,
  PINCH_DISTANCE_THRESHOLD,
  toSelfieFrame,
  type FingerStates,
  type GestureId,
  type Landmark,
} from "@/lib/gestures";
import { loadFixture, type PoseFixture, type SmoothingFixture } from "./fixtures";

const poses = loadFixture<PoseFixture>("hand-poses.json");
const smoothing = loadFixture<SmoothingFixture>("smoothing.json");

const toPoints = (landmarks: [number, number, number][]) =>
  landmarks.map(([x, y, z]) => ({ x, y, z }));

describe("golden poses (shared with pytest)", () => {
  it.each(poses.cases.map((testCase) => [testCase.id, testCase] as const))("%s", (_id, testCase) => {
    const analysis = analyzeHand(toPoints(testCase.landmarks), testCase.handedness);
    const { expected } = testCase;

    expect([...analysis.fingerStates]).toEqual(expected.finger_states);
    expect(analysis.total).toBe(expected.total);
    expect(analysis.gesture).toBe(expected.gesture);
    expect(gestureLabel(analysis.gesture)).toBe(expected.label);
    expect(analysis.pinchDistance).toBeCloseTo(expected.pinch_distance, 4);
  });

  it("uses the same pinch threshold as the fixtures", () => {
    expect(PINCH_DISTANCE_THRESHOLD).toBe(poses.pinch_threshold);
  });
});

describe("input validation", () => {
  it("rejects an empty landmark list", () => {
    expect(() => analyzeHand([], "Right")).toThrow(/21 hand landmarks, got 0/);
  });

  it("rejects a missing (null) landmark inside the list", () => {
    const landmarks: (Landmark | null)[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
    landmarks[3] = null;
    expect(() => analyzeHand(landmarks as Landmark[], "Right")).toThrow(/finite/);
  });

  it("rejects hands with fewer than 21 landmarks", () => {
    expect(() => analyzeHand(Array.from({ length: 20 }, () => ({ x: 0.5, y: 0.5 })), "Right")).toThrow(
      RangeError,
    );
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])("rejects non-finite coordinates (%s)", (bad) => {
    const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
    landmarks[8] = { x: bad, y: 0.2 };
    expect(() => analyzeHand(landmarks, "Right")).toThrow(/finite/);
  });
});

describe("classification rules", () => {
  it("treats the pinch threshold as inclusive", () => {
    const fingers: FingerStates = [0, 0, 1, 1, 1];
    expect(classifyGesture(fingers, PINCH_DISTANCE_THRESHOLD)).toBe("ok");
    expect(classifyGesture(fingers, PINCH_DISTANCE_THRESHOLD + 1e-9)).toBe("unknown");
  });

  it("falls back to the finger map when a pinch has mixed fingers", () => {
    expect(classifyGesture([0, 1, 1, 0, 0], 0.1)).toBe("peace");
  });

  it("has a PT-BR label for every gesture", () => {
    const ids: GestureId[] = [
      "fist", "open_palm", "peace", "rock", "thumb", "index",
      "l_shape", "three", "four", "ok", "pinch", "unknown",
    ];
    expect(Object.keys(GESTURE_LABELS).sort()).toEqual([...ids].sort());
  });
});

describe("smoothing (shared with pytest)", () => {
  it("matches the finger-state fixture", () => {
    const smoother = new FingerStateSmoother(smoothing.window);
    const outputs = smoothing.finger_states.input.map((state) => smoother.update(state));
    expect(outputs).toEqual(smoothing.finger_states.expected);
  });

  it("matches the label fixture, oldest label winning ties", () => {
    const smoother = new LabelSmoother(smoothing.window);
    const outputs = smoothing.labels.input.map((label) => smoother.update(label));
    expect(outputs).toEqual(smoothing.labels.expected);
  });

  it("clamps the window to at least one frame", () => {
    const labels = new LabelSmoother(0);
    labels.update("fist");
    expect(labels.update("peace")).toBe("peace");
  });

  it("passes empty input through unchanged", () => {
    expect(new FingerStateSmoother().update([])).toEqual([]);
    expect(new LabelSmoother().update("")).toBe("");
  });
});

describe("toSelfieFrame", () => {
  it("turns a raw-frame MediaPipe result into the selfie frame the rules expect", () => {
    const fixture = poses.cases.find((testCase) => testCase.id === "thumb-right");
    if (!fixture) throw new Error("fixture missing");
    // What MediaPipe returns for the unmirrored frame: x mirrored and the label swapped.
    const raw = toPoints(fixture.landmarks).map((p) => ({ ...p, x: 1 - p.x }));

    const selfie = toSelfieFrame(raw, "Left");
    const analysis = analyzeHand(selfie.landmarks, selfie.handedness);

    expect(selfie.handedness).toBe("Right");
    expect(analysis.gesture).toBe("thumb");
    selfie.landmarks.forEach((p, index) => {
      expect(p.x).toBeCloseTo(fixture.landmarks[index]![0], 9);
    });
  });
});
