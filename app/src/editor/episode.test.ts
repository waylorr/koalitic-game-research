import { describe, expect, it } from 'vitest';
import { deleteKey, demoEpisode, moveKey, presenceOf, railInput, setKey, valueAt } from './episode';
import { evaluateRail } from '../hud/v2/rail';

const slots = [{ name: 'A', spec: '', icon: 'camera' as const }, { name: 'B', spec: '', icon: 'lens' as const }];
const modules = [{ id: 'gear', label: 'GEAR', icon: 'tools' as const }, { id: 'stamina', label: 'STAMINA', icon: 'bolt' as const }];
const doc = demoEpisode('bg.jpg', { name: 'K', level: 1, nextLevelXp: 100, photo: 'p.jpg' }, modules, slots);

describe('episode document', () => {
  it('sets a key at the playhead, snapped to a frame, or updates the key already there', () => {
    const a = setKey(doc, 'stamina.value', 5010, 30);
    const key = a.tracks['stamina.value'].find(k => k.v === 30)!;
    expect(key.t).toBe(5000);
    const b = setKey(a, 'stamina.value', 5000, 40);
    expect(b.tracks['stamina.value'].filter(k => k.t === 5000).map(k => k.v)).toEqual([40]);
  });
  it('moves and deletes keys but keeps the initial one', () => {
    const track = doc.tracks['stamina.value'];
    const moved = moveKey(doc, 'stamina.value', track[1]!.id, 12345);
    expect(moved.tracks['stamina.value'].map(k => k.t)).toEqual([0, 10200, 12333]);
    const single = { ...doc, tracks: { ...doc.tracks, 'stamina.value': [track[0]!] } };
    expect(deleteKey(single, 'stamina.value', track[0]!.id)).toBe(single);
  });
  it('holds discrete values and derives presence from the visibility track', () => {
    expect(valueAt(doc.tracks['rail.selected'], 5000, '')).toBe('gear');
    expect(presenceOf(doc.tracks['rail.visible'])).toEqual({ enterAt: 500, exitAt: 18500 });
  });
  it('drives the Left Rail from its tracks at any instant', () => {
    const input = railInput(doc);
    expect(evaluateRail(200, input)).toBeNull();
    expect(evaluateRail(5000, input)!.phase).toBe('dock:gear');
    expect(evaluateRail(9500, input)!.phase).toBe('dock:stamina');
  });
});
