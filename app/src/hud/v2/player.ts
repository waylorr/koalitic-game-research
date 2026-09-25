import type { Track } from '../../core/tracks';
import { clamp01, decode } from '../kit/fx';
import { ambient, popup, presence, pulseGlitch, reactiveNumber, stateWeights } from '../kit/motion';
import { DEFAULT_MOTION, type MotionKnobs } from '../kit/theme';

/**
 * PLAYER PROFILE (Left Rail module, HUD v2 look, HUD v1 motion) as a pure
 * function of time. The input is what an episode holds: the Data Library
 * record, when the module is on screen, and keyframed tracks for its state
 * and XP. evaluatePlayer decides *how* it looks at t using the shared kit; the
 * PixiJS renderer (PlayerPixi.ts) only draws the frame.
 */
export type ModuleState = 'Compact' | 'Open' | 'Pinned' | 'Hover' | 'Disabled';
export const MODULE_STATES: readonly ModuleState[] = ['Compact', 'Open', 'Pinned', 'Hover', 'Disabled'];

export interface PlayerRecordView {
  readonly name: string;
  readonly level: number;
  readonly nextLevelXp: number;
  readonly photo: string;
}

export interface PlayerInput {
  readonly record: PlayerRecordView;
  readonly enterAt: number;
  readonly exitAt: number | null;
  readonly state: Track<ModuleState>;
  /** XP keys: the value jumps on each key and the module animates the jump. */
  readonly xp: Track<number>;
  /** Instants when a record value was replaced, so it reveals again. */
  readonly pulses: readonly { readonly at: number; readonly field: 'name' | 'level' | 'photo' }[];
}

export const PLAYER_W = 360;
export const PLAYER_H_OPEN = 150;
export const PLAYER_H_COMPACT = 58;
export const PLAYER_TAB_X = 146;

export type PlayerPhase = 'hidden' | 'enter' | 'exit' | 'compact' | 'open' | 'pinned' | 'hover' | 'disabled';

export interface PlayerFrame {
  readonly phase: PlayerPhase;
  readonly h: number;
  readonly line: { readonly scale: number; readonly opacity: number; readonly fromRight: boolean; readonly spark: number | null } | null;
  readonly glass: number;
  readonly corners: number;
  readonly cornersIn: number;
  readonly content: number;
  readonly openContent: number;
  readonly compactContent: number;
  readonly hover: number;
  readonly pinned: number;
  readonly disabled: number;
  readonly header: string;
  readonly slash: number;
  readonly portraitReveal: number;
  readonly portraitFlash: number;
  readonly name: string;
  readonly levelIn: number;
  readonly levelHeat: number;
  readonly trackIn: number;
  /** The single XP value feeding both the bar and the figure. */
  readonly xp: number;
  readonly ratio: number;
  readonly heat: number;
  readonly xpTextIn: number;
  readonly gains: readonly { readonly key: number; readonly text: string; readonly opacity: number; readonly dy: number; readonly scale: number; readonly cool: number }[];
  readonly sheen: number | null;
  readonly glitch: number;
  readonly seed: number;
  readonly bloom: number;
}

/** Visual axes of a module state: [open, pinned, hover, disabled]. */
const stateAxes = (s: ModuleState): readonly number[] =>
  s === 'Compact' ? [0, 0, 0, 0] : s === 'Open' ? [1, 0, 0, 0] : s === 'Pinned' ? [1, 1, 0, 0] : s === 'Hover' ? [1, 0, 1, 0] : [1, 0, 0, 1];

const lastPulse = (input: PlayerInput, field: PlayerInput['pulses'][number]['field'], t: number) => {
  let at: number | null = null;
  for (const pulse of input.pulses) if (pulse.field === field && pulse.at <= t) at = pulse.at;
  return at;
};

export function evaluatePlayer(t: number, input: PlayerInput, k: MotionKnobs = DEFAULT_MOTION): PlayerFrame | null {
  const p = presence(t, input.enterAt, input.exitAt, k);
  if (!p) return null;
  const state = stateWeights(input.state, t, 'Open', stateAxes, k);
  const [open = 1, pinned = 0, hover = 0, disabled = 0] = state.visual;
  const h = p.height(PLAYER_H_COMPACT + (PLAYER_H_OPEN - PLAYER_H_COMPACT) * open);

  const calm = 1 - disabled;
  const idle = ambient(t, { ...k, ambient: k.ambient * calm });
  const xp = reactiveNumber(input.xp, t, 0, k);
  const introFill = p.reveal(900, 700);
  const introEase = 1 - (1 - introFill) ** 3;

  const namePulse = lastPulse(input, 'name', t);
  const levelPulse = lastPulse(input, 'level', t);
  const photoPulse = lastPulse(input, 'photo', t);
  const pulses = input.pulses.reduce((g, pulse) => Math.max(g, pulseGlitch(t, pulse.at, k)), 0);
  const photoStart = photoPulse ?? input.enterAt + 480 / k.speed;
  const photoL = (t - photoStart) * k.speed;
  const nameP = namePulse === null ? p.reveal(600, 360) : clamp01(((t - namePulse) * k.speed) / 360);

  const glitch = Math.max(p.glitch, xp.glitch, pulses, idle.glitch) * (1 - disabled * 0.8);
  const heat = introFill > 0 && introFill < 1 ? 1 : xp.heat;
  const value = xp.value * introEase;
  const content = p.content;

  let phase: PlayerPhase;
  if (p.phase !== 'shown') phase = p.phase;
  else phase = state.value.toLowerCase() as PlayerPhase;

  return {
    phase,
    h,
    line: p.line,
    glass: p.glass,
    corners: p.corners,
    cornersIn: p.cornersIn,
    content,
    openContent: content * clamp01((open - 0.45) / 0.55),
    compactContent: content * clamp01((0.55 - open) / 0.55),
    hover,
    pinned,
    disabled,
    header: decode('PLAYER', p.reveal(420, 260), t, 1),
    slash: p.reveal(400, 120),
    portraitReveal: clamp01(photoL / 200),
    portraitFlash: (1 - clamp01(photoL / 460)) ** 3,
    name: decode(input.record.name, idle.textFlicker ? 0.55 : nameP, t, 2),
    levelIn: p.reveal(720, 260),
    levelHeat: levelPulse === null ? 0 : 1 - clamp01(((t - levelPulse) * k.speed - 80) / 420),
    trackIn: p.reveal(780, 220),
    xp: value,
    ratio: clamp01(value / input.record.nextLevelXp),
    heat,
    xpTextIn: p.reveal(900, 200),
    gains: xp.changes.map(change => {
      const pop = popup(change.l);
      return { key: change.at, text: `${change.delta > 0 ? '+' : ''}${change.delta} XP`, ...pop };
    }),
    sheen: idle.sheen,
    glitch,
    seed: Math.floor(t / 45),
    bloom: Math.max(glitch, heat * 0.6, p.lineGlow, hover * 0.35),
  };
}
