import { describe, expect, it } from "vitest";
import { HandReadingTracker, type RawHandResult } from "@/lib/gestures";
import { loadFixture, type PoseFixture } from "./fixtures";

const poses = loadFixture<PoseFixture>("hand-poses.json");

/** What MediaPipe returns for a fixture on the unmirrored frame. */
function raw(id: string) {
  const fixture = poses.cases.find((testCase) => testCase.id === id);
  if (!fixture) throw new Error(id);
  return {
    landmarks: fixture.landmarks.map(([x, y, z]) => ({ x: 1 - x, y, z })),
    label: fixture.handedness === "Right" ? "Left" : "Right",
  };
}

function result(...hands: { landmarks: { x: number; y: number; z: number }[]; label: string }[]): RawHandResult {
  return {
    landmarks: hands.map((hand) => hand.landmarks),
    handedness: hands.map((hand) => [{ categoryName: hand.label, score: 0.9 }]),
  };
}

describe("HandReadingTracker", () => {
  it("reads both hands with their model score", () => {
    const tracker = new HandReadingTracker();
    const [right, left] = tracker.read(result(raw("peace-right"), raw("open-palm-left")));

    expect(right).toMatchObject({ key: "Right", handedness: "Right", gesture: "peace", total: 2, score: 0.9 });
    expect(left).toMatchObject({ key: "Left", handedness: "Left", gesture: "open_palm", total: 5 });
  });

  it("keeps two hands with the same label apart", () => {
    const tracker = new HandReadingTracker();
    const readings = tracker.read(result(raw("peace-right"), raw("fist-right")));

    expect(readings.map((reading) => reading.key)).toEqual(["Right", "Right-2"]);
    expect(readings.map((reading) => reading.gesture)).toEqual(["peace", "fist"]);
  });

  it("drops a hand's history when it leaves the frame", () => {
    const tracker = new HandReadingTracker();
    for (let frame = 0; frame < 5; frame += 1) tracker.read(result(raw("peace-right")));
    expect(tracker.read(result())).toEqual([]);

    // Without the old votes, the first frame of the new pose wins immediately.
    expect(tracker.read(result(raw("fist-right")))[0]?.gesture).toBe("fist");
  });
});
