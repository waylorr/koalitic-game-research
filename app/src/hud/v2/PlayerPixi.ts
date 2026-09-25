import { Container, Graphics, type Text, type Texture } from 'pixi.js';
import { Effects, PanelFrame, Portrait, drawArtifacts, drawBar, label, mix } from '../kit/pixi';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from '../kit/theme';
import { PLAYER_H_OPEN, PLAYER_TAB_X, PLAYER_W, type PlayerFrame, type PlayerInput } from './player';

/**
 * Draws a PlayerFrame with the kit pieces. No timing logic here: every
 * property comes from the frame, so the same instant draws the same picture.
 * Layouts: OPEN (portrait, name, level, XP bar) and COMPACT (name, level, slim bar).
 */
const TRACK = { x: 128, y: 102, w: 214, h: 7 };

export class PlayerPixi {
  readonly root = new Container();
  private readonly panel: PanelFrame;
  private readonly fx = new Container();
  private readonly effects: Effects;
  private readonly content = new Container();
  private readonly contentMask = new Graphics();
  private readonly headerSlash = new Graphics();
  private readonly header: Text;
  private readonly open = new Container();
  private readonly portrait = new Portrait({ x: 14, y: 28, w: 96, h: 108 });
  private readonly name: Text;
  private readonly levelLabel: Text;
  private readonly levelValue: Text;
  private readonly emblem = new Graphics();
  private readonly bar = new Graphics();
  private readonly xpText: Text;
  private readonly gains: Text[] = [];
  private readonly compact = new Container();
  private readonly compactName: Text;
  private readonly compactLevel: Text;
  private readonly compactBar = new Graphics();
  private readonly artifacts = new Graphics();

  constructor(private readonly theme: Theme = THEME, { backdropBlur = true } = {}) {
    const { color } = theme;
    this.panel = new PanelFrame(theme, { backdropBlur });
    this.header = label(theme, '', 15, '700', color.red, 2.7, 26, 3, color.red);
    this.name = label(theme, '', 25, '600', color.text, 1.5, 128, 30);
    this.levelLabel = label(theme, 'LEVEL', 15, '600', color.dim, 2.1, 128, 70);
    this.levelValue = label(theme, '', 22, '700', color.white, 0.4, 186, 64);
    this.xpText = label(theme, '', 13, '600', color.dim, 1.3, 128, 114);
    this.compactName = label(theme, '', 18, '600', color.text, 1.4, 14, 22);
    this.compactLevel = label(theme, '', 18, '700', color.white, 1.2, 0, 22);

    this.emblem.poly([12, 1, 23, 21, 1, 21]).stroke({ width: 1.4, color: color.dim }).poly([12, 7, 18, 18, 6, 18]).stroke({ width: 1.4, color: color.dim });
    this.emblem.position.set(PLAYER_W - 42, 34);
    this.open.addChild(this.portrait.root, this.name, this.levelLabel, this.levelValue, this.emblem, this.bar, this.xpText);
    for (let i = 0; i < 3; i++) {
      const gain = label(theme, '', 20, '700', color.white, 0.8, 262, 66);
      this.gains.push(gain);
      this.open.addChild(gain);
    }
    this.compact.addChild(this.compactName, this.compactLevel, this.compactBar);
    this.content.mask = this.contentMask;
    this.content.addChild(this.headerSlash, this.header, this.open, this.compact);
    this.fx.addChild(this.panel.front, this.contentMask, this.content, this.artifacts);
    this.root.addChild(this.panel.back, this.fx);
    this.effects = new Effects(this.fx);
    this.effects.setArea(PLAYER_W, PLAYER_H_OPEN);
  }

  setPlacement(x: number, y: number, scale: number) {
    this.root.position.set(x, y);
    this.root.scale.set(scale);
  }

  get photo() {
    return this.portrait.photo;
  }
  setPhoto(url: string, texture: Texture) {
    this.portrait.setPhoto(url, texture);
  }

  update(frame: PlayerFrame | null, input: PlayerInput, k: MotionKnobs = DEFAULT_MOTION) {
    this.root.visible = frame !== null;
    if (!frame) return;
    const { color } = this.theme;
    const { h, disabled } = frame;
    const record = input.record;
    this.root.tint = mix(0xffffff, 0x9aa4ae, disabled);

    this.panel.update({ w: PLAYER_W, h, tabX: PLAYER_TAB_X, glass: frame.glass, glitch: frame.glitch, sheen: frame.sheen, corners: frame.corners, cornersIn: frame.cornersIn, line: frame.line, hover: frame.hover, pinned: frame.pinned, disabled });

    this.contentMask.clear().rect(-2, -2, PLAYER_W + 4, h + 2).fill({ color: 0xffffff });
    this.content.alpha = frame.content * (1 - 0.45 * disabled);
    const accent = mix(color.red, color.disabled, disabled);
    this.headerSlash.clear();
    if (frame.slash > 0) this.headerSlash.poly([14, 19, 17, 19 - 14 * frame.slash, 21, 19 - 14 * frame.slash, 18, 19]).fill({ color: accent });
    this.header.text = frame.header;
    this.header.tint = mix(0xffffff, color.disabled, disabled);

    // OPEN layout.
    this.open.alpha = frame.openContent;
    this.open.visible = frame.openContent > 0.001;
    this.portrait.update(frame.portraitReveal, frame.portraitFlash, mix(color.cyan, color.disabled, disabled));
    this.name.text = frame.name;
    this.levelLabel.alpha = frame.levelIn;
    this.levelLabel.x = 128 - 10 * (1 - frame.levelIn);
    this.levelValue.text = String(record.level);
    this.levelValue.alpha = frame.levelIn;
    this.levelValue.x = 186 - 10 * (1 - frame.levelIn);
    this.levelValue.tint = mix(color.green, color.white, frame.levelHeat);
    this.emblem.alpha = frame.levelIn * 0.85;
    this.bar.clear();
    if (frame.trackIn > 0) drawBar(this.bar, this.theme, TRACK.x, TRACK.y, TRACK.w, TRACK.h, frame.ratio, frame.trackIn, frame.heat, { from: 0x178a4a, to: color.green });
    this.xpText.text = `${Math.round(frame.xp).toLocaleString('en-US')} / ${record.nextLevelXp.toLocaleString('en-US')} XP`;
    this.xpText.alpha = frame.xpTextIn;
    this.gains.forEach((node, i) => {
      const gain = frame.gains[i];
      node.visible = !!gain;
      if (!gain) return;
      node.text = gain.text;
      node.alpha = gain.opacity;
      node.y = 66 + gain.dy;
      node.scale.set(gain.scale);
      node.tint = mix(color.white, color.green, gain.cool);
    });

    // COMPACT layout: name and level on one row, slim XP bar under it.
    this.compact.alpha = frame.compactContent;
    this.compact.visible = frame.compactContent > 0.001;
    this.compactName.text = frame.name;
    this.compactLevel.text = `LVL ${record.level}`;
    this.compactLevel.x = PLAYER_W - 16 - this.compactLevel.width;
    this.compactLevel.tint = mix(color.green, color.white, frame.levelHeat);
    this.compactBar.clear();
    drawBar(this.compactBar, this.theme, 14, 46, PLAYER_W - 28, 4, frame.ratio, 1, frame.heat, { from: 0x178a4a, to: color.green });

    drawArtifacts(this.artifacts, this.theme, frame.seed, frame.glitch, PLAYER_W, h, k);
    this.effects.apply(frame.glitch, frame.seed, frame.bloom, k);
  }
}
