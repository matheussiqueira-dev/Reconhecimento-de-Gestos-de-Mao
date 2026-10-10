import type { GestureId } from "@/lib/gestures";
import type { Delegate } from "@/lib/mediapipe/loader";

/**
 * Metrics of the visitor's own camera session, measured frame by frame and kept
 * only in this tab's memory. Nothing here is estimated, simulated or persisted.
 */
export type SessionSnapshot = {
  readonly running: boolean;
  readonly runs: number;
  readonly delegate: Delegate | null;
  readonly activeMs: number;
  readonly framesProcessed: number;
  readonly framesWithHand: number;
  readonly averageInferenceMs: number | null;
  readonly averageFps: number | null;
  readonly gestureFrames: Readonly<Partial<Record<GestureId, number>>>;
  /** Frames processed in each second of camera time (latest 120 seconds). */
  readonly fpsTimeline: ReadonlyArray<{ readonly second: number; readonly fps: number }>;
};

export const TIMELINE_SECONDS = 120;
const PUBLISH_INTERVAL_MS = 250;

export const EMPTY_SESSION: SessionSnapshot = {
  running: false,
  runs: 0,
  delegate: null,
  activeMs: 0,
  framesProcessed: 0,
  framesWithHand: 0,
  averageInferenceMs: null,
  averageFps: null,
  gestureFrames: {},
  fpsTimeline: [],
};

export class SessionStore {
  private listeners = new Set<() => void>();
  private snapshot: SessionSnapshot = EMPTY_SESSION;

  private running = false;
  private runs = 0;
  private delegate: Delegate | null = null;
  private activeBeforeRunMs = 0;
  private runStartedAt = 0;
  private lastFrameAt = 0;
  private framesProcessed = 0;
  private framesWithHand = 0;
  private inferenceTotalMs = 0;
  private gestureFrames: Partial<Record<GestureId, number>> = {};
  private timeline: { second: number; fps: number }[] = [];
  private lastPublishAt = Number.NEGATIVE_INFINITY;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  start(delegate: Delegate, now: number): void {
    if (this.running) return;
    this.running = true;
    this.runs += 1;
    this.delegate = delegate;
    this.runStartedAt = now;
    this.lastFrameAt = now;
    this.publish(now, true);
  }

  stop(now: number): void {
    if (!this.running) return;
    this.activeBeforeRunMs = this.activeMs(now);
    this.running = false;
    this.publish(now, true);
  }

  reset(): void {
    if (this.running) return;
    this.runs = 0;
    this.delegate = null;
    this.activeBeforeRunMs = 0;
    this.framesProcessed = 0;
    this.framesWithHand = 0;
    this.inferenceTotalMs = 0;
    this.gestureFrames = {};
    this.timeline = [];
    this.publish(0, true);
  }

  /** `gesture` is the first hand's smoothed gesture, or null when no hand is visible. */
  recordFrame(frame: { now: number; inferenceMs: number; gesture: GestureId | null }): void {
    if (!this.running) return;
    this.lastFrameAt = frame.now;
    this.framesProcessed += 1;
    this.inferenceTotalMs += Math.max(0, frame.inferenceMs);
    if (frame.gesture) {
      this.framesWithHand += 1;
      this.gestureFrames = {
        ...this.gestureFrames,
        [frame.gesture]: (this.gestureFrames[frame.gesture] ?? 0) + 1,
      };
    }

    const second = Math.floor(this.activeMs(frame.now) / 1000);
    const last = this.timeline.at(-1);
    if (last && last.second === second) {
      last.fps += 1;
    } else {
      this.timeline.push({ second, fps: 1 });
      if (this.timeline.length > TIMELINE_SECONDS) this.timeline.shift();
    }
    this.publish(frame.now, false);
  }

  private activeMs(now: number): number {
    return this.activeBeforeRunMs + (this.running ? Math.max(0, now - this.runStartedAt) : 0);
  }

  private publish(now: number, force: boolean): void {
    if (!force && now - this.lastPublishAt < PUBLISH_INTERVAL_MS) return;
    this.lastPublishAt = now;
    const activeMs = this.running ? this.activeMs(this.lastFrameAt) : this.activeBeforeRunMs;
    this.snapshot = {
      running: this.running,
      runs: this.runs,
      delegate: this.delegate,
      activeMs,
      framesProcessed: this.framesProcessed,
      framesWithHand: this.framesWithHand,
      averageInferenceMs: this.framesProcessed ? this.inferenceTotalMs / this.framesProcessed : null,
      averageFps: activeMs > 0 && this.framesProcessed ? this.framesProcessed / (activeMs / 1000) : null,
      gestureFrames: this.gestureFrames,
      fpsTimeline: this.timeline.map((point) => ({ ...point })),
    };
    for (const listener of this.listeners) listener();
  }
}

/** One session per tab, shared by /demo (writer) and /dashboard (reader). */
export const sessionStore = new SessionStore();
