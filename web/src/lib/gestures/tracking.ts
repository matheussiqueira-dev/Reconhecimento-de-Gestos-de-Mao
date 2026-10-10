import { analyzeHand, type GestureId, type Handedness, type Landmark } from "./analyze";
import { toSelfieFrame } from "./frame";
import { FingerStateSmoother, LabelSmoother } from "./smoothing";

export type RawHandResult = {
  landmarks: ReadonlyArray<ReadonlyArray<Landmark>>;
  handedness: ReadonlyArray<ReadonlyArray<{ categoryName: string; score: number }>>;
};

export type HandReading = {
  readonly handedness: Handedness;
  /** The model's confidence in the handedness label (0..1). */
  readonly score: number;
  readonly gesture: GestureId;
  readonly fingerStates: readonly number[];
  readonly total: number;
  readonly pinchDistance: number;
  /** Selfie-frame landmarks, for drawing. */
  readonly landmarks: readonly Landmark[];
};

/**
 * Turns per-frame MediaPipe results into smoothed readings, one smoother pair per
 * hand side, like the desktop app. A side that leaves the frame loses its history.
 */
export class HandReadingTracker {
  private readonly smoothers = new Map<
    Handedness,
    { fingers: FingerStateSmoother; labels: LabelSmoother<GestureId> }
  >();

  constructor(private readonly window = 5) {}

  read(result: RawHandResult): HandReading[] {
    const readings: HandReading[] = [];
    result.landmarks.forEach((raw, index) => {
      const category = result.handedness[index]?.[0];
      const selfie = toSelfieFrame(raw, category?.categoryName ?? "Left");
      const analysis = analyzeHand(selfie.landmarks, selfie.handedness);

      let smoother = this.smoothers.get(selfie.handedness);
      if (!smoother) {
        smoother = {
          fingers: new FingerStateSmoother(this.window),
          labels: new LabelSmoother<GestureId>(this.window),
        };
        this.smoothers.set(selfie.handedness, smoother);
      }
      const fingerStates = smoother.fingers.update(analysis.fingerStates);
      readings.push({
        handedness: selfie.handedness,
        score: category?.score ?? 0,
        gesture: smoother.labels.update(analysis.gesture),
        fingerStates,
        total: fingerStates.reduce((sum, value) => sum + value, 0),
        pinchDistance: analysis.pinchDistance,
        landmarks: selfie.landmarks,
      });
    });

    const present = new Set(readings.map((reading) => reading.handedness));
    for (const side of this.smoothers.keys()) {
      if (!present.has(side)) this.smoothers.delete(side);
    }
    return readings;
  }

  reset(): void {
    this.smoothers.clear();
  }
}
