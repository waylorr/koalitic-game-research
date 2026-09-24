import { easeInOutCubic, easeOutCubic, phase as loopPhase } from '../../core/motion';
import { clamp01, decode, lerp, seg } from '../fx';

/**
 * PLAYER module (Left Rail, HUD v2 look, HUD v1 motion) as a pure function of time.
 * The script is what an episode decides: values and *when* things happen.
 * evaluatePlayer decides *how* the module looks at instant t; a renderer
 * (PixiJS, see PlayerPixi.ts) only draws the resulting frame.
 * Timings follow ENTREGA_CLAUDE/06_MOVIMIENTO_HUD.md.
 */
export interface PlayerScript {
  readonly name: string;
  readonly level: number;
  readonly baseXp: number;
  readonly nextLevelXp: number;
  readonly photo: string;
  readonly enterAt: number;
  readonly exitAt: number | null;
  readonly xpGains: readonly { at: number; amount: number }[];
  readonly folds: readonly { at: number; folded: boolean }[];
  /** Instants when a displayed value was changed, so it re-reveals (decode, flash). */
  readonly edits: readonly { at: number; field: 'name' | 'level' | 'photo' }[];
}

export const PLAYER_W = 360;
export const PLAYER_H_OPEN = 150;
export const PLAYER_H_FOLDED = 50;

export type PlayerPhase = 'hidden' | 'enter' | 'open' | 'folded' | 'exit';

export interface PlayerFrame {
  readonly phase: PlayerPhase;
  /** Panel height (px), line birth/burn-out, corners. */
  readonly h: number;
  readonly line: { readonly scale: number; readonly opacity: number; readonly y: number; readonly fromRight: boolean; readonly spark: number | null } | null;
  readonly glass: number;
  readonly corners: number;
  readonly cornersIn: number;
  /** Content visibility: all, open layout, folded layout. */
  readonly content: number;
  readonly openContent: number;
  readonly foldedContent: number;
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
  /** Effects: glitch strength 0..1 with its random seed, bloom boost, artifacts. */
  readonly glitch: number;
  readonly seed: number;
  readonly bloom: number;
}

function foldAmount(t: number, folds: PlayerScript['folds']): number {
  let f = 0;
  for (const change of folds) {
    if (change.at > t) break;
    f += ((change.folded ? 1 : 0) - f) * easeInOutCubic(seg(t, change.at, 380));
  }
  return f;
}

const lastEdit = (script: PlayerScript, field: PlayerScript['edits'][number]['field'], t: number) => {
  let at: number | null = null;
  for (const edit of script.edits) if (edit.field === field && edit.at <= t) at = edit.at;
  return at;
};

/** A quick rise and a slower fall: the shape of every glitch burst. */
const burst = (l: number, rise: number, fall: number) => (l < 0 ? 0 : l < rise ? l / rise : clamp01(1 - (l - rise) / fall));

