import { Container, FillGradient, Graphics, type Text } from 'pixi.js';
import { clamp01 } from '../kit/fx';
import { IconLayer } from '../kit/glyphs';
import { Effects, PanelFrame, drawArtifacts, label, mix } from '../kit/pixi';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from '../kit/theme';
import { GEAR_H_OPEN, GEAR_W, type GearFrame, type GearInput } from './gear';

/**
 * Draws a GearFrame like the CONFIGURE HUD design: hex petals lit from their
 * outer edge (radial gradient, bright outer rim, soft halo) around a red core
 * with the selected item. On opening the petals spin out from the centre and
 * flash as they land. No timing logic here.
 */

/** Radial geometry in the module's own coordinates (the bare flyout uses the same centre). */
export const RADIAL = { x: GEAR_W / 2, y: 168, rOut: 120, rIn: 60, gap: 0.2, core: 46 };
const C = RADIAL;

const hexColor = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Petal outline: inner arc, straight chamfered outer edge. Returns the points and the outer edge. */
function petalShape(mid: number, span: number, rIn: number, rOut: number, gap: number) {
  const a0 = mid - span / 2 + gap / 2;
  const a1 = mid + span / 2 - gap / 2;
  const at = (a: number, r: number) => [C.x + Math.cos(a) * r, C.y + Math.sin(a) * r] as const;
  const ch = Math.min(16, (rOut - rIn) * 0.32);
  const dA = ch / rOut;
  const outerA = at(a0 + dA, rOut), outerB = at(a1 - dA, rOut);
  const pts: number[] = [...at(a0 + gap * 0.25, rIn), ...at(a0, rOut - ch), ...outerA, ...outerB, ...at(a1, rOut - ch), ...at(a1 - gap * 0.25, rIn)];
  const steps = 8;
  for (let i = 1; i < steps; i++) pts.push(...at(a1 - gap * 0.25 - ((a1 - a0 - gap * 0.5) * i) / steps, rIn));
  return { pts, outer: [...outerA, ...outerB] };
}

export class GearPixi {
  readonly root = new Container();
  private readonly panel: PanelFrame;
  private readonly fx = new Container();
  private readonly effects: Effects;
  private readonly content = new Container();
  private readonly mask = new Graphics();
  private readonly slash = new Graphics();
  private readonly header: Text;
  private readonly counter: Text;
  private readonly open = new Container();
  private readonly halo = new Graphics();
  private readonly ring = new Graphics();
  private readonly center = new Graphics();
  private readonly icons = new IconLayer();
  private readonly name: Text;
  private readonly spec: Text;
  private readonly compact = new Container();
  private readonly compactIcons = new IconLayer();
  private readonly compactName: Text;
  private readonly compactCounter: Text;
  private readonly artifacts = new Graphics();
  private readonly bare: boolean;
  private readonly petalFill: FillGradient;
  private readonly petalHot: FillGradient;
  private readonly coreFill: FillGradient;

  /** bare: only the radial, no card (the flyout form used when it opens beside the rail). */
  constructor(private readonly theme: Theme = THEME, { bare = false }: { bare?: boolean } = {}) {
    const { color } = theme;
    this.bare = bare;
    const radial = (inner: number, outer: number, stops: [number, number][]) =>
      new FillGradient({ type: 'radial', center: { x: C.x, y: C.y }, innerRadius: inner, outerCenter: { x: C.x, y: C.y }, outerRadius: outer, colorStops: stops.map(([offset, c]) => ({ offset, color: hexColor(c) })), textureSpace: 'global' });
    // Lit from the outer edge: dark near the core, glowing towards the rim.
    this.petalFill = radial(C.rIn - 4, C.rOut, [[0, 0x030a14], [0.55, 0x07203a], [0.85, mix(0x0b3a5c, color.cyan, 0.12)], [1, mix(0x125a82, color.cyan, 0.25)]]);
    this.petalHot = radial(C.rIn - 4, C.rOut, [[0, 0x12040a], [0.6, 0x3a0a18], [1, mix(0x6a1024, color.red, 0.25)]]);
    this.coreFill = radial(0, C.core, [[0, mix(0x7a1428, color.red, 0.2)], [0.65, 0x3a0812], [1, 0x14030a]]);

    this.panel = new PanelFrame(theme, { backdropBlur: !bare });
    this.header = label(theme, '', 15, '700', color.red, 2.7, 26, 3, color.red);
    this.counter = label(theme, '', 14, '700', color.dim, 1.5, 0, 22);
    this.name = label(theme, '', 20, '700', color.text, 1.2, C.x, 298);
    this.name.anchor.set(0.5, 0);
    this.spec = label(theme, '', 13, '600', color.dim, 1.1, C.x, 322);
    this.spec.anchor.set(0.5, 0);
    this.compactName = label(theme, '', 17, '600', color.text, 1.2, 46, 24);
    this.compactCounter = label(theme, '', 15, '700', color.dim, 1.3, 0, 25);
    this.open.addChild(this.halo, this.ring, this.center, this.icons.root, this.name, this.spec);
    this.compact.addChild(this.compactIcons.root, this.compactName, this.compactCounter);
    this.content.mask = this.mask;
    this.content.addChild(this.slash, this.header, this.counter, this.open, this.compact);
    this.fx.addChild(this.panel.front, this.mask, this.content, this.artifacts);
    this.root.addChild(this.panel.back, this.fx);
    if (bare) {
      this.panel.back.visible = false;
      this.panel.front.visible = false;
      this.content.mask = null;
      this.mask.visible = false;
      for (const node of [this.slash, this.header, this.counter, this.name, this.spec, this.compact]) node.visible = false;
    }
    this.effects = new Effects(this.fx);
    this.effects.setArea(GEAR_W, GEAR_H_OPEN);
  }

