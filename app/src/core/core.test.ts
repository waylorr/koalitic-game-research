import { describe, expect, it } from 'vitest';
import { cubicBezier, easeOutCubic, linear, phase } from './motion';
import { evalClip, evalHold, evalNumber, evalStateVisual, removeKeyAt, upsertKey, type Track } from './tracks';
import { formatTime, snapToFrame } from './time';
import { evaluateFrame, RAIL_MOTIONS } from './evaluate';
import { DEMO_EPISODE, DEMO_LIBRARY } from './demo';
import type { EpisodeDoc, RailState } from './model';

const key = <V>(t: number, v: V) => ({ id: `k${t}`, t, v });
const railVisual = (s: RailState) => (s === 'Folded' ? [0, 0] : s === 'Open' ? [1, 0] : [1, 1]);
const smooth = RAIL_MOTIONS['smooth-reveal'];

describe('numeric tracks', () => {
  const stamina: Track<number> = [key(60_000, 100), key(90_000, 80)];
  it('interpolates linearly: 100 → 80 between 01:00 and 01:30 is 90 at 01:15', () => {
    expect(evalNumber(stamina, 75_000, 0)).toBe(90);
  });
  it('holds the first and last values outside the keyed range, fallback only when empty', () => {
    expect(evalNumber(stamina, 0, 0)).toBe(100);
    expect(evalNumber(stamina, 119_000, 0)).toBe(80);
    expect(evalNumber([], 5, 42)).toBe(42);
  });
});

describe('discrete tracks', () => {
  it('a sector never interpolates (prototype bug: sector 1 → 5 gave 3 at 00:30)', () => {
    const selection: Track<number> = [key(0, 1), key(60_000, 5)];
    expect(evalHold(selection, 30_000, 1)).toBe(1);
    expect(evalHold(selection, 60_000, 1)).toBe(5);
  });
});

describe('state transitions are a function of time', () => {
  const rail: Track<RailState> = [key(0, 'Open'), key(20_000, 'Folded')];
  it('settles on the state visual', () => {
    expect(evalStateVisual(rail, 10_000, 'Open', railVisual, smooth).visual).toEqual([1, 0]);
    expect(evalStateVisual(rail, 30_000, 'Open', railVisual, smooth).visual).toEqual([0, 0]);
  });
  it('shows the half-folded panel when seeking into the transition', () => {
    const mid = evalStateVisual(rail, 20_225, 'Open', railVisual, smooth);
    expect(mid.progress).toBeCloseTo(0.5);
    expect(mid.visual[0]).toBeCloseTo(1 - easeOutCubic(0.5));
  });
  it('an interrupting key starts from the visual at that instant (continuous, no jump)', () => {
    const interrupted: Track<RailState> = [key(0, 'Open'), key(1000, 'Folded'), key(1200, 'Open')];
    const before = evalStateVisual(interrupted, 1199.999, 'Open', railVisual, smooth).visual[0]!;
    const at = evalStateVisual(interrupted, 1200, 'Open', railVisual, smooth).visual[0]!;
    expect(at).toBeCloseTo(1 - easeOutCubic(200 / 450), 6);
    expect(Math.abs(at - before)).toBeLessThan(1e-3);
    expect(evalStateVisual(interrupted, 1200 + 450, 'Open', railVisual, smooth).visual[0]).toBe(1);
  });
  it('a chain of interruptions is resolved without history', () => {
    const chain: Track<RailState> = [key(0, 'Open'), key(100, 'Folded'), key(250, 'Pinned'), key(300, 'Folded'), key(5000, 'Open')];
    const a = evalStateVisual(chain, 420, 'Open', railVisual, smooth);
    const b = evalStateVisual(chain, 420, 'Open', railVisual, smooth);
    expect(a).toEqual(b);
    expect(a.visual[0]).toBeGreaterThan(0);
    expect(a.visual[0]).toBeLessThan(1);
  });
  it('snap motion changes instantly', () => {
    expect(evalStateVisual(rail, 20_001, 'Open', railVisual, RAIL_MOTIONS.snap).visual).toEqual([0, 0]);
  });
});

