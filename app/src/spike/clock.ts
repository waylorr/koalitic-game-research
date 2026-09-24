import type { Ms } from '../core/time';

/**
 * Playhead store kept outside React state so only the HUD layer and the
 * timeline cursor re-render on every frame, not the whole editor.
 */
export interface ClockState {
  readonly t: Ms;
  readonly playing: boolean;
}

export interface Clock {
  get(): ClockState;
  set(next: Partial<ClockState>): void;
  subscribe(listener: () => void): () => void;
}

export function createClock(initial: ClockState): Clock {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      state = { ...state, ...next };
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Rolling timing samples for the performance panel and the automated test. */
export class Samples {
  private values: number[] = [];
  constructor(private readonly size = 600) {}
  push(value: number) {
    this.values.push(value);
    if (this.values.length > this.size) this.values.shift();
  }
  reset() { this.values = []; }
  get count() { return this.values.length; }
  percentile(p: number): number {
    if (!this.values.length) return 0;
    const sorted = [...this.values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!;
  }
  max(): number { return this.values.reduce((a, b) => Math.max(a, b), 0); }
}