export function evaluatePlayer(t: number, script: PlayerScript): PlayerFrame | null {
  const e = t - script.enterAt;
  const x = script.exitAt === null ? -1 : t - script.exitAt;
  if (e < 0 || x >= 620) return null;

  // Birth: line → bar → panel → corners.
  const lineP = easeOutCubic(seg(e, 0, 140));
  const barP = easeOutCubic(seg(e, 140, 160));
  const growP = easeOutCubic(seg(e, 300, 320));
  const cornersIn = easeOutCubic(seg(e, 560, 160));
  const fold = foldAmount(t, script.folds);
  const target = lerp(PLAYER_H_OPEN, PLAYER_H_FOLDED, fold);
  let h = e < 140 ? 2 : e < 300 ? lerp(2, 14, barP) : lerp(14, target, growP);

  // Exit: glitch burst, content and corners go, collapse to a line that burns out.
  const cornersOut = x >= 0 ? seg(x, 0, 100) : 0;
  const contentOut = x >= 0 ? seg(x, 60, 140) : 0;
  const shrinkP = x >= 0 ? easeInOutCubic(seg(x, 120, 240)) : 0;
  const lineOut = x >= 0 ? seg(x, 360, 260) : 0;
  h = lerp(h, 2, shrinkP);

  const burning = x >= 340;
  const line = e < 320 || burning
    ? {
        scale: burning ? 1 - easeInOutCubic(lineOut) : lineP,
        opacity: burning ? 1 - lineOut * 0.6 : 1 - seg(e, 260, 60),
        y: burning ? h / 2 - 1 : 0,
        fromRight: burning,
        spark: burning ? lerp(0.1, 0.9, lineOut) : null,
      }
    : null;

  const corners = cornersIn * (1 - cornersOut);
  const content = 1 - contentOut;

  // Content reveals in reading order; an edited value reveals again.
  const nameEdit = lastEdit(script, 'name', t);
  const levelEdit = lastEdit(script, 'level', t);
  const photoEdit = lastEdit(script, 'photo', t);
  const ambientGlitchText = loopPhase(t + 3100, 9000) < 0.014;
  const nameP = nameEdit === null ? seg(e, 600, 360) : seg(t, nameEdit, 360);
  const photoStart = photoEdit === null ? script.enterAt + 480 : photoEdit;
  const introFill = easeOutCubic(seg(e, 900, 700));

  let xp = script.baseXp * introFill;
  let heat = introFill > 0 && introFill < 1 ? 1 : 0;
  let glitch = 0;
  const gains = [];
  for (const gain of script.xpGains) {
    const l = t - gain.at;
    if (l < 0) continue;
    const p = seg(l, 150, 650);
    xp += gain.amount * easeOutCubic(p);
    heat = Math.max(heat, p < 1 ? (l < 150 ? 0 : 1) : Math.exp(-(l - 800) / 260));
    glitch = Math.max(glitch, 0.55 * burst(l, 40, 220));
    if (l < 1400) {
      const pop = easeOutCubic(seg(l, 0, 120));
      gains.push({
        key: gain.at,
        text: `${gain.amount >= 0 ? '+' : ''}${gain.amount} XP`,
        opacity: pop * (1 - seg(l, 1000, 400)),
        dy: -14 * easeOutCubic(seg(l, 300, 1100)),
        scale: lerp(1.35, 1, pop),
        cool: seg(l, 120, 330),
      });
    }
  }
  for (const edit of script.edits) glitch = Math.max(glitch, 0.45 * burst(t - edit.at, 30, 200));
  glitch = Math.max(glitch, burst(e - 250, 60, 420));
  if (x >= 0) glitch = Math.max(glitch, burst(x, 40, 300));
  if (loopPhase(t + 1700, 6000) < 0.016) glitch = Math.max(glitch, 0.3);

  const sheenP = loopPhase(t, 7000);
  const lineGlow = e < 320 ? 1 - seg(e, 200, 120) : 0;

  return {
    phase: x >= 0 ? 'exit' : e < 720 ? 'enter' : fold > 0.5 ? 'folded' : 'open',
    h,
    line,
    glass: e < 140 || burning ? 0 : 1,
    corners,
    cornersIn,
    content,
    openContent: content * (1 - clamp01(fold * 2.2)),
    foldedContent: content * clamp01((fold - 0.55) / 0.45),
    header: decode('PLAYER', seg(e, 420, 260), t, 1),
    slash: seg(e, 400, 120),
    portraitReveal: seg(t, photoStart, 200),
    portraitFlash: 1 - easeOutCubic(seg(t, photoStart, 460)),
    name: decode(script.name, ambientGlitchText ? 0.55 : nameP, t, 2),
    levelIn: easeOutCubic(seg(e, 720, 260)),
    levelHeat: levelEdit === null ? 0 : 1 - seg(t, levelEdit + 80, 420),
    trackIn: easeOutCubic(seg(e, 780, 220)),
    xp,
    ratio: clamp01(xp / script.nextLevelXp),
    heat,
    xpTextIn: seg(e, 900, 200),
    gains,
    sheen: sheenP < 0.16 ? sheenP / 0.16 : null,
    glitch,
    seed: Math.floor(t / 45),
    bloom: Math.max(glitch, heat * 0.6, lineGlow),
  };
}
