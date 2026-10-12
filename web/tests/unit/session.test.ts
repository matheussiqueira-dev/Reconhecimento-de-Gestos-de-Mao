import { describe, expect, it } from "vitest";
import { EMPTY_SESSION, SessionStore } from "@/lib/session";

describe("SessionStore", () => {
  it("starts empty and ignores frames while stopped", () => {
    const store = new SessionStore();
    store.recordFrame({ now: 10, inferenceMs: 5, gesture: "fist" });
    expect(store.getSnapshot()).toBe(EMPTY_SESSION);
  });

  it("measures frames, hand share, inference and the per-second timeline", () => {
    const store = new SessionStore();
    store.start("GPU", 0);
    // 3 frames in second 0, 2 frames in second 1 (one without a hand).
    store.recordFrame({ now: 100, inferenceMs: 10, gesture: "peace" });
    store.recordFrame({ now: 400, inferenceMs: 20, gesture: "peace" });
    store.recordFrame({ now: 700, inferenceMs: 30, gesture: "fist" });
    store.recordFrame({ now: 1100, inferenceMs: 40, gesture: null });
    store.recordFrame({ now: 2000, inferenceMs: 50, gesture: "peace" });
    store.stop(2000);

    const snapshot = store.getSnapshot();
    expect(snapshot.running).toBe(false);
    expect(snapshot.framesProcessed).toBe(5);
    expect(snapshot.framesWithHand).toBe(4);
    expect(snapshot.averageInferenceMs).toBe(30);
    expect(snapshot.activeMs).toBe(2000);
    expect(snapshot.averageFps).toBe(2.5);
    expect(snapshot.gestureFrames).toEqual({ peace: 3, fist: 1 });
    expect(snapshot.fpsTimeline).toEqual([
      { second: 0, fps: 3 },
      { second: 1, fps: 1 },
      { second: 2, fps: 1 },
    ]);
  });

  it("publishes copies, so later frames do not mutate an old snapshot", () => {
    const store = new SessionStore();
    store.start("CPU", 0);
    store.recordFrame({ now: 300, inferenceMs: 1, gesture: "ok" });
    const before = store.getSnapshot();
    store.recordFrame({ now: 900, inferenceMs: 1, gesture: "ok" });

    expect(before.gestureFrames).toEqual({ ok: 1 });
    expect(store.getSnapshot().gestureFrames).toEqual({ ok: 2 });
  });

  it("records a GPU to CPU fallback and accumulates time across runs", () => {
    const store = new SessionStore();
    store.start("GPU", 0);
    store.setDelegate("CPU", 500);
    expect(store.getSnapshot().delegate).toBe("CPU");
    store.stop(1000);
    store.start("CPU", 5000);
    store.stop(6500);

    expect(store.getSnapshot()).toMatchObject({ runs: 2, activeMs: 2500 });
  });

  it("notifies subscribers and resets only when stopped", () => {
    const store = new SessionStore();
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.start("CPU", 0);
    store.reset();
    expect(store.getSnapshot().running).toBe(true);
    store.stop(100);
    store.reset();
    unsubscribe();

    expect(store.getSnapshot()).toEqual(EMPTY_SESSION);
    expect(calls).toBe(3);
  });
});
