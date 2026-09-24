import { describe, expect, it } from 'vitest';
import { evaluatePlayer, type PlayerScript } from './player';

const script: PlayerScript = {
  name: 'KOALITIC', level: 12, baseXp: 3250, nextLevelXp: 5000, photo: 'p.jpg',
  enterAt: 300, exitAt: 7000,
  xpGains: [{ at: 2700, amount: 150 }],
  folds: [{ at: 4300, folded: true }, { at: 5500, folded: false }],
  edits: [],
};

describe('PLAYER module', () => {
  it('is absent before it enters and after its exit burns out', () => {
    expect(evaluatePlayer(299, script)).toBeNull();
    expect(evaluatePlayer(7620, script)).toBeNull();
  });
  it('shows one XP value that reaches base plus gains', () => {
    const settled = evaluatePlayer(4000, script)!;
    expect(Math.round(settled.xp)).toBe(3400);
    expect(settled.ratio).toBeCloseTo(3400 / 5000);
  });
  it('glitches on events and stays clean at rest', () => {
    expect(evaluatePlayer(2000, script)!.glitch).toBe(0);
    expect(evaluatePlayer(2740, script)!.glitch).toBeGreaterThan(0.4);
    expect(evaluatePlayer(7040, script)!.glitch).toBeGreaterThan(0.8);
  });
  it('is a pure function of time', () => {
    expect(evaluatePlayer(2760, script)).toEqual(evaluatePlayer(2760, script));
    expect(evaluatePlayer(4900, script)!.phase).toBe('folded');
  });
});
