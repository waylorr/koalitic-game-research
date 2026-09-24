import { Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { AdvancedBloomFilter, BackdropBlurFilter, GlitchFilter } from 'pixi-filters';
import { hash, lerp, withSeed } from '../fx';
import { PLAYER_H_OPEN, PLAYER_W, type PlayerFrame, type PlayerScript } from './player';

/**
 * Draws a PlayerFrame with PixiJS. Holds no timing logic: every property is
 * set from the frame, so the same instant always draws the same picture.
 * Glass sits under the effects; frame, content and artifacts go through
 * glitch (slices + RGB split) and bloom.
 */
const C = { red: 0xff2d46, cyan: 0x54e4ff, green: 0x58ff8e, text: 0xeef6ff, dim: 0x8fa6b8, edge: 0x9cc4e2, white: 0xffffff };
const TAB_X = 146;
const PORTRAIT = { x: 14, y: 28, w: 96, h: 108 };
const TRACK = { x: 128, y: 102, w: 214, h: 7 };

const style = (size: number, weight: '500' | '600' | '700', fill: number, letterSpacing: number, glow?: number) =>
  new TextStyle({
    fontFamily: 'Rajdhani',
    fontSize: size,
    fontWeight: weight,
    fill,
    letterSpacing,
    dropShadow: glow === undefined ? false : { color: glow, alpha: 0.7, blur: 6, distance: 0, angle: 0 },
  });

function shape(h: number): number[] {
  const tab = Math.min(14, h * 0.45);
  const cut = Math.min(12, h * 0.4);
  return [0, 0, TAB_X, 0, TAB_X + tab, tab, PLAYER_W, tab, PLAYER_W, h - cut, PLAYER_W - cut, h, 0, h];
}

const mix = (a: number, b: number, p: number) => {
  const ch = (shift: number) => Math.round(lerp((a >> shift) & 255, (b >> shift) & 255, p));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

function text(value: string, textStyle: TextStyle, x: number, y: number): Text {
  const node = new Text({ text: value, style: textStyle, resolution: 3 });
  node.position.set(x, y);
  return node;
}

export class PlayerPixi {
  /** Place and scale this container in the host stage. */
  readonly root = new Container();
  private readonly glass = new Graphics();
  private readonly sheen = new Graphics();
  private readonly sheenMask = new Graphics();
  private readonly fx = new Container();
  private readonly frameLines = new Graphics();
  private readonly corners = new Graphics();
  private readonly line = new Graphics();
  private readonly content = new Container();
  private readonly contentMask = new Graphics();
  private readonly headerSlash = new Graphics();
  private readonly header = text('', style(15, '700', C.red, 2.7, C.red), 26, 3);
  private readonly open = new Container();
  private readonly portrait = new Sprite(Texture.EMPTY);
  private readonly portraitMask = new Graphics();
  private readonly portraitFlash = new Graphics();
  private readonly portraitBrackets = new Graphics();
  private readonly name = text('', style(25, '600', C.text, 1.5), 128, 30);
  private readonly levelLabel = text('LEVEL', style(15, '600', C.dim, 2.1), 128, 70);
  private readonly levelValue = text('', style(22, '700', C.white, 0.4), 186, 64);
  private readonly emblem = new Graphics();
  private readonly bar = new Graphics();
  private readonly xpText = text('', style(13, '600', C.dim, 1.3), 128, 114);
  private readonly gains: Text[] = [];
  private readonly folded = new Container();
  private readonly foldedLevel = text('', style(15, '600', C.dim, 2), 0, 3);
  private readonly foldedBar = new Graphics();
  private readonly artifacts = new Graphics();
  private readonly glitchFilter = new GlitchFilter({ slices: 10, offset: 0, fillMode: 0, average: false, minSize: 4, sampleSize: 256, seed: 0 });
  private readonly bloomFilter = new AdvancedBloomFilter({ threshold: 0.42, bloomScale: 0.8, brightness: 1, blur: 5, quality: 6 });
  private glitchSeed = -1;
  private photoUrl = '';

  constructor({ backdropBlur }: { backdropBlur: boolean }) {
    if (backdropBlur) this.glass.filters = [new BackdropBlurFilter({ strength: 7, quality: 3 })];
    this.sheen.mask = this.sheenMask;
    this.root.addChild(this.glass, this.sheenMask, this.sheen, this.fx);

    this.portrait.mask = this.portraitMask;
    this.portraitFlash.blendMode = 'add';
    this.emblem.poly([12, 1, 23, 21, 1, 21]).stroke({ width: 1.4, color: C.dim }).poly([12, 7, 18, 18, 6, 18]).stroke({ width: 1.4, color: C.dim });
    this.emblem.position.set(PLAYER_W - 42, 34);
    this.open.addChild(this.portrait, this.portraitMask, this.portraitFlash, this.portraitBrackets, this.name, this.levelLabel, this.levelValue, this.emblem, this.bar, this.xpText);
    for (let i = 0; i < 3; i++) {
      const gain = text('', style(20, '700', C.white, 0.8), 262, 66);
      this.gains.push(gain);
      this.open.addChild(gain);
    }
    this.folded.addChild(this.foldedLevel, this.foldedBar);
    this.content.mask = this.contentMask;
    this.content.addChild(this.headerSlash, this.header, this.open, this.folded);
    this.fx.addChild(this.frameLines, this.corners, this.line, this.contentMask, this.content, this.artifacts);
    this.fx.filters = [this.glitchFilter, this.bloomFilter];
  }

  /** World-space area the effects may draw into (glitch slices and bloom spill past the panel). */
  setPlacement(x: number, y: number, scale: number) {
    this.root.position.set(x, y);
    this.root.scale.set(scale);
    const pad = 70;
    this.fx.filterArea = new Rectangle(x - pad * scale, y - pad * scale, (PLAYER_W + pad * 2) * scale, (PLAYER_H_OPEN + pad * 2) * scale);
  }

  setPhoto(url: string, texture: Texture) {
    this.photoUrl = url;
    this.portrait.texture = texture;
    const cover = Math.max(PORTRAIT.w / texture.width, PORTRAIT.h / texture.height);
    this.portrait.scale.set(cover);
    this.portrait.position.set(PORTRAIT.x + (PORTRAIT.w - texture.width * cover) / 2, PORTRAIT.y + (PORTRAIT.h - texture.height * cover) / 2);
  }
  get photo() {
    return this.photoUrl;
  }

  update(frame: PlayerFrame | null, script: PlayerScript) {
    this.root.visible = frame !== null;
    if (!frame) return;
    const { h } = frame;
    const poly = shape(h);

    // Glass, sheen and scanlines.
    this.glass.clear();
    if (frame.glass > 0 && h > 3) {
      this.glass.poly(poly).fill({ color: 0x0a1220, alpha: 0.74 * (1 - frame.glitch * 0.35) });
      for (let y = 4; y < h - 2; y += 3) this.glass.rect(0, y, PLAYER_W, 1).fill({ color: C.cyan, alpha: 0.025 });
    }
    this.sheenMask.clear().poly(poly).fill({ color: 0xffffff });
    this.sheen.clear();
    if (frame.sheen !== null && frame.glass > 0) {
      const x = lerp(-120, PLAYER_W + 40, frame.sheen);
      this.sheen.poly([x, 0, x + 70, 0, x + 30, h, x - 40, h]).fill({ color: 0xcfeaff, alpha: 0.09 });
    }

    // Frame, red tick, corners.
    this.frameLines.clear();
    if (frame.glass > 0 && h > 3) {
      this.frameLines.poly(poly).stroke({ width: 1.2, color: C.edge, alpha: 0.6 });
      const tab = Math.min(14, h * 0.45);
      this.frameLines.moveTo(PLAYER_W - 70, tab).lineTo(PLAYER_W - 8, tab).stroke({ width: 2.6, color: C.red, alpha: frame.corners });
    }
    const off = 8 * (1 - frame.cornersIn);
    this.corners.clear();
    if (frame.corners > 0) {
      const a = frame.corners;
      this.corners.moveTo(-6 - off, 10 - off).lineTo(-6 - off, -6 - off).lineTo(10 - off, -6 - off).stroke({ width: 2.2, color: C.red, alpha: a });
      const bx = PLAYER_W + 6 + off, by = h + 6 + off;
      this.corners.moveTo(bx - 16, by).lineTo(bx, by).lineTo(bx, by - 16).stroke({ width: 2.2, color: C.cyan, alpha: a });
    }

    // Birth / burn-out line.
    this.line.clear();
    if (frame.line) {
      const w = PLAYER_W * frame.line.scale;
      const x0 = frame.line.fromRight ? PLAYER_W - w : 0;
      const y = frame.line.y;
      const a = frame.line.opacity;
      this.line.rect(x0, y - 2, w, 6).fill({ color: C.cyan, alpha: 0.35 * a });
      this.line.rect(x0, y, w, 2).fill({ color: C.white, alpha: a });
      if (w > 4) {
        this.line.rect(x0, y - 4, 2, 10).fill({ color: C.white, alpha: a });
        this.line.rect(x0 + w - 2, y - 4, 2, 10).fill({ color: C.white, alpha: a });
      }
      if (frame.line.spark !== null) this.line.ellipse(PLAYER_W * frame.line.spark, y + 1, 16, 4).fill({ color: C.white, alpha: a });
    }

    // Content, clipped to the growing panel.
    this.contentMask.clear().rect(-2, -2, PLAYER_W + 4, h + 2).fill({ color: 0xffffff });
    this.content.alpha = frame.content;
    this.headerSlash.clear();
    if (frame.slash > 0) this.headerSlash.poly([14, 19, 17, 19 - 14 * frame.slash, 21, 19 - 14 * frame.slash, 18, 19]).fill({ color: C.red });
    this.header.text = frame.header;

    this.open.alpha = frame.openContent;
    this.open.visible = frame.openContent > 0.001;
    this.portraitMask.clear().rect(PORTRAIT.x, PORTRAIT.y, PORTRAIT.w, PORTRAIT.h * frame.portraitReveal).fill({ color: 0xffffff });
    this.portraitFlash.clear();
    if (frame.portraitFlash > 0.01) this.portraitFlash.rect(PORTRAIT.x, PORTRAIT.y, PORTRAIT.w, PORTRAIT.h * frame.portraitReveal).fill({ color: 0x9fefff, alpha: 0.85 * frame.portraitFlash });
    this.portraitBrackets.clear()
      .moveTo(PORTRAIT.x, PORTRAIT.y + 12).lineTo(PORTRAIT.x, PORTRAIT.y).lineTo(PORTRAIT.x + 12, PORTRAIT.y)
      .moveTo(PORTRAIT.x + PORTRAIT.w - 12, PORTRAIT.y + PORTRAIT.h).lineTo(PORTRAIT.x + PORTRAIT.w, PORTRAIT.y + PORTRAIT.h).lineTo(PORTRAIT.x + PORTRAIT.w, PORTRAIT.y + PORTRAIT.h - 12)
      .stroke({ width: 1.6, color: C.cyan, alpha: frame.portraitReveal });

    this.name.text = frame.name;
    this.levelLabel.alpha = frame.levelIn;
    this.levelLabel.x = 128 - 10 * (1 - frame.levelIn);
    this.levelValue.text = String(script.level);
    this.levelValue.alpha = frame.levelIn;
    this.levelValue.x = 186 - 10 * (1 - frame.levelIn);
    this.levelValue.tint = mix(C.green, C.white, frame.levelHeat);
    this.emblem.alpha = frame.levelIn * 0.85;

    // XP bar: one value feeds the bar and the figure.
    this.bar.clear();
    if (frame.trackIn > 0) {
      this.bar.rect(TRACK.x, TRACK.y, TRACK.w * frame.trackIn, TRACK.h).fill({ color: 0xaac8e1, alpha: 0.14 });
      const fill = TRACK.w * frame.ratio * frame.trackIn;
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const x0 = TRACK.x + (fill * i) / steps;
        this.bar.rect(x0, TRACK.y, fill / steps + 0.5, TRACK.h).fill({ color: mix(0x178a4a, C.green, i / (steps - 1)) });
      }
      if (fill > 2) {
        this.bar.rect(TRACK.x + fill - 3, TRACK.y - 3, 5, TRACK.h + 6).fill({ color: C.white, alpha: 0.3 + 0.7 * frame.heat });
        if (frame.heat > 0.05) this.bar.rect(TRACK.x + fill - 14, TRACK.y - 1, 12, TRACK.h + 2).fill({ color: C.white, alpha: 0.35 * frame.heat });
      }
    }
    this.xpText.text = `${Math.round(frame.xp).toLocaleString('en-US')} / ${script.nextLevelXp.toLocaleString('en-US')} XP`;
    this.xpText.alpha = frame.xpTextIn;
    this.gains.forEach((node, i) => {
      const gain = frame.gains[i];
      node.visible = !!gain;
      if (!gain) return;
      node.text = gain.text;
      node.alpha = gain.opacity;
      node.y = 66 + gain.dy;
      node.scale.set(gain.scale);
      node.tint = mix(C.white, C.green, gain.cool);
    });

    this.folded.alpha = frame.foldedContent;
    this.folded.visible = frame.foldedContent > 0.001;
    this.foldedLevel.text = `LVL ${script.level}`;
    this.foldedLevel.x = PLAYER_W - 90 - this.foldedLevel.width;
    this.foldedBar.clear().rect(14, 32, PLAYER_W - 28, 5).fill({ color: 0xaac8e1, alpha: 0.14 }).rect(14, 32, (PLAYER_W - 28) * frame.ratio, 5).fill({ color: C.green });

    this.drawArtifacts(frame);
    this.applyEffects(frame);
  }

  /** Fragments thrown off the panel edges while it glitches. */
  private drawArtifacts(frame: PlayerFrame) {
    const g = this.artifacts.clear();
    if (frame.glitch < 0.06) return;
    const count = Math.round(5 + 14 * frame.glitch);
    const colors = [C.cyan, C.red, C.white, C.cyan];
    for (let i = 0; i < count; i++) {
      const r = (k: number) => hash(frame.seed * 131 + i * 17 + k * 7.3);
      const side = r(1);
      const w = 6 + r(2) * 60 * frame.glitch;
      const hh = 1.5 + r(3) * 4;
      let x = r(4) * (PLAYER_W + 40) - 20;
      let y: number;
      if (side < 0.35) y = -4 - r(5) * 22;
      else if (side < 0.7) y = frame.h + 2 + r(5) * 22;
      else if (side < 0.85) { x = -8 - r(5) * 40; y = r(6) * frame.h; }
      else { x = PLAYER_W + 4 + r(5) * 40; y = r(6) * frame.h; }
      g.rect(x, y, w, hh).fill({ color: colors[Math.floor(r(7) * colors.length)]!, alpha: (0.35 + 0.65 * r(8)) * Math.min(1, frame.glitch * 1.4) });
    }
    // Inner slivers: short bright scan lines across the panel.
    const slivers = Math.round(3 * frame.glitch);
    for (let i = 0; i < slivers; i++) {
      const r = (k: number) => hash(frame.seed * 71 + i * 29 + k * 3.1);
      g.rect(r(1) * PLAYER_W * 0.6, r(2) * frame.h, 40 + r(3) * 120, 1.5).fill({ color: C.white, alpha: 0.5 * frame.glitch });
    }
  }

  private applyEffects(frame: PlayerFrame) {
    const glitch = this.glitchFilter;
    glitch.enabled = frame.glitch > 0.02;
    if (glitch.enabled) {
      if (frame.seed !== this.glitchSeed) {
        this.glitchSeed = frame.seed;
        withSeed(frame.seed * 7919 + 13, () => glitch.refresh());
      }
      glitch.seed = hash(frame.seed);
      glitch.offset = 34 * frame.glitch;
      glitch.red = { x: -6 * frame.glitch, y: 0 };
      glitch.blue = { x: 6 * frame.glitch, y: 1 * frame.glitch };
      glitch.green = { x: 0, y: 0 };
    }
    this.bloomFilter.bloomScale = 0.75 + 1.4 * frame.bloom;
  }
}
