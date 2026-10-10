/** Temporal smoothing, identical to python/hand_gestures/gestures.py. */

/** Majority vote per finger over the last `window` frames; ties count as raised. */
export class FingerStateSmoother {
  private readonly window: number;
  private readonly history: number[][] = [];

  constructor(window = 5) {
    this.window = Math.max(1, Math.floor(window));
  }

  update(states: readonly number[]): number[] {
    this.history.push([...states]);
    if (this.history.length > this.window) this.history.shift();
    const threshold = this.history.length / 2;
    return states.map((_, finger) => {
      const raised = this.history.reduce((sum, sample) => sum + (sample[finger] ? 1 : 0), 0);
      return raised >= threshold ? 1 : 0;
    });
  }
}

/** Most frequent label over the last `window` frames; a tie keeps the label seen first. */
export class LabelSmoother<T extends string = string> {
  private readonly window: number;
  private readonly history: T[] = [];

  constructor(window = 5) {
    this.window = Math.max(1, Math.floor(window));
  }

  update(label: T): T {
    this.history.push(label);
    if (this.history.length > this.window) this.history.shift();
    // Map keeps first-insertion order, so a strict ">" lets the oldest label win ties
    // (the same result as Python's Counter.most_common).
    const counts = new Map<T, number>();
    for (const item of this.history) counts.set(item, (counts.get(item) ?? 0) + 1);
    let best = label;
    let bestCount = 0;
    for (const [item, count] of counts) {
      if (count > bestCount) {
        best = item;
        bestCount = count;
      }
    }
    return best;
  }
}
