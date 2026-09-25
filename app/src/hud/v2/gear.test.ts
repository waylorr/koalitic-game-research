import { describe, expect, it } from 'vitest';
import { evaluateGear, ringPosition, type GearInput } from './gear';

const k = <V,>(t: number, v: V) => ({ id: `k${t}`, t, v });
const slots = Array.from({ length: 6 }, (_, i) => ({ name: `ITEM ${i}`, spec: '', icon: 'camera' as const }));
const input: GearInput = { slots, enterAt: 0, exitAt: null, layout: [k(0, 'Open' as const)], hover: [], disabled: [], selection: [k(0, 0), k(2000, 3)], pulses: [] };

describe('GEAR RADIAL', () => {
  it('turns one sector per step towards the new selection', () => {
    const track = [k(0, 0), k(1000, 3)];
    expect(ringPosition(track, 999, 6, 170).pos).toBe(0);
    expect(Math.floor(ringPosition(track, 1000 + 170 + 10, 6, 170).pos)).toBe(1);
    expect(Math.floor(ringPosition(track, 1000 + 340 + 10, 6, 170).pos)).toBe(2);
    expect(ringPosition(track, 2000, 6, 170).pos).toBe(3);
  });
  it('takes the short way round', () => {
    expect(ringPosition([k(0, 0), k(1000, 5)], 2000, 6, 170).pos).toBe(-1);
  });
  it('continues from wherever it was when interrupted', () => {
    const a = ringPosition([k(0, 0), k(1000, 3), k(1200, 0)], 3000, 6, 170);
    expect(a.pos).toBeCloseTo(0);
  });
  it('pings as each step lands and shows the selected item', () => {
    const landing = evaluateGear(2000 + 170 + 5, input)!;
    expect(landing.ping).toBeGreaterThan(0.9);
    const settled = evaluateGear(4000, input)!;
    expect(settled.selected).toBe(3);
    expect(settled.counter).toBe('04/06');
    expect(settled.ping).toBeLessThan(0.01);
  });
});
