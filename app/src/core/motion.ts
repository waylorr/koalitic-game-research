import type { Ms } from './time';

/**
 * Motion is a pure function of normalised progress (0..1) or of time.
 * Nothing here depends on wall-clock time or on the previous rendered frame,
 * so any instant can be rendered directly (scrub, reopen, future export).
 */
export type Easing = (p: number) => number;

export const linear: Easing = p => p;
export const easeOutCubic: Easing = p => 1 - (1 - p) ** 3;
export const easeInOutCubic: Easing = p => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

/** CSS-style cubic-bezier(x1, y1, x2, y2), for curves supplied by the design system. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return p => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - p;
      if (Math.abs(err) < 1e-6) return sampleY(t);
      const d = slopeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1;
    t = p;
    for (let i = 0; i < 30; i++) {
      const x = sampleX(t);
      if (Math.abs(x - p) < 1e-6) break;
      if (x < p) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

/** Phase 0..1 of a looping ambient effect (pulse, sweep) at episode time t. */
export function phase(t: Ms, periodMs: number): number {
  return (((t % periodMs) + periodMs) % periodMs) / periodMs;
}

export interface Transition {
  readonly durationMs: number;
  readonly ease: Easing;
}
