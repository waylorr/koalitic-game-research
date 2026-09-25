import { easeOutCubic } from '../../core/motion';
import { lastKeyIndex, type Track } from '../../core/tracks';
import { clamp01, decode } from '../kit/fx';
import type { GearIcon } from '../kit/icons';
import { ambient, burst, presence, reactiveNumber, stateWeights, type Presence } from '../kit/motion';
import { evaluateSample, type SampleFrame, type SampleInput } from '../kit/sample';
import { DEFAULT_MOTION, type MotionKnobs } from '../kit/theme';
import { evaluateGear, type GearFrame, type GearSlot } from './gear';
import type { PlayerRecordView } from './player';

/**
 * LEFT RAIL in DOCK mode (folded): the player's mini card on top and a column
 * of icons, one per module, in the order the HUD Template sets. The `selected`
 * track opens ONE module beside its icon (a flyout), the rest of the rail
 * stays folded. The flyout reuses the module's own evaluator (the Gear Radial
 * in its bare form), so there is one implementation per component.
 */
export interface RailModuleDef {
  readonly id: string;
  readonly label: string;
  readonly icon: GearIcon;
}

export interface RailInput {
  readonly enterAt: number;
  readonly exitAt: number | null;
  readonly player: { readonly record: PlayerRecordView; readonly xp: Track<number> };
  readonly modules: readonly RailModuleDef[];
  /** Module id opened beside its icon, '' for none. */
  readonly selected: Track<string>;
  readonly gear: { readonly slots: readonly GearSlot[]; readonly selection: Track<number> };
  readonly stamina: Track<number>;
}

export const RAIL_CARD = { w: 236, h: 70 };
export const RAIL_TILE = { size: 46, gap: 9, top: 86 };
export const tileY = (i: number) => RAIL_TILE.top + i * (RAIL_TILE.size + RAIL_TILE.gap);

export interface RailFlyout {
  readonly id: string;
  readonly index: number;
  /** 0..1 growth of the red connector from the icon. */
  readonly link: number;
  readonly gear: GearFrame | null;
  readonly sample: SampleFrame | null;
  readonly sampleInput: SampleInput | null;
}

export interface RailFrame {
  readonly phase: string;
  readonly card: {
    readonly h: number;
    readonly glass: number;
    readonly corners: number;
    readonly cornersIn: number;
    readonly line: Presence['line'];
    readonly content: number;
    readonly portraitReveal: number;
    readonly portraitFlash: number;
    readonly name: string;
    readonly levelIn: number;
    readonly ratio: number;
    readonly heat: number;
    readonly xp: number;
    readonly sheen: number | null;
  };
  readonly tiles: readonly { readonly id: string; readonly icon: GearIcon; readonly appear: number; readonly selected: number; readonly ping: number }[];
  readonly flyouts: readonly RailFlyout[];
  readonly glitch: number;
  readonly seed: number;
  readonly bloom: number;
}

/** The latest span during which `id` was selected, as an enter/exit clip. */
function clipFor(track: Track<string>, id: string, t: number): { enterAt: number; exitAt: number | null } | null {
  const i = lastKeyIndex(track, t);
  let start = -1;
  for (let j = i; j >= 0; j--) {
    if (track[j]!.v === id) { start = j; break; }
  }
  if (start < 0) return null;
  // Walk back over repeated keys of the same id to find where the span began.
  while (start > 0 && track[start - 1]!.v === id) start--;
  let end: number | null = null;
  for (let j = start + 1; j < track.length; j++) {
    if (track[j]!.v !== id) { end = track[j]!.t; break; }
  }
  return { enterAt: track[start]!.t, exitAt: end };
}

const MODULE_SHELL = { layout: [], hover: [], disabled: [], pulses: [] } as const;

export function evaluateRail(t: number, input: RailInput, k: MotionKnobs = DEFAULT_MOTION): RailFrame | null {
  const p = presence(t, input.enterAt, input.exitAt, k);
  if (!p) return null;
  const idle = ambient(t, k, 7);
  const xp = reactiveNumber(input.player.xp, t, 0, k);
  const fill = easeOutCubic(p.reveal(800, 600));
  const photoL = (t - input.enterAt) * k.speed - 420;

  const tiles = input.modules.map((module, i) => {
    const sel = stateWeights(input.selected, t, '', v => [v === module.id ? 1 : 0], k, 220);
    const idx = lastKeyIndex(input.selected, t);
    const key = idx >= 0 ? input.selected[idx]! : null;
    const ping = key && key.v === module.id ? Math.exp(-Math.max(0, (t - key.t) * k.speed) / 260) : 0;
    return { id: module.id, icon: module.icon, appear: easeOutCubic(p.reveal(560 + i * 80, 220)), selected: sel.visual[0] ?? 0, ping };
  });

  const flyouts: RailFlyout[] = [];
  input.modules.forEach((module, index) => {
    const clip = clipFor(input.selected, module.id, t);
    if (!clip) return;
    // A flyout never outlives the rail: the rail's exit closes it too.
    const exitAt = clip.exitAt ?? input.exitAt;
    const shell = { ...MODULE_SHELL, enterAt: clip.enterAt + 120 / k.speed, exitAt };
    const link = clamp01(((t - clip.enterAt) * k.speed) / 140) * (exitAt === null ? 1 : 1 - clamp01(((t - exitAt) * k.speed) / 300));
    if (module.id === 'gear') {
      const gear = evaluateGear(t, { ...shell, slots: input.gear.slots, selection: input.gear.selection }, k);
      if (gear || link > 0) flyouts.push({ id: module.id, index, link, gear, sample: null, sampleInput: null });
    } else {
      const sampleInput: SampleInput = { ...shell, title: module.label, value: module.id === 'stamina' ? input.stamina : [{ id: 'v', t: 0, v: 60 }] };
      const sample = evaluateSample(t, sampleInput, k);
      if (sample || link > 0) flyouts.push({ id: module.id, index, link, gear: null, sample, sampleInput });
    }
  });

  const selectBurst = input.selected.reduce((g, key) => Math.max(g, 0.3 * burst((t - key.t) * k.speed, 20, 160)), 0);
  const glitch = Math.max(p.glitch, xp.glitch, idle.glitch, selectBurst);
  const lastSelected = lastKeyIndex(input.selected, t);
  const current = lastSelected >= 0 ? input.selected[lastSelected]!.v : '';
  return {
    phase: p.phase === 'shown' ? `dock${current ? ':' + current : ''}` : p.phase,
    card: {
      h: p.height(RAIL_CARD.h),
      glass: p.glass,
      corners: p.corners,
      cornersIn: p.cornersIn,
      line: p.line,
      content: p.content,
      portraitReveal: clamp01(photoL / 200),
      portraitFlash: (1 - clamp01(photoL / 460)) ** 3,
      name: decode(input.player.record.name, idle.textFlicker ? 0.55 : p.reveal(560, 320), t, 21),
      levelIn: p.reveal(680, 240),
      ratio: clamp01((xp.value * fill) / input.player.record.nextLevelXp),
      heat: fill > 0 && fill < 1 ? 1 : xp.heat,
      xp: xp.value * fill,
      sheen: idle.sheen,
    },
    tiles,
    flyouts,
    glitch,
    seed: Math.floor(t / 45) + 31,
    bloom: Math.max(glitch, p.lineGlow, ...tiles.map(tile => tile.ping * 0.6)),
  };
}
