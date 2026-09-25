import type { Track } from '../../core/tracks';
import { clamp01, decode } from '../kit/fx';
import { moduleShell, panelOf, type ModuleInput, type ModulePhase } from '../kit/module';
import { popup, reactiveNumber } from '../kit/motion';
import type { PanelState } from '../kit/pixi';
import { DEFAULT_MOTION, type MotionKnobs } from '../kit/theme';

export { MODULE_LAYOUTS, type ModuleLayout } from '../kit/module';

/**
 * PLAYER PROFILE (Left Rail module). Presence, states, pulses and ambient come
 * from the kit's module shell; this file only adds the player's content:
 * portrait, name, level and the XP value with its reaction.
 */
export interface PlayerRecordView {
  readonly name: string;
  readonly level: number;
  readonly nextLevelXp: number;
  readonly photo: string;
}

export interface PlayerInput extends ModuleInput {
  readonly record: PlayerRecordView;
  /** XP keys: the value jumps on each key and the module animates the jump. */
  readonly xp: Track<number>;
  readonly pulses: readonly { readonly at: number; readonly field: 'name' | 'level' | 'photo' }[];
}

export const PLAYER_W = 360;
export const PLAYER_H_OPEN = 150;
export const PLAYER_H_COMPACT = 58;
export const PLAYER_TAB_X = 146;

export interface PlayerFrame {
  readonly phase: ModulePhase;
  readonly panel: PanelState;
  readonly content: number;
  readonly openContent: number;
  readonly compactContent: number;
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
  readonly glitch: number;
  readonly seed: number;
  readonly bloom: number;
}

const lastPulse = (input: PlayerInput, field: PlayerInput['pulses'][number]['field'], t: number) => {
  let at: number | null = null;
  for (const pulse of input.pulses) if (pulse.field === field && pulse.at <= t) at = pulse.at;
  return at;
};

export function evaluatePlayer(t: number, input: PlayerInput, k: MotionKnobs = DEFAULT_MOTION): PlayerFrame | null {
  const shell = moduleShell(t, input, k, PLAYER_H_OPEN, PLAYER_H_COMPACT);
  if (!shell) return null;
  const { p } = shell;
  const xp = reactiveNumber(input.xp, t, 0, k);
  const introFill = p.reveal(900, 700);
  const introEase = 1 - (1 - introFill) ** 3;

  const namePulse = lastPulse(input, 'name', t);
  const levelPulse = lastPulse(input, 'level', t);
  const photoPulse = lastPulse(input, 'photo', t);
  const photoL = (t - (photoPulse ?? input.enterAt + 480 / k.speed)) * k.speed;
  const nameP = namePulse === null ? p.reveal(600, 360) : clamp01(((t - namePulse) * k.speed) / 360);

  const glitch = Math.max(shell.glitch, xp.glitch * (1 - shell.disabled * 0.8));
  const heat = introFill > 0 && introFill < 1 ? 1 : xp.heat;
  const value = xp.value * introEase;

  return {
    phase: shell.phase,
    panel: panelOf(shell, PLAYER_W, PLAYER_TAB_X, glitch),
    content: shell.content,
    openContent: shell.openContent,
    compactContent: shell.compactContent,
    disabled: shell.disabled,
    header: decode('PLAYER', p.reveal(420, 260), t, 1),
    slash: p.reveal(400, 120),
    portraitReveal: clamp01(photoL / 200),
    portraitFlash: (1 - clamp01(photoL / 460)) ** 3,
    name: decode(input.record.name, shell.idle.textFlicker ? 0.55 : nameP, t, 2),
    levelIn: p.reveal(720, 260),
    levelHeat: levelPulse === null ? 0 : 1 - clamp01(((t - levelPulse) * k.speed - 80) / 420),
    trackIn: p.reveal(780, 220),
    xp: value,
    ratio: clamp01(value / input.record.nextLevelXp),
    heat,
    xpTextIn: p.reveal(900, 200),
    gains: xp.changes.map(change => ({ key: change.at, text: `${change.delta > 0 ? '+' : ''}${change.delta} XP`, ...popup(change.l) })),
    glitch,
    seed: Math.floor(t / 45),
    bloom: Math.max(glitch, heat * 0.6, p.lineGlow, shell.hover * 0.35),
  };
}
