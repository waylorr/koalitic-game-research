import { describe, expect, it } from 'vitest';
import { evaluatePlayer, type ModuleLayout, type PlayerInput } from './player';

const k = <V,>(t: number, v: V) => ({ id: `k${t}`, t, v });
const input: PlayerInput = {
  record: { name: 'KOALITIC', level: 12, nextLevelXp: 5000, photo: 'p.jpg' },
  enterAt: 300,
  exitAt: 7000,
  layout: [k<ModuleLayout>(0, 'Open'), k<ModuleLayout>(4300, 'Compact'), k<ModuleLayout>(5500, 'Open')],
  hover: [],
  disabled: [],
  xp: [k(0, 3250), k(2700, 3400)],
  pulses: [],
};

describe('PLAYER PROFILE', () => {
  it('is absent before it enters and after its exit burns out', () => {
    expect(evaluatePlayer(299, input)).toBeNull();
    expect(evaluatePlayer(7620, input)).toBeNull();
  });
  it('shows one XP value that jumps to the keyed value with its reaction', () => {
    expect(Math.round(evaluatePlayer(2600, input)!.xp)).toBe(3250);
    const settled = evaluatePlayer(4000, input)!;
    expect(Math.round(settled.xp)).toBe(3400);
    expect(settled.ratio).toBeCloseTo(3400 / 5000);
    expect(evaluatePlayer(2800, input)!.gains[0]!.text).toBe('+150 XP');
  });
  it('follows the layout track and the independent hover and disabled flags', () => {
    expect(evaluatePlayer(2000, input)!.phase).toBe('open');
    expect(evaluatePlayer(4900, input)!.phase).toBe('compact');
    const compactHover = evaluatePlayer(2000, { ...input, layout: [k<ModuleLayout>(0, 'Compact')], hover: [k(0, true)] })!;
    expect(compactHover.phase).toBe('compact+hover');
    expect(compactHover.panel.hover).toBe(1);
    const pinned = evaluatePlayer(2000, { ...input, layout: [k<ModuleLayout>(0, 'Pinned')] })!;
    expect(pinned.panel.pinned).toBe(1);
    const disabled = evaluatePlayer(2000, { ...input, disabled: [k(0, true)] })!;
    expect(disabled.disabled).toBe(1);
  });
  it('glitches on events and stays clean at rest', () => {
    expect(evaluatePlayer(2000, input)!.glitch).toBe(0);
    expect(evaluatePlayer(2740, input)!.glitch).toBeGreaterThan(0.4);
    expect(evaluatePlayer(7040, input)!.glitch).toBeGreaterThan(0.8);
  });
  it('is a pure function of time', () => {
    expect(evaluatePlayer(2760, input)).toEqual(evaluatePlayer(2760, input));
  });
});
