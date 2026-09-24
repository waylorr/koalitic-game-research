/**
 * Episode time is stored as integer milliseconds. Frames are a display and
 * editing concern: the frame rate comes from the media, and edits snap to it.
 */
export type Ms = number;

export const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);
export const clamp01 = (x: number): number => clamp(x, 0, 1);
export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

export function snapToFrame(ms: Ms, fps: number): Ms {
  const frame = Math.round((ms * fps) / 1000);
  return Math.round((frame * 1000) / fps);
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `mm:ss.ff` where ff is the frame inside the second. */
export function formatTime(ms: Ms, fps = 30): string {
  const safe = Math.max(0, Math.round(ms));
  const seconds = Math.floor(safe / 1000);
  const frame = Math.floor(((safe % 1000) * fps) / 1000 + 1e-9);
  return `${pad2(Math.floor(seconds / 60))}:${pad2(seconds % 60)}.${pad2(frame)}`;
}
