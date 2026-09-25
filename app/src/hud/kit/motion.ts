import { easeInOutCubic, easeOutCubic, phase as loopPhase } from '../../core/motion';
import { evalStateVisual, lastKeyIndex, type Track } from '../../core/tracks';
import { clamp01, lerp, seg } from './fx';
import type { MotionKnobs } from './theme';

/**
 * HUD kit, layer 2: the shared motion language (ENTREGA_CLAUDE/06_MOVIMIENTO_HUD.md).
 * Pure functions of time. A component picks from here how it enters, leaves,
 * changes state, reacts to a new value and idles, so every element speaks the
 * same language and a knob change retimes all of them.
 */

/** Rise fast, fall slower: the envelope of every glitch burst. */
export const burst = (l: number, rise: number, fall: number) => (l < 0 ? 0 : l < rise ? l / rise : clamp01(1 - (l - rise) / fall));

export interface Presence {
  /** Time since enter / since exit (ms, already scaled by speed); exit is -1 before it starts. */
  readonly e: number;
  readonly x: number;
  readonly phase: 'enter' | 'shown' | 'exit';
  /** Birth or burn-out line, null while the panel is up. */
  readonly line: { readonly scale: number; readonly opacity: number; readonly fromRight: boolean; readonly spark: number | null } | null;
  readonly glass: number;
  readonly corners: number;
  readonly cornersIn: number;
  readonly content: number;
  /** Glitch of the entrance and exit bursts (before knobs). */
  readonly glitch: number;
  /** Extra light while the line is born. */
  readonly lineGlow: number;
  /** Panel height for a given resting height. */
  readonly height: (target: number) => number;
  /** Staggered reveal helper: progress of a reveal starting `start` ms after enter. */
  readonly reveal: (start: number, duration: number) => number;
}

/**
 * Enter: born from a line → bar → panel → corners. Exit: burst, corners and
 * content go, collapse to a line that burns out. Returns null when not on screen.
 */
export function presence(t: number, enterAt: number, exitAt: number | null, k: MotionKnobs): Presence | null {
  const e = (t - enterAt) * k.speed;
  const x = exitAt === null ? -1 : (t - exitAt) * k.speed;
  if (e < 0 || x >= 620) return null;

  const lineP = easeOutCubic(seg(e, 0, 140));
  const barP = easeOutCubic(seg(e, 140, 160));
  const growP = easeOutCubic(seg(e, 300, 320));
  const cornersIn = easeOutCubic(seg(e, 560, 160));
  const cornersOut = x >= 0 ? seg(x, 0, 100) : 0;
  const contentOut = x >= 0 ? seg(x, 60, 140) : 0;
  const shrinkP = x >= 0 ? easeInOutCubic(seg(x, 120, 240)) : 0;
  const lineOut = x >= 0 ? seg(x, 360, 260) : 0;
  const burning = x >= 340;

  const height = (target: number) => {
    const h = e < 140 ? 2 : e < 300 ? lerp(2, 14, barP) : lerp(14, target, growP);
    return lerp(h, 2, shrinkP);
  };

  return {
    e,
    x,
    phase: x >= 0 ? 'exit' : e < 720 ? 'enter' : 'shown',
    line: e < 320 || burning
      ? {
          scale: burning ? 1 - easeInOutCubic(lineOut) : lineP,
          opacity: burning ? 1 - lineOut * 0.6 : 1 - seg(e, 260, 60),
          fromRight: burning,
          spark: burning ? lerp(0.1, 0.9, lineOut) : null,
        }
      : null,
    glass: e < 140 || burning ? 0 : 1,
    corners: cornersIn * (1 - cornersOut),
    cornersIn,
    content: 1 - contentOut,
    glitch: Math.max(burst(e - 250, 60, 420), x >= 0 ? burst(x, 40, 300) : 0),
    lineGlow: e < 320 ? 1 - seg(e, 200, 120) : 0,
    height,
    reveal: (start, duration) => seg(e, start, duration),
  };
}

/**
 * A discrete state track blended into weights (0..1 per axis), with continuous
 * interruption: a new key eases from wherever the previous change was.
 */
export function stateWeights<S>(track: Track<S>, t: number, fallback: S, visualOf: (s: S) => readonly number[], k: MotionKnobs, durationMs = 380) {
  return evalStateVisual(track, t, fallback, visualOf, { durationMs: durationMs / k.speed, ease: easeInOutCubic });
}

export interface ReactiveValue {
  /** The single value shown by every part that displays it (figure, bar). */
  readonly value: number;
  /** 1 while the value moves, then cools down: drives the hot bar head. */
  readonly heat: number;
  /** Recent changes still reacting: delta and ms since the change. */
  readonly changes: readonly { readonly at: number; readonly delta: number; readonly l: number }[];
  /** Glitch burst caused by the latest change. */
  readonly glitch: number;
}

/**
 * Numeric value that jumps on keys and animates the jump itself (a game HUD
 * reacting to XP gained), instead of drifting linearly between keys.
 */
export function reactiveNumber(track: Track<number>, t: number, fallback: number, k: MotionKnobs, durationMs = 650): ReactiveValue {
  const duration = durationMs / k.speed;
  const sample = evalStateVisual(track, t, fallback, v => [v], { durationMs: duration, ease: easeOutCubic });
  const i = lastKeyIndex(track, t);
  let heat = 0;
  let glitch = 0;
  const changes: { at: number; delta: number; l: number }[] = [];
  for (let j = Math.max(1, i - 3); j <= i; j++) {
    const key = track[j]!;
    const delta = key.v - track[j - 1]!.v;
    if (delta === 0) continue;
    const l = t - key.t;
    if (l < 1400 / k.speed) changes.push({ at: key.t, delta, l: l * k.speed });
    glitch = Math.max(glitch, 0.55 * burst(l * k.speed, 40, 220));
    heat = Math.max(heat, l * k.speed < durationMs ? 1 : Math.exp(-(l * k.speed - durationMs) / 260));
  }
  return { value: sample.visual[0]!, heat, changes, glitch };
}

/** Pop-up of a value change: "+150 XP" appears white-hot, cools to its colour and floats away. */
export function popup(l: number) {
  const pop = easeOutCubic(seg(l, 0, 120));
  return { opacity: pop * (1 - seg(l, 1000, 400)), dy: -14 * easeOutCubic(seg(l, 300, 1100)), scale: lerp(1.35, 1, pop), cool: seg(l, 120, 330) };
}

/** Re-reveal after a value was replaced (name, photo): glitch and decode again from `at`. */
export const pulseGlitch = (t: number, at: number, k: MotionKnobs) => 0.45 * burst((t - at) * k.speed, 30, 200);

export interface Ambient {
  /** Sheen position 0..1 while it crosses the glass, else null. */
  readonly sheen: number | null;
  readonly glitch: number;
  /** A text label flickers into glyphs for a moment. */
  readonly textFlicker: boolean;
}

/** The idle loop every visible element runs on its own. */
export function ambient(t: number, k: MotionKnobs, seed = 0): Ambient {
  if (k.ambient <= 0) return { sheen: null, glitch: 0, textFlicker: false };
  const sheenP = loopPhase(t + seed * 977, 7000 / k.ambient);
  return {
    sheen: sheenP < 0.16 ? sheenP / 0.16 : null,
    glitch: loopPhase(t + 1700 + seed * 613, 6000 / k.ambient) < 0.016 ? 0.3 : 0,
    textFlicker: loopPhase(t + 3100 + seed * 389, 9000 / k.ambient) < 0.014,
  };
}
