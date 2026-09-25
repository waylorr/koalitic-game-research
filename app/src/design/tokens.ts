/**
 * KOALITIC design tokens: the ONE source of the look, shared by the app's own
 * interface (SYSTEM UI, CSS) and the HUD (PixiJS). The catalog's THEME page
 * edits these; `cssVariables` turns them into the CSS custom properties the
 * menus read, and the HUD receives the same object as its THEME.
 * A HUD Template will store them (see ENTREGA_CLAUDE/08_WORKFLOW_UI_Y_ASSETS.md §6).
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
    cyan: 0x3fd6ff,
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

const rgb = (n: number) => `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** CSS custom properties for SYSTEM UI, derived from the tokens (defaults live in ui/tokens.css). */
export function cssVariables(theme: Theme): Record<string, string> {
  const { color } = theme;
  return {
    '--kg-red': hex(color.red),
    '--kg-red-soft': `rgba(${rgb(color.red)}, 0.55)`,
    '--kg-cyan': hex(color.cyan),
    '--kg-cyan-soft': `rgba(${rgb(color.cyan)}, 0.45)`,
    '--kg-ink': hex(color.text),
    '--kg-ink-dim': hex(color.dim),
    '--kg-off': hex(color.disabled),
    '--kg-glass-rgb': rgb(color.glass),
    '--kg-glass-alpha': String(theme.glassAlpha),
    '--kg-line': String(theme.line / 1.2),
  };
}

/** Writes the tokens onto the document so every menu and screen picks them up at once. */
export function applyCssVariables(theme: Theme, target: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(cssVariables(theme))) target.style.setProperty(name, value);
}
