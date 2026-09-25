import { describe, expect, it } from 'vitest';
import { evaluateRail, type RailInput } from './rail';

const k = <V,>(t: number, v: V) => ({ id: `k${t}`, t, v });
const input: RailInput = {
  enterAt: 0, exitAt: 9000,
  player: { record: { name: 'KOALITIC', level: 12, nextLevelXp: 5000, photo: 'p.jpg' }, xp: [k(0, 3250)] },
  modules: [{ id: 'inventory', label: 'INVENTORY', icon: 'bag' }, { id: 'gear', label: 'GEAR', icon: 'tools' }, { id: 'stamina', label: 'STAMINA', icon: 'bolt' }],
  selected: [k(0, ''), k(2000, 'gear'), k(5000, 'stamina')],
  gear: { slots: [{ name: 'A', spec: '', icon: 'camera' }, { name: 'B', spec: '', icon: 'lens' }], selection: [k(0, 0)] },
  stamina: [k(0, 72)],
};

describe('LEFT RAIL · DOCK', () => {
  it('stays folded with no flyout until a module is selected', () => {
    const frame = evaluateRail(1500, input)!;
    expect(frame.phase).toBe('dock');
    expect(frame.flyouts).toHaveLength(0);
  });
  it('opens only the selected module beside its icon', () => {
    const frame = evaluateRail(3500, input)!;
    expect(frame.phase).toBe('dock:gear');
    expect(frame.flyouts.map(f => f.id)).toEqual(['gear']);
    expect(frame.tiles.find(t => t.id === 'gear')!.selected).toBe(1);
  });
  it('closes the previous flyout while the next one opens', () => {
    const switching = evaluateRail(5100, input)!;
    expect(switching.flyouts.map(f => f.id).sort()).toEqual(['gear', 'stamina']);
    const settled = evaluateRail(7000, input)!;
    expect(settled.flyouts.map(f => f.id)).toEqual(['stamina']);
  });
});
