import { Container, Graphics, type Text } from 'pixi.js';
import type { Track } from '../../core/tracks';
import { clamp01, decode } from './fx';
import { moduleShell, panelOf, type ModuleInput, type ModulePhase } from './module';
import { popup, reactiveNumber } from './motion';
import { Effects, PanelFrame, drawArtifacts, drawBar, label, mix, type PanelState } from './pixi';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from './theme';

/**
 * KIT SAMPLE: a panel built only from kit parts (module shell, reactive value,
 * panel frame, bar, effects). It is how the kit is shown and tested in the
 * catalog, and the template a new rail module (e.g. Stamina) starts from.
 */
export interface SampleInput extends ModuleInput {
  readonly title: string;
  /** 0..100, amber bar from the theme (bars.stamina). */
  readonly value: Track<number>;
}

export const SAMPLE_W = 300;
const H_OPEN = 104;
const H_COMPACT = 50;
const TAB_X = 138;

export interface SampleFrame {
  readonly phase: ModulePhase;
  readonly panel: PanelState;
  readonly content: number;
  readonly openContent: number;
  readonly compactContent: number;
  readonly disabled: number;
  readonly header: string;
  readonly value: number;
  readonly heat: number;
  readonly trackIn: number;
  readonly gains: readonly { readonly key: number; readonly text: string; readonly opacity: number; readonly dy: number; readonly scale: number; readonly cool: number }[];
  readonly glitch: number;
  readonly seed: number;
  readonly bloom: number;
}

export function evaluateSample(t: number, input: SampleInput, k: MotionKnobs = DEFAULT_MOTION): SampleFrame | null {
  const shell = moduleShell(t, input, k, H_OPEN, H_COMPACT, 3);
  if (!shell) return null;
  const { p } = shell;
  const reactive = reactiveNumber(input.value, t, 0, k);
  const intro = p.reveal(700, 600);
  const glitch = Math.max(shell.glitch, reactive.glitch * (1 - shell.disabled * 0.8));
  const heat = intro > 0 && intro < 1 ? 1 : reactive.heat;
  const value = reactive.value * (1 - (1 - intro) ** 3);
  return {
    phase: shell.phase,
    panel: panelOf(shell, SAMPLE_W, TAB_X, glitch),
    content: shell.content,
    openContent: shell.openContent,
    compactContent: shell.compactContent,
    disabled: shell.disabled,
    header: decode(input.title, p.reveal(420, 260), t, 5),
    value,
    heat,
    trackIn: p.reveal(600, 220),
    gains: reactive.changes.map(change => ({ key: change.at, text: `${change.delta > 0 ? '+' : ''}${change.delta}%`, ...popup(change.l) })),
    glitch,
    seed: Math.floor(t / 45) + 7,
    bloom: Math.max(glitch, heat * 0.6, p.lineGlow, shell.hover * 0.35),
  };
}

export class SamplePixi {
  readonly root = new Container();
  private readonly panel: PanelFrame;
  private readonly fx = new Container();
  private readonly effects: Effects;
  private readonly content = new Container();
  private readonly mask = new Graphics();
  private readonly slash = new Graphics();
  private readonly header: Text;
  private readonly big: Text;
  private readonly bar = new Graphics();
  private readonly gain: Text;
  private readonly compactValue: Text;
  private readonly compactBar = new Graphics();
  private readonly artifacts = new Graphics();

  constructor(private readonly theme: Theme = THEME) {
    const { color } = theme;
    this.panel = new PanelFrame(theme, { backdropBlur: true });
    this.header = label(theme, '', 15, '700', color.red, 2.7, 26, 3, color.red);
    this.big = label(theme, '', 34, '700', color.white, 0.5, 16, 26);
    this.gain = label(theme, '', 18, '700', color.white, 0.6, 150, 36);
    this.compactValue = label(theme, '', 16, '700', color.white, 1, 0, 3);
    this.content.mask = this.mask;
    this.content.addChild(this.slash, this.header, this.big, this.bar, this.gain, this.compactValue, this.compactBar);
    this.fx.addChild(this.panel.front, this.mask, this.content, this.artifacts);
    this.root.addChild(this.panel.back, this.fx);
    this.effects = new Effects(this.fx);
    this.effects.setArea(SAMPLE_W, H_OPEN);
  }

  setPlacement(x: number, y: number, scale: number) {
    this.root.position.set(x, y);
    this.root.scale.set(scale);
  }

  update(frame: SampleFrame | null, _input: SampleInput, k: MotionKnobs = DEFAULT_MOTION) {
    this.root.visible = frame !== null;
    if (!frame) return;
    const { color, bars } = this.theme;
    const h = frame.panel.h;
    this.root.tint = mix(0xffffff, 0x9aa4ae, frame.disabled);
    this.panel.update(frame.panel);
    this.mask.clear().rect(-2, -2, SAMPLE_W + 4, h + 2).fill({ color: 0xffffff });
    this.content.alpha = frame.content * (1 - 0.45 * frame.disabled);
    this.slash.clear().poly([14, 19, 17, 5, 21, 5, 18, 19]).fill({ color: mix(color.red, color.disabled, frame.disabled) });
    this.header.text = frame.header;

    const shown = `${Math.round(frame.value)}%`;
    this.big.text = shown;
    this.big.alpha = frame.openContent;
    this.big.tint = mix(bars.stamina.to, color.white, frame.heat * 0.6);
    this.bar.clear();
    this.bar.alpha = frame.openContent;
    if (frame.trackIn > 0) drawBar(this.bar, this.theme, 16, 78, SAMPLE_W - 32, 8, clamp01(frame.value / 100), frame.trackIn, frame.heat, bars.stamina);
    const gain = frame.gains.at(-1);
    this.gain.visible = !!gain && frame.openContent > 0.01;
    if (gain) {
      this.gain.text = gain.text;
      this.gain.alpha = gain.opacity * frame.openContent;
      this.gain.y = 36 + gain.dy;
      this.gain.scale.set(gain.scale);
      this.gain.tint = mix(color.white, bars.stamina.to, gain.cool);
    }
    this.compactValue.text = shown;
    this.compactValue.x = SAMPLE_W - 16 - this.compactValue.width;
    this.compactValue.alpha = frame.compactContent;
    this.compactBar.clear();
    this.compactBar.alpha = frame.compactContent;
    drawBar(this.compactBar, this.theme, 14, 36, SAMPLE_W - 28, 4, clamp01(frame.value / 100), 1, frame.heat, bars.stamina);

    drawArtifacts(this.artifacts, this.theme, frame.seed, frame.glitch, SAMPLE_W, h, k);
    this.effects.apply(frame.glitch, frame.seed, frame.bloom, k);
  }
}
