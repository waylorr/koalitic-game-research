import { clamp01, lerp, type Ms } from './time';
import type { Easing, Transition } from './motion';

/** One authored point on a property track. Tracks are sorted by `t` with unique times. */
export interface Key<V> {
  readonly id: string;
  readonly t: Ms;
  readonly v: V;
}
export type Track<V> = readonly Key<V>[];

/** Index of the last key at or before t, or -1 when t is before the first key. */
export function lastKeyIndex<V>(track: Track<V>, t: Ms): number {
  let lo = 0, hi = track.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (track[mid]!.t <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

/**
 * Numeric track: linear between keys; the first and last values hold outside
 * the keyed range (After Effects semantics). An empty track uses the fallback.
 */
export function evalNumber(track: Track<number>, t: Ms, fallback: number): number {
  if (track.length === 0) return fallback;
  const i = lastKeyIndex(track, t);
  if (i < 0) return track[0]!.v;
  const a = track[i]!, b = track[i + 1];
  if (!b || a.t === t) return a.v;
  return lerp(a.v, b.v, (t - a.t) / (b.t - a.t));
}

/** Discrete track (states, sectors, records): the value holds until the next key. */
export function evalHold<V>(track: Track<V>, t: Ms, fallback: V): V {
  if (track.length === 0) return fallback;
  const i = lastKeyIndex(track, t);
  return (i < 0 ? track[0]! : track[i]!).v;
}

export interface Vec2 { readonly x: number; readonly y: number }

export function evalVec2(track: Track<Vec2>, t: Ms, fallback: Vec2): Vec2 {
  if (track.length === 0) return fallback;
  const i = lastKeyIndex(track, t);
  if (i < 0) return track[0]!.v;
  const a = track[i]!, b = track[i + 1];
  if (!b || a.t === t) return a.v;
  const p = (t - a.t) / (b.t - a.t);
  return { x: lerp(a.v.x, b.v.x, p), y: lerp(a.v.y, b.v.y, p) };
}

const mix = (a: readonly number[], b: readonly number[], p: number): number[] => a.map((x, j) => lerp(x, b[j] ?? x, p));

export interface StateSample<V> {
  readonly value: V;
  /** Blended visual parameters (e.g. rail openness) at time t. */
  readonly visual: readonly number[];
  /** 0..1 progress of the transition into `value`; 1 when settled. */
  readonly progress: number;
}

/**
 * Discrete state with a reusable transition (the template decides *how*, the
 * episode decides *when*). The result depends only on the track and t: a key
 * that interrupts a running transition starts from the visual evaluated at
 * that instant, so scrubbing into the middle of an interrupted transition
 * gives the same picture as playing through it.
 */
export function evalStateVisual<V>(
  track: Track<V>,
  t: Ms,
  fallback: V,
  visualOf: (value: V) => readonly number[],
  transition: Transition,
): StateSample<V> {
  if (track.length === 0) return { value: fallback, visual: visualOf(fallback), progress: 1 };
  const i = lastKeyIndex(track, t);
  if (i <= 0) {
    const value = track[0]!.v;
    return { value, visual: visualOf(value), progress: 1 };
  }
  const key = track[i]!;
  const d = transition.durationMs;
  if (d <= 0) return { value: key.v, visual: visualOf(key.v), progress: 1 };
  // Walk back only through transitions still running when the next key arrived.
  let s = i;
  while (s > 1 && track[s]!.t - track[s - 1]!.t < d) s--;
  let from: readonly number[] = visualOf(track[s - 1]!.v);
  for (let k = s; k < i; k++) {
    from = mix(from, visualOf(track[k]!.v), transition.ease(clamp01((track[k + 1]!.t - track[k]!.t) / d)));
  }
  const progress = clamp01((t - key.t) / d);
  return { value: key.v, visual: mix(from, visualOf(key.v), transition.ease(progress)), progress };
}

export interface ClipSample {
  readonly active: boolean;
  /** Time since the clip started; drives staggered reveals inside the component. */
  readonly localT: Ms;
  /** 0..1 eased presence: enter at the start, exit in the last part of the range. */
  readonly presence: number;
}

/** A clip is on screen in [start, end); enter and exit happen inside that range. */
export function evalClip(start: Ms, end: Ms, t: Ms, enterMs: number, exitMs: number, ease: Easing): ClipSample {
  if (t < start || t >= end) return { active: false, localT: t - start, presence: 0 };
  const total = end - start;
  const scale = enterMs + exitMs > total ? total / (enterMs + exitMs) : 1;
  const enter = enterMs > 0 ? clamp01((t - start) / (enterMs * scale)) : 1;
  const exit = exitMs > 0 ? clamp01((end - t) / (exitMs * scale)) : 1;
  return { active: true, localT: t - start, presence: Math.min(ease(enter), ease(exit)) };
}

/** Insert a key or replace the value of the key already at t. Returns a new track. */
export function upsertKey<V>(track: Track<V>, t: Ms, v: V, newId: () => string): Track<V> {
  const i = lastKeyIndex(track, t);
  if (i >= 0 && track[i]!.t === t) return track.map((k, j) => (j === i ? { ...k, v } : k));
  const next = track.slice();
  next.splice(i + 1, 0, { id: newId(), t, v });
  return next;
}

/** Remove the key at t, keeping at least one key so the channel keeps an initial value. */
export function removeKeyAt<V>(track: Track<V>, t: Ms): Track<V> {
  if (track.length <= 1) return track;
  return track.filter(k => k.t !== t);
}
