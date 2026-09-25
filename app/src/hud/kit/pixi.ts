import { Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { AdvancedBloomFilter, BackdropBlurFilter, GlitchFilter } from 'pixi-filters';
import { hash, lerp, withSeed } from './fx';
import type { MotionKnobs, Theme } from './theme';

/**
 * HUD kit, layer 3: PixiJS pieces shared by every HUD element (panel frame,
 * effects, artifacts, value bar, text, portrait). They hold no timing logic:
 * a component evaluates its frame and passes plain numbers in.
 */

export const mix = (a: number, b: number, p: number) => {
  const ch = (shift: number) => Math.round(lerp((a >> shift) & 255, (b >> shift) & 255, p));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

export function label(theme: Theme, value: string, size: number, weight: '500' | '600' | '700', fill: number, letterSpacing: number, x = 0, y = 0, glow?: number): Text {
  const node = new Text({
    text: value,
    style: new TextStyle({
      fontFamily: theme.font,
      fontSize: size,
      fontWeight: weight,
      fill,
      letterSpacing,
      dropShadow: glow === undefined ? false : { color: glow, alpha: 0.7, blur: 6, distance: 0, angle: 0 },
    }),
    resolution: 3,
  });
  node.position.set(x, y);
  return node;
}

/** Outline of a HUD panel: header tab on the left, cut corner bottom-right. */
export function panelShape(theme: Theme, w: number, h: number, tabX: number): number[] {
  const tab = Math.min(theme.tab, h * 0.45);
  const cut = Math.min(theme.cut, h * 0.4);
  return [0, 0, tabX, 0, tabX + tab, tab, w, tab, w, h - cut, w - cut, h, 0, h];
}

export interface PanelState {
  readonly w: number;
  readonly h: number;
  readonly tabX: number;
  readonly glass: number;
  readonly glitch: number;
  readonly sheen: number | null;
  readonly corners: number;
  readonly cornersIn: number;
  readonly line: { readonly scale: number; readonly opacity: number; readonly fromRight: boolean; readonly spark: number | null } | null;
  /** 0..1 highlight (HOVER), pin (PINNED) and dimming (DISABLED). */
  readonly hover: number;
  readonly pinned: number;
  readonly disabled: number;
}

/**
 * Glass (behind the effects, blurs what is under it), sheen and scanlines, the
 * frame with its red tick, the corner brackets and the birth/burn-out line.
 */
export class PanelFrame {
  readonly back = new Container();
  readonly front = new Container();
  private readonly glass = new Graphics();
  private readonly sheen = new Graphics();
  private readonly sheenMask = new Graphics();
  private readonly lines = new Graphics();
  private readonly corners = new Graphics();
  private readonly line = new Graphics();

  constructor(private readonly theme: Theme, { backdropBlur }: { backdropBlur: boolean }) {
    if (backdropBlur) this.glass.filters = [new BackdropBlurFilter({ strength: 7, quality: 3 })];
    this.sheen.mask = this.sheenMask;
    this.back.addChild(this.glass, this.sheenMask, this.sheen);
    this.front.addChild(this.lines, this.corners, this.line);
  }

  update(p: PanelState) {
    const { color } = this.theme;
    const { w, h } = p;
    const poly = panelShape(this.theme, w, h, p.tabX);
    const tab = Math.min(this.theme.tab, h * 0.45);
    const accent = mix(color.red, color.disabled, p.disabled);

    this.glass.clear();
    if (p.glass > 0 && h > 3) {
      this.glass.poly(poly).fill({ color: color.glass, alpha: this.theme.glassAlpha * (1 - p.glitch * 0.35) });
      for (let y = 4; y < h - 2; y += 3) this.glass.rect(0, y, w, 1).fill({ color: color.cyan, alpha: 0.025 });
    }
    this.sheenMask.clear().poly(poly).fill({ color: 0xffffff });
    this.sheen.clear();
    if (p.sheen !== null && p.glass > 0) {
      const x = lerp(-120, w + 40, p.sheen);
      this.sheen.poly([x, 0, x + 70, 0, x + 30, h, x - 40, h]).fill({ color: 0xcfeaff, alpha: 0.09 });
    }

    this.lines.clear();
    if (p.glass > 0 && h > 3) {
      const edge = mix(mix(color.edge, color.cyan, p.hover), color.disabled, p.disabled);
      this.lines.poly(poly).stroke({ width: this.theme.line + p.hover * 0.8, color: edge, alpha: 0.6 + 0.4 * p.hover });
      this.lines.moveTo(w - 70, tab).lineTo(w - 8, tab).stroke({ width: this.theme.accent, color: accent, alpha: p.corners });
      if (p.hover > 0.01) this.lines.rect(-1, tab + 4, 3, h - tab - 12).fill({ color: color.cyan, alpha: p.hover });
      if (p.pinned > 0.01) {
        // Pin: a red diamond with a core, left of the red tick.
        const cx = w - 84, cy = 7, r = 5 * p.pinned;
        this.lines.poly([cx, cy - r, cx + r, cy, cx, cy + r, cx - r, cy]).fill({ color: accent, alpha: p.pinned }).circle(cx, cy, 1.6).fill({ color: color.white, alpha: p.pinned });
      }
    }

    const off = 8 * (1 - p.cornersIn);
    this.corners.clear();
    if (p.corners > 0) {
      const bottomRight = mix(mix(color.cyan, color.red, p.pinned), color.disabled, p.disabled);
      this.corners.moveTo(-6 - off, 10 - off).lineTo(-6 - off, -6 - off).lineTo(10 - off, -6 - off).stroke({ width: 2.2, color: accent, alpha: p.corners });
      const bx = w + 6 + off, by = h + 6 + off;
      this.corners.moveTo(bx - 16, by).lineTo(bx, by).lineTo(bx, by - 16).stroke({ width: 2.2, color: bottomRight, alpha: p.corners });
    }

    this.line.clear();
    if (p.line) {
      const lw = w * p.line.scale;
      const x0 = p.line.fromRight ? w - lw : 0;
      const y = p.line.fromRight ? h / 2 - 1 : 0;
      const a = p.line.opacity;
      this.line.rect(x0, y - 2, lw, 6).fill({ color: color.cyan, alpha: 0.35 * a });
      this.line.rect(x0, y, lw, 2).fill({ color: color.white, alpha: a });
      if (lw > 4) {
        this.line.rect(x0, y - 4, 2, 10).fill({ color: color.white, alpha: a });
        this.line.rect(x0 + lw - 2, y - 4, 2, 10).fill({ color: color.white, alpha: a });
      }
      if (p.line.spark !== null) this.line.ellipse(w * p.line.spark, y + 1, 16, 4).fill({ color: color.white, alpha: a });
    }
  }
}

/** Glitch (slices + RGB split, seeded) and bloom on one container. */
export class Effects {
  private readonly glitchFilter = new GlitchFilter({ slices: 10, offset: 0, fillMode: 0, average: false, minSize: 4, sampleSize: 256, seed: 0 });
  private readonly bloomFilter = new AdvancedBloomFilter({ threshold: 0.42, bloomScale: 0.8, brightness: 1, blur: 5, quality: 6 });
  private seed = -1;

  constructor(private readonly target: Container) {
    target.filters = [this.glitchFilter, this.bloomFilter];
  }

  /** Area the effects may draw into, in the panel's own coordinates (slices and bloom spill past it). */
  setArea(w: number, h: number, pad = 70) {
    this.target.filterArea = new Rectangle(-pad, -pad, w + pad * 2, h + pad * 2);
  }

  apply(glitch: number, seed: number, bloom: number, k: MotionKnobs) {
    const g = glitch * k.glitch;
    const filter = this.glitchFilter;
    filter.enabled = g > 0.02;
    if (filter.enabled) {
      if (seed !== this.seed) {
        this.seed = seed;
        withSeed(seed * 7919 + 13, () => filter.refresh());
      }
      filter.seed = hash(seed);
      filter.offset = 34 * g;
      filter.red = { x: -6 * g, y: 0 };
      filter.blue = { x: 6 * g, y: g };
      filter.green = { x: 0, y: 0 };
    }
    this.bloomFilter.enabled = k.bloom > 0;
    this.bloomFilter.bloomScale = (0.75 + 1.4 * bloom) * k.bloom;
  }
}

/** Fragments thrown off the panel edges and bright slivers across it while it glitches. */
export function drawArtifacts(g: Graphics, theme: Theme, seed: number, glitch: number, w: number, h: number, k: MotionKnobs) {
  g.clear();
  const strength = glitch * k.glitch;
  if (strength < 0.06 || k.artifacts <= 0) return;
  const { color } = theme;
  const count = Math.round((5 + 14 * strength) * k.artifacts);
  const colors = [color.cyan, color.red, color.white, color.cyan];
  for (let i = 0; i < count; i++) {
    const r = (n: number) => hash(seed * 131 + i * 17 + n * 7.3);
    const side = r(1);
    const aw = 6 + r(2) * 60 * strength;
    const ah = 1.5 + r(3) * 4;
    let x = r(4) * (w + 40) - 20;
    let y: number;
    if (side < 0.35) y = -4 - r(5) * 22;
    else if (side < 0.7) y = h + 2 + r(5) * 22;
    else if (side < 0.85) { x = -8 - r(5) * 40; y = r(6) * h; }
    else { x = w + 4 + r(5) * 40; y = r(6) * h; }
    g.rect(x, y, aw, ah).fill({ color: colors[Math.floor(r(7) * colors.length)]!, alpha: (0.35 + 0.65 * r(8)) * Math.min(1, strength * 1.4) });
  }
  const slivers = Math.round(3 * strength * k.artifacts);
  for (let i = 0; i < slivers; i++) {
    const r = (n: number) => hash(seed * 71 + i * 29 + n * 3.1);
    g.rect(r(1) * w * 0.6, r(2) * h, 40 + r(3) * 120, 1.5).fill({ color: color.white, alpha: 0.5 * strength });
  }
}

/** Value bar: track, gradient fill and a white-hot head while the value moves. */
export function drawBar(g: Graphics, theme: Theme, x: number, y: number, w: number, h: number, ratio: number, trackIn: number, heat: number, fill: { from: number; to: number }) {
  g.rect(x, y, w * trackIn, h).fill({ color: 0xaac8e1, alpha: 0.14 });
  const filled = w * ratio * trackIn;
  const steps = 12;
  for (let i = 0; i < steps; i++) g.rect(x + (filled * i) / steps, y, filled / steps + 0.5, h).fill({ color: mix(fill.from, fill.to, i / (steps - 1)) });
  if (filled > 2) {
    g.rect(x + filled - 3, y - 3, 5, h + 6).fill({ color: theme.color.white, alpha: 0.3 + 0.7 * heat });
    if (heat > 0.05) g.rect(x + filled - 14, y - 1, 12, h + 2).fill({ color: theme.color.white, alpha: 0.35 * heat });
  }
}

/** Framed picture: revealed from the top with an over-exposed flash, cyan brackets. */
export class Portrait {
  readonly root = new Container();
  private readonly sprite = new Sprite(Texture.EMPTY);
  private readonly mask = new Graphics();
  private readonly flash = new Graphics();
  private readonly brackets = new Graphics();
  private url = '';

  constructor(private readonly box: { x: number; y: number; w: number; h: number }) {
    this.sprite.mask = this.mask;
    this.flash.blendMode = 'add';
    this.root.addChild(this.sprite, this.mask, this.flash, this.brackets);
  }

  get photo() {
    return this.url;
  }

  setPhoto(url: string, texture: Texture) {
    const { box } = this;
    this.url = url;
    this.sprite.texture = texture;
    const cover = Math.max(box.w / texture.width, box.h / texture.height);
    this.sprite.scale.set(cover);
    this.sprite.position.set(box.x + (box.w - texture.width * cover) / 2, box.y + (box.h - texture.height * cover) / 2);
  }

  update(reveal: number, flash: number, bracketColor: number) {
    const { box } = this;
    this.mask.clear().rect(box.x, box.y, box.w, box.h * reveal).fill({ color: 0xffffff });
    this.flash.clear();
    if (flash > 0.01) this.flash.rect(box.x, box.y, box.w, box.h * reveal).fill({ color: 0x9fefff, alpha: 0.85 * flash });
    this.brackets.clear()
      .moveTo(box.x, box.y + 12).lineTo(box.x, box.y).lineTo(box.x + 12, box.y)
      .moveTo(box.x + box.w - 12, box.y + box.h).lineTo(box.x + box.w, box.y + box.h).lineTo(box.x + box.w, box.y + box.h - 12)
      .stroke({ width: 1.6, color: bracketColor, alpha: reveal });
  }
}
