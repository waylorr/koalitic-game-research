import { Container, Graphics, type Texture } from 'pixi.js';
import { phase } from '../../core/motion';
import { Effects, PanelFrame, Portrait, drawArtifacts, drawBar, type PanelState } from './pixi';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from './theme';

/**
 * PIECES board: every kit piece at rest, side by side, so the look of the
 * pieces can be checked (and re-checked after a theme change) in one place.
 * Loops (sheen, glitch, birth line) run from t, like everything else.
 */
export const BOARD_LAYOUT = [
  { id: 'frame', label: 'PANEL FRAME', x: 20, y: 34 },
  { id: 'hover', label: 'FRAME · HOVER', x: 196, y: 34 },
  { id: 'pinned', label: 'FRAME · PINNED', x: 372, y: 34 },
  { id: 'disabled', label: 'FRAME · DISABLED', x: 548, y: 34 },
  { id: 'xp', label: 'BAR · XP', x: 20, y: 146 },
  { id: 'stamina', label: 'BAR · STAMINA', x: 260, y: 146 },
  { id: 'heat', label: 'BAR · HOT HEAD', x: 500, y: 146 },
  { id: 'portrait', label: 'PORTRAIT', x: 20, y: 208 },
  { id: 'glitch', label: 'GLITCH + ARTIFACTS', x: 196, y: 208 },
  { id: 'line', label: 'BIRTH LINE', x: 460, y: 208 },
] as const;

const FRAME = { w: 150, h: 70 };

export class PiecesBoard {
  readonly root = new Container();
  private readonly frames: PanelFrame[] = [];
  private readonly bars = new Graphics();
  private readonly portrait = new Portrait({ x: 20, y: 214, w: 72, h: 78 });
  private readonly glitchPanel: PanelFrame;
  private readonly glitchLayer = new Container();
  private readonly artifacts = new Graphics();
  private readonly effects: Effects;
  private readonly linePanel: PanelFrame;

  constructor(private readonly theme: Theme = THEME) {
    for (let i = 0; i < 4; i++) {
      const frame = new PanelFrame(theme, { backdropBlur: true });
      frame.back.position.set(BOARD_LAYOUT[i]!.x, BOARD_LAYOUT[i]!.y + 4);
      frame.front.position.copyFrom(frame.back.position);
      this.frames.push(frame);
      this.root.addChild(frame.back, frame.front);
    }
    this.glitchPanel = new PanelFrame(theme, { backdropBlur: true });
    this.glitchLayer.position.set(212, 214);
    this.glitchLayer.addChild(this.glitchPanel.front, this.artifacts);
    this.glitchPanel.back.position.copyFrom(this.glitchLayer.position);
    this.effects = new Effects(this.glitchLayer);
    this.effects.setArea(FRAME.w, FRAME.h);
    this.linePanel = new PanelFrame(theme, { backdropBlur: false });
    this.linePanel.front.position.set(470, 240);
    this.root.addChild(this.bars, this.portrait.root, this.glitchPanel.back, this.glitchLayer, this.linePanel.front);
  }

  get photo() {
    return this.portrait.photo;
  }
  setPhoto(url: string, texture: Texture) {
    this.portrait.setPhoto(url, texture);
  }

  update(t: number, k: MotionKnobs = DEFAULT_MOTION) {
    const sheenP = phase(t, 3500 / Math.max(0.2, k.ambient || 0.2));
    const base: PanelState = { w: FRAME.w, h: FRAME.h, tabX: 60, glass: 1, glitch: 0, sheen: sheenP < 0.3 && k.ambient > 0 ? sheenP / 0.3 : null, corners: 1, cornersIn: 1, line: null, hover: 0, pinned: 0, disabled: 0 };
    this.frames[0]!.update(base);
    this.frames[1]!.update({ ...base, hover: 1 });
    this.frames[2]!.update({ ...base, pinned: 1 });
    this.frames[3]!.update({ ...base, disabled: 1, sheen: null });

    const { bars } = this.theme;
    const g = this.bars.clear();
    const fill = 0.5 + 0.3 * Math.sin(t / 900);
    drawBar(g, this.theme, 20, 170, 220, 8, 0.65, 1, 0, bars.xp);
    drawBar(g, this.theme, 260, 170, 220, 8, 0.72, 1, 0, bars.stamina);
    drawBar(g, this.theme, 500, 170, 200, 8, fill, 1, 1, bars.xp);
    this.portrait.update(1, 0, this.theme.color.cyan);

    // Glitch sample: bursts every 1.6 s.
    const l = t % 1600;
    const glitch = l < 60 ? l / 60 : Math.max(0, 1 - (l - 60) / 500);
    const seed = Math.floor(t / 45);
    this.glitchPanel.update({ ...base, w: 200, glitch });
    drawArtifacts(this.artifacts, this.theme, seed, glitch, 200, FRAME.h, k);
    this.effects.apply(glitch, seed, glitch, k);

    // Birth line: grows, holds, burns out.
    const lp = phase(t, 2000);
    const scale = lp < 0.3 ? lp / 0.3 : lp < 0.7 ? 1 : 1 - (lp - 0.7) / 0.3;
    this.linePanel.update({ ...base, w: 220, h: 4, glass: 0, corners: 0, line: { scale, opacity: 1, fromRight: lp >= 0.7, spark: lp >= 0.7 ? (lp - 0.7) / 0.3 : null } });
  }
}