describe('clips (POV overlays)', () => {
  it('enters, holds and exits inside its range', () => {
    expect(evalClip(1000, 5000, 999, 400, 400, linear).presence).toBe(0);
    expect(evalClip(1000, 5000, 1200, 400, 400, linear).presence).toBeCloseTo(0.5);
    expect(evalClip(1000, 5000, 3000, 400, 400, linear).presence).toBe(1);
    expect(evalClip(1000, 5000, 4900, 400, 400, linear).presence).toBeCloseTo(0.25);
    expect(evalClip(1000, 5000, 5000, 400, 400, linear).active).toBe(false);
  });
  it('shrinks enter/exit proportionally for very short clips', () => {
    expect(evalClip(0, 400, 200, 400, 400, linear).presence).toBeCloseTo(1);
  });
});

describe('key editing', () => {
  const id = () => 'new';
  it('inserts sorted, replaces at the same time, keeps at least one key', () => {
    const track = upsertKey(upsertKey([key(0, 1)], 500, 3, id), 250, 2, id);
    expect(track.map(k => k.t)).toEqual([0, 250, 500]);
    expect(upsertKey(track, 250, 9, id).map(k => k.v)).toEqual([1, 9, 3]);
    expect(removeKeyAt([key(0, 1)], 0)).toHaveLength(1);
    expect(removeKeyAt(track, 250).map(k => k.t)).toEqual([0, 500]);
  });
});

describe('episode evaluation', () => {
  it('hidden children keep evaluating: rail folded at 01:15, stamina 90', () => {
    const frame = evaluateFrame(DEMO_EPISODE, DEMO_LIBRARY, 75_000);
    expect(frame.leftRail.state).toBe('Folded');
    expect(frame.leftRail.openness).toBe(0);
    expect(frame.stamina.value).toBe(90);
  });
  it('a player change keeps the XP track (it lives in the episode, not in the record copy)', () => {
    const arnau: EpisodeDoc = { ...DEMO_EPISODE, bindings: { ...DEMO_EPISODE.bindings, player: 'rec_player_arnau' } };
    expect(evaluateFrame(arnau, DEMO_LIBRARY, 53_000).player).toMatchObject({ name: 'ARNAU', xp: 3350 });
  });
  it('overlay position follows manual points', () => {
    const [overlay] = evaluateFrame(DEMO_EPISODE, DEMO_LIBRARY, 29_000).overlays;
    expect(overlay?.x).toBeCloseTo(57.5);
    expect(evaluateFrame(DEMO_EPISODE, DEMO_LIBRARY, 34_000).overlays).toHaveLength(0);
  });
  it('is pure: the same instant gives the same frame regardless of evaluation order', () => {
    const times = Array.from({ length: 400 }, (_, i) => Math.round((i * 7919) % 120_000));
    const forward = times.map(t => JSON.stringify(evaluateFrame(DEMO_EPISODE, DEMO_LIBRARY, t)));
    const backward = [...times].reverse().map(t => JSON.stringify(evaluateFrame(DEMO_EPISODE, DEMO_LIBRARY, t))).reverse();
    expect(backward).toEqual(forward);
  });
});

describe('time and easing helpers', () => {
  it('formats and snaps to frames', () => {
    expect(formatTime(75_000, 30)).toBe('01:15.00');
    expect(formatTime(1_034, 30)).toBe('00:01.01');
    expect(snapToFrame(1_020, 30)).toBe(1_033);
  });
  it('cubic-bezier matches its endpoints and a known curve', () => {
    const ease = cubicBezier(0.25, 0.1, 0.25, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.8024, 3);
    expect(phase(-250, 1000)).toBeCloseTo(0.75);
  });
});
