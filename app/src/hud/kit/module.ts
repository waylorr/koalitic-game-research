import type { Track } from '../../core/tracks';
import { clamp01 } from './fx';
import { ambient, presence, pulseGlitch, stateWeights, type Ambient, type Presence } from './motion';
import type { MotionKnobs } from './theme';
import type { PanelState } from './pixi';

/**
 * HUD kit: the behaviour every rail module shares (Player Profile, Stamina,
 * Inventory…). Presence, the five workflow states, pulses and the ambient loop
 * are evaluated here once; a module only adds its own content on top.
 */
export type ModuleState = 'Compact' | 'Open' | 'Pinned' | 'Hover' | 'Disabled';
export const MODULE_STATES: readonly ModuleState[] = ['Compact', 'Open', 'Pinned', 'Hover', 'Disabled'];
export type ModulePhase = 'hidden' | 'enter' | 'exit' | 'compact' | 'open' | 'pinned' | 'hover' | 'disabled';

export interface ModuleInput {
  readonly enterAt: number;
  readonly exitAt: number | null;
  readonly state: Track<ModuleState>;
  /** Instants when a displayed value was replaced, so it reveals again with a glitch. */
  readonly pulses: readonly { readonly at: number }[];
}

export interface ModuleShell {
  readonly p: Presence;
  readonly phase: ModulePhase;
  readonly h: number;
  readonly open: number;
  readonly pinned: number;
  readonly hover: number;
  readonly disabled: number;
  readonly content: number;
  readonly openContent: number;
  readonly compactContent: number;
  readonly idle: Ambient;
  /** Glitch from presence, pulses and ambient, damped when disabled (add value reactions on top). */
  readonly glitch: number;
}

/** Visual axes of a module state: [open, pinned, hover, disabled]. */
export const stateAxes = (s: ModuleState): readonly number[] =>
  s === 'Compact' ? [0, 0, 0, 0] : s === 'Open' ? [1, 0, 0, 0] : s === 'Pinned' ? [1, 1, 0, 0] : s === 'Hover' ? [1, 0, 1, 0] : [1, 0, 0, 1];

export function moduleShell(t: number, input: ModuleInput, k: MotionKnobs, hOpen: number, hCompact: number, seed = 0): ModuleShell | null {
  const p = presence(t, input.enterAt, input.exitAt, k);
  if (!p) return null;
  const state = stateWeights(input.state, t, 'Open', stateAxes, k);
  const [open = 1, pinned = 0, hover = 0, disabled = 0] = state.visual;
  const idle = ambient(t, { ...k, ambient: k.ambient * (1 - disabled) }, seed);
  const pulses = input.pulses.reduce((g, pulse) => Math.max(g, pulseGlitch(t, pulse.at, k)), 0);
  return {
    p,
    phase: p.phase !== 'shown' ? p.phase : (state.value.toLowerCase() as ModulePhase),
    h: p.height(hCompact + (hOpen - hCompact) * open),
    open,
    pinned,
    hover,
    disabled,
    content: p.content,
    openContent: p.content * clamp01((open - 0.45) / 0.55),
    compactContent: p.content * clamp01((0.55 - open) / 0.55),
    idle,
    glitch: Math.max(p.glitch, pulses, idle.glitch) * (1 - disabled * 0.8),
  };
}

/** What the shared panel frame needs from a shell. */
export function panelOf(shell: ModuleShell, w: number, tabX: number, glitch: number): PanelState {
  return {
    w,
    h: shell.h,
    tabX,
    glass: shell.p.glass,
    glitch,
    sheen: shell.idle.sheen,
    corners: shell.p.corners,
    cornersIn: shell.p.cornersIn,
    line: shell.p.line,
    hover: shell.hover,
    pinned: shell.pinned,
    disabled: shell.disabled,
  };
}
