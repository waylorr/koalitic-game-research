import { describe, expect, it } from 'vitest';
import { evaluateFrame } from './evaluate';
import { DEMO_EPISODE, DEMO_LIBRARY } from './demo';
import type { EpisodeDoc, OverlayInstance, RailState } from './model';
import { RAIL_STATES } from './model';

/** Stress fixture from the research notes: 14-minute episode, ~1,000 keys per channel, 200 overlays. */
function heavyEpisode(): EpisodeDoc {
  const duration = 14 * 60_000;
  const keys = <V>(n: number, value: (i: number) => V) =>
    Array.from({ length: n }, (_, i) => ({ id: `k${i}`, t: Math.round((i * duration) / n), v: value(i) }));
  const overlays: OverlayInstance[] = Array.from({ length: 200 }, (_, i) => ({
    id: `ov${i}`,
    componentId: 'system-notification',
    start: i * 4000,
    end: i * 4000 + 6000,
    props: { title: 'SYSTEM NOTIFICATION', lines: [`EVENT ${i}`] },
    position: [{ id: 'p0', t: i * 4000, v: { x: 40, y: 60 } }, { id: 'p1', t: i * 4000 + 6000, v: { x: 60, y: 55 } }],
  }));
  return {
    ...DEMO_EPISODE,
    durationMs: duration,
    tracks: {
      'left-rail.state': keys(1000, i => RAIL_STATES[i % 3] as RailState),
      'player-profile.xp': keys(1000, i => i * 10),
      'gear-radial.selection': keys(1000, i => (i % 5) + 1),
      'stamina.value': keys(1000, i => (i * 37) % 100),
    },
    overlays,
  };
}

describe('evaluator scale', () => {
  it('evaluates any instant of a heavy 14-minute episode well inside one frame budget', () => {
    const doc = heavyEpisode();
    const samples: number[] = [];
    for (let i = 0; i < 5000; i++) {
      const t = (i * 104_729) % doc.durationMs;
      const start = performance.now();
      evaluateFrame(doc, DEMO_LIBRARY, t);
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)]!;
    console.info(`evaluateFrame heavy episode: p50 ${samples[2500]!.toFixed(4)} ms · p95 ${p95.toFixed(4)} ms · max ${samples.at(-1)!.toFixed(3)} ms`);
    expect(p95).toBeLessThan(1);
  });
});
