/**
 * HUD kit, layer 1 and the knobs of layer 2 (see ENTREGA_CLAUDE/07_FRAMEWORK_HUD.md).
 * THEME is the look every HUD element shares; MotionKnobs scale the shared motion.
 * Components read these instead of hard-coding values, so a HUD Template can
 * restyle or retime every element at once.
 */
export interface Theme {
  readonly color: {
    readonly red: number;
    readonly cyan: number;
    readonly text: number;
    readonly dim: number;
    readonly edge: number;
    readonly white: number;
    readonly glass: number;
    readonly disabled: number;
  };
  /** Value bars: dark end → bright end of the fill. XP is green, Stamina amber. */
  readonly bars: {
    readonly xp: { readonly from: number; readonly to: number };
    readonly stamina: { readonly from: number; readonly to: number };
  };
  readonly font: string;
  /** Frame stroke and accent stroke widths (px). */
  readonly line: number;
  readonly accent: number;
  readonly glassAlpha: number;
  /** Size of the cut corner and of the header tab step (px). */
  readonly cut: number;
  readonly tab: number;
}

export const THEME: Theme = {
  color: {
    red: 0xff2d46,
    cyan: 0x54e4ff,
    text: 0xeef6ff,
    dim: 0x8fa6b8,
    edge: 0x9cc4e2,
    white: 0xffffff,
    glass: 0x0a1220,
    disabled: 0x7d8792,
  },
  bars: {
    xp: { from: 0x178a4a, to: 0x58ff8e },
    stamina: { from: 0x9a6a00, to: 0xffc331 },
  },
  font: 'Rajdhani',
  line: 1.2,
  accent: 2.6,
  glassAlpha: 0.74,
  cut: 12,
  tab: 14,
};

export interface MotionKnobs {
  /** 1 = measured v1 timings; 2 = twice as fast. */
  readonly speed: number;
  /** Multipliers for glitch strength, artifact count and bloom; 0 turns an effect off. */
  readonly glitch: number;
  readonly artifacts: number;
  readonly bloom: number;
  /** Ambient loop (sheen, micro-glitch, text flicker); 0 = calm. */
  readonly ambient: number;
}

export const DEFAULT_MOTION: MotionKnobs = { speed: 1, glitch: 1, artifacts: 1, bloom: 1, ambient: 1 };
