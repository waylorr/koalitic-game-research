/**
 * Deterministic randomness for HUD effects. Glitches and artifacts must look
 * random but be identical every time the same instant is drawn (scrub, export).
 */
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (t: number, start: number, duration: number) => clamp01((t - start) / duration);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Stable pseudo-random value in [0, 1) for any number. */
export function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Small seeded generator (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Runs third-party code that calls Math.random (e.g. GlitchFilter.refresh) with a fixed seed. */
export function withSeed<T>(seed: number, fn: () => T): T {
  const original = Math.random;
  Math.random = seeded(seed);
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

const GLYPHS = 'ABCDEFGHJKLMNPRSTUVXYZ0123456789#%<>/=';

/** Decode effect: settled letters from the left, a few scrambling glyphs ahead of them. */
export function decode(text: string, p: number, t: number, seed: number): string {
  if (p >= 1) return text;
  if (p <= 0) return '';
  const settled = p * text.length;
  const tick = Math.floor(t / 45);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (i < Math.floor(settled) || ch === ' ') out += ch;
    else if (i < settled + 3) out += GLYPHS[Math.floor(hash(seed * 97 + i * 13 + tick) * GLYPHS.length)];
  }
  return out;
}