  setPlacement(x: number, y: number, scale: number) {
    this.root.position.set(x, y);
    this.root.scale.set(scale);
  }

  update(frame: GearFrame | null, input: GearInput, k: MotionKnobs = DEFAULT_MOTION) {
    this.root.visible = frame !== null;
    if (!frame) return;
    const { color } = this.theme;
    const h = frame.panel.h;
    const n = Math.max(1, input.slots.length);
    const accent = mix(color.red, color.disabled, frame.disabled);
    const data = mix(color.cyan, color.disabled, frame.disabled);
    this.root.tint = mix(0xffffff, 0x9aa4ae, frame.disabled);
    if (!this.bare) {
      this.panel.update(frame.panel);
      this.mask.clear().rect(-2, -2, GEAR_W + 4, h + 2).fill({ color: 0xffffff });
    }
    this.content.alpha = frame.content * (1 - 0.45 * frame.disabled);
    this.slash.clear().poly([14, 19, 17, 5, 21, 5, 18, 19]).fill({ color: accent });
    this.header.text = frame.header;
    this.counter.text = frame.counter;
    this.counter.x = GEAR_W - 18 - this.counter.width;
    this.counter.alpha = frame.openContent;

    // Petals. Petal i sits (i - pos) steps from the top; the top one is the selection.
    this.open.alpha = this.bare ? frame.content : frame.openContent;
    this.open.visible = this.open.alpha > 0.001;
    const halo = this.halo.clear();
    const ring = this.ring.clear();
    this.icons.begin();
    const span = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const grow = frame.segmentsIn[i] ?? 1;
      if (grow <= 0) continue;
      let d = (((i - frame.pos) % n) + n) % n;
      if (d > n / 2) d -= n;
      const top = clamp01(1 - Math.abs(d));
      const flash = frame.petalFlash[i] ?? 0;
      const mid = -Math.PI / 2 + d * span + frame.spin * (1 - grow);
      const rIn = C.rIn * (0.35 + 0.65 * grow);
      const rOut = rIn + (C.rOut - C.rIn) * grow;
      const shape = petalShape(mid, span, rIn, rOut, C.gap);
      const edge = mix(data, accent, top * 0.8);
      halo.poly(shape.pts).stroke({ width: 9, color: edge, alpha: (0.1 + 0.25 * flash) * grow, join: 'round' });
      ring.poly(shape.pts).fill(top > 0.5 ? this.petalHot : this.petalFill).stroke({ width: 1.8, color: edge, alpha: (0.7 + 0.3 * flash) * grow, join: 'round' });
      // Outer rim brighter: the light comes from the outside of each petal.
      ring.moveTo(shape.outer[0]!, shape.outer[1]!).lineTo(shape.outer[2]!, shape.outer[3]!).stroke({ width: 2.6, color: mix(edge, color.white, 0.35 + 0.5 * flash), alpha: grow });
      const slot = input.slots[i];
      if (slot) {
        const r = (rIn + rOut) / 2 + 2;
        this.icons.add(slot.icon, C.x + Math.cos(mid) * r, C.y + Math.sin(mid) * r, 34 * (0.6 + 0.4 * grow), mix(color.white, 0xffc8d0, top * 0.5), grow);
      }
    }

    // Core: red ring with layered halo, dark red gradient inside, selected item in white.
    const c = this.center.clear();
    const core = C.core * frame.centerIn;
    if (core > 1) {
      c.circle(C.x, C.y, core + 17).stroke({ width: 8, color: accent, alpha: 0.07 + 0.1 * frame.ping });
      c.circle(C.x, C.y, core + 10).stroke({ width: 6, color: accent, alpha: 0.18 + 0.2 * frame.ping });
      c.circle(C.x, C.y, core + 5).stroke({ width: 3, color: accent, alpha: 0.45 });
      c.circle(C.x, C.y, core).fill(this.coreFill).stroke({ width: 5, color: accent, alpha: 1 });
      c.circle(C.x, C.y, core - 5).stroke({ width: 1.2, color: mix(accent, color.white, 0.4), alpha: 0.5 });
    }
    if (frame.ping > 0.02) c.circle(C.x, C.y, core + 14 + 30 * (1 - frame.ping)).stroke({ width: 2.4, color: accent, alpha: frame.ping });
    const chosen = input.slots[frame.selected];
    if (chosen && frame.centerIn > 0.2) this.icons.add(chosen.icon, C.x, C.y, 46 * Math.min(1, frame.centerIn), mix(0xffffff, 0xffb3bf, 0.25 + 0.5 * frame.ping), Math.min(1, frame.centerIn));
    this.icons.end();
    this.name.text = frame.name;
    this.spec.text = frame.spec;
    this.spec.alpha = frame.openContent;

    // COMPACT: selected icon, name and counter on one row.
    this.compact.alpha = frame.compactContent;
    this.compact.visible = frame.compactContent > 0.001;
    this.compactIcons.begin();
    if (chosen) this.compactIcons.add(chosen.icon, 26, 36, 24, mix(color.white, accent, frame.ping), 1);
    this.compactIcons.end();
    this.compactName.text = frame.name;
    this.compactCounter.text = frame.counter;
    this.compactCounter.x = GEAR_W - 16 - this.compactCounter.width;

    drawArtifacts(this.artifacts, this.theme, frame.seed, frame.glitch, GEAR_W, h, k);
    this.effects.apply(frame.glitch, frame.seed, frame.bloom, k);
  }
}
