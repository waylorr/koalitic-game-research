import { easeOutCubic } from '../../core/motion';
import type { Track } from '../../core/tracks';
import { burst } from '../kit/motion';
import { clamp01, decode } from '../kit/fx';
import type { GearIcon } from '../kit/icons';
import { moduleShell, panelOf, type ModuleInput, type ModulePhase } from '../kit/module';
import type { PanelState } from '../kit/pixi';
import { DEFAULT_MOTION, type MotionKnobs } from '../kit/theme';

/**
 * GEAR RADIAL (Left Rail module). The kit's module shell gives presence,
 * layout, flags, pulses and ambient; this file adds the radial: slots from the
 * Data Library and a selection track. A new selection rotates the ring one
 * sector at a time ("pim, pim, pim"), with a ping on each step.
 */
export interface GearSlot {
  readonly name: string;
  readonly spec: string;
  readonly icon: GearIcon;
}

export interface GearInput extends ModuleInput {
  readonly slots: readonly GearSlot[];
  /** Selected slot index (0-based), one key per selection. */
  readonly selection: Track<number>;
}

export const GEAR_W = 360;
export const GEAR_H_OPEN = 340;
export const GEAR_H_COMPACT = 58;
export const GEAR_TAB_X = 110;
const STEP_MS = 170;

export interface GearFrame {
  readonly phase: ModulePhase;
  readonly panel: PanelState;
  readonly content: number;
  readonly openContent: number;
  readonly compactContent: number;
  readonly disabled: number;
  readonly hover: number;
  readonly header: string;
  /** Ring position in slots (fractional while rotating); selected slot sits at the top. */
  readonly pos: number;
  readonly selected: number;
  /** 1 right after each step lands, then fades: flash and ring ping. */
  readonly ping: number;
  readonly segmentsIn: readonly number[];
  readonly centerIn: number;
  readonly name: string;
  readonly spec: string;
  readonly counter: string;
  readonly glitch: number;
  readonly seed: number;
  readonly bloom: number;
}

const wrap = (x: number, n: number) => ((x % n) + n) % n;

/** Ring position at t: each new key walks the shortest way, one sector per step. */
export function ringPosition(track: Track<number>, t: number, n: number, stepMs: number) {
  if (track.length === 0 || t < track[0]!.t) return { pos: track[0]?.v ?? 0, lastStep: -Infinity };
  let pos = track[0]!.v;
  let lastStep = -Infinity;
  for (let i = 1; i < track.length; i++) {
    const key = track[i]!;
    if (key.t > t) break;
    const next = track[i + 1];
    const until = next && next.t <= t ? next.t : t;
    const start = pos;
    let d = wrap(key.v - start, n);
    if (d > n / 2) d -= n;
    const steps = Math.abs(d);
    const dir = Math.sign(d);
    const u = (until - key.t) / stepMs;
    if (u >= steps) {
      pos = start + d;
      if (steps > 0) lastStep = Math.max(lastStep, key.t + steps * stepMs);
    } else {
      const whole = Math.floor(u);
      pos = start + dir * Math.min(steps, whole + easeOutCubic(u - whole));
      if (whole >= 1) lastStep = Math.max(lastStep, key.t + whole * stepMs);
    }
  }
  return { pos, lastStep };
}

export function evaluateGear(t: number, input: GearInput, k: MotionKnobs = DEFAULT_MOTION): GearFrame | null {
  const shell = moduleShell(t, input, k, GEAR_H_OPEN, GEAR_H_COMPACT, 5);
  if (!shell) return null;
  const { p } = shell;
  const n = Math.max(1, input.slots.length);
  const ring = ringPosition(input.selection, t, n, STEP_MS / k.speed);
  const selected = wrap(Math.round(ring.pos), n);
  const sinceStep = (t - ring.lastStep) * k.speed;
  const ping = Number.isFinite(sinceStep) && sinceStep >= 0 ? Math.exp(-sinceStep / 220) : 0;
  const slot = input.slots[selected];
  const stepGlitch = Number.isFinite(sinceStep) ? 0.28 * burst(sinceStep, 20, 140) : 0;
  const glitch = Math.max(shell.glitch, stepGlitch * (1 - shell.disabled * 0.8));
  const nameP = p.reveal(760, 300);
  return {
    phase: shell.phase,
    panel: panelOf(shell, GEAR_W, GEAR_TAB_X, glitch),
    content: shell.content,
    openContent: shell.openContent,
    compactContent: shell.compactContent,
    disabled: shell.disabled,
    hover: shell.hover,
    header: decode('GEAR', p.reveal(420, 220), t, 8),
    pos: ring.pos,
    selected,
    ping,
    segmentsIn: input.slots.map((_, i) => easeOutCubic(p.reveal(480 + i * 70, 220))),
    centerIn: easeOutCubic(p.reveal(440, 260)),
    name: decode(slot?.name ?? '', ping > 0.6 ? clamp01(1 - (ping - 0.6) * 2.5) : shell.idle.textFlicker ? 0.6 : nameP, t, 9 + selected),
    spec: slot?.spec ?? '',
    counter: `${String(selected + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`,
    glitch,
    seed: Math.floor(t / 45) + 11,
    bloom: Math.max(glitch, ping * 0.7, p.lineGlow, shell.hover * 0.35),
  };
}
