import { Container, Graphics, type Text } from 'pixi.js';
import { clamp01 } from '../kit/fx';
import { drawIcon } from '../kit/icons';
import { Effects, PanelFrame, drawArtifacts, label, mix } from '../kit/pixi';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from '../kit/theme';
import { GEAR_H_OPEN, GEAR_W, type GearFrame, type GearInput } from './gear';

/**
 * Draws a GearFrame with the kit pieces: a ring of sectors with vector icons,
 * the selected one at the top in red, the selected item large in the centre.
 * No timing logic here.
 */
/** Radial geometry in the module's own coordinates (the bare flyout uses the same centre). */
export const RADIAL = { x: GEAR_W / 2, y: 168, rOut: 118, rIn: 58, gap: 0.16, core: 46 };
const C = RADIAL;

/** A hex-like petal: a ring segment with chamfered outer corners (as in the CONFIGURE HUD design). */
function petal(g: Graphics, mid: number, span: number, rIn: number, rOut: number, gap: number) {
  const a0 = mid - span / 2 + gap / 2;
  const a1 = mid + span / 2 - gap / 2;
  const ch = Math.min(14, (rOut - rIn) * 0.3);
  const at = (a: number, r: number) => [C.x + Math.cos(a) * r, C.y + Math.sin(a) * r];
  const pts: number[] = [];
  pts.push(...at(a0 + gap * 0.2, rIn));
  pts.push(...at(a0, rOut - ch));
  const dA = ch / rOut;
  const steps = 8;
  for (let i = 0; i <= steps; i++) pts.push(...at(a0 + dA + ((a1 - a0 - 2 * dA) * i) / steps, rOut));
  pts.push(...at(a1, rOut - ch));
  pts.push(...at(a1 - gap * 0.2, rIn));
  for (let i = steps; i >= 0; i--) pts.push(...at(a0 + gap * 0.2 + ((a1 - a0 - gap * 0.4) * i) / steps, rIn));
  return g.poly(pts);
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
  private readonly ring = new Graphics();
  private readonly icons = new Graphics();
  private readonly center = new Graphics();
  private readonly name: Text;
  private readonly spec: Text;
  private readonly compact = new Container();
  private readonly compactIcon = new Graphics();
  private readonly compactName: Text;
  private readonly compactCounter: Text;
  private readonly artifacts = new Graphics();

  private readonly bare: boolean;

  /** bare: only the radial, no card (the flyout form used when it opens beside the rail). */
  constructor(private readonly theme: Theme = THEME, { bare = false }: { bare?: boolean } = {}) {
    const { color } = theme;
    this.bare = bare;
    this.panel = new PanelFrame(theme, { backdropBlur: !bare });
    this.header = label(theme, '', 15, '700', color.red, 2.7, 26, 3, color.red);
    this.counter = label(theme, '', 14, '700', color.dim, 1.5, 0, 22);
    this.name = label(theme, '', 20, '700', color.text, 1.2, C.x, 296);
    this.name.anchor.set(0.5, 0);
    this.spec = label(theme, '', 13, '600', color.dim, 1.1, C.x, 320);
    this.spec.anchor.set(0.5, 0);
    this.compactName = label(theme, '', 17, '600', color.text, 1.2, 46, 24);
    this.compactCounter = label(theme, '', 15, '700', color.dim, 1.3, 0, 25);
    this.open.addChild(this.ring, this.icons, this.center, this.name, this.spec);
    this.compact.addChild(this.compactIcon, this.compactName, this.compactCounter);
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
    this.counter.y = frame.compactContent > 0.5 ? 24 : 22;
    this.counter.alpha = frame.openContent;

    // OPEN: the ring. Sector i sits at (i - pos) steps from the top; the one at the top is selected.
    this.open.alpha = this.bare ? frame.content : frame.openContent;
    this.open.visible = this.open.alpha > 0.001;
    const ring = this.ring.clear();
    const icons = this.icons.clear();
    const span = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const grow = frame.segmentsIn[i] ?? 1;
      if (grow <= 0) continue;
      let d = (((i - frame.pos) % n) + n) % n;
      if (d > n / 2) d -= n;
      const top = clamp01(1 - Math.abs(d));
      const mid = -Math.PI / 2 + d * span;
      const rIn = C.rIn * (0.7 + 0.3 * grow);
      const rOut = rIn + (C.rOut - C.rIn) * grow;
      petal(ring, mid, span, rIn, rOut, C.gap)
        .fill({ color: mix(0x071524, 0x1a0710, top * 0.6), alpha: 0.82 })
        .stroke({ width: 2.2, color: mix(data, accent, top * 0.75), alpha: 0.75 + 0.25 * top });
      const slot = input.slots[i];
      if (slot) {
        const r = (rIn + rOut) / 2;
        drawIcon(icons, slot.icon, C.x + Math.cos(mid) * r, C.y + Math.sin(mid) * r, 30, mix(color.white, accent, top * 0.35), grow);
      }
    }
    // Centre: the selected item in a red core; a ping ring when a step lands.
    const c = this.center.clear();
    const core = C.core * frame.centerIn;
    if (core > 1) {
      c.circle(C.x, C.y, core + 8).stroke({ width: 2, color: accent, alpha: 0.35 + 0.4 * frame.ping });
      c.circle(C.x, C.y, core).fill({ color: mix(0x2a0610, 0x5a0c1c, frame.ping), alpha: 0.92 }).stroke({ width: 4, color: accent, alpha: 1 });
    }
    if (frame.ping > 0.02) c.circle(C.x, C.y, core + 12 + 26 * (1 - frame.ping)).stroke({ width: 2, color: accent, alpha: frame.ping });
    const chosen = input.slots[frame.selected];
    if (chosen && frame.centerIn > 0.2) drawIcon(c, chosen.icon, C.x, C.y, 40, mix(color.white, 0xffd0d6, 0.3 + 0.4 * frame.ping), frame.centerIn);
    this.name.text = frame.name;
    this.spec.text = frame.spec;
    this.spec.alpha = frame.openContent;

    // COMPACT: selected icon, name and counter on one row.
    this.compact.alpha = frame.compactContent;
    this.compact.visible = frame.compactContent > 0.001;
    this.compactIcon.clear();
    if (chosen) drawIcon(this.compactIcon, chosen.icon, 26, 36, 22, mix(color.white, accent, frame.ping), 1);
    this.compactName.text = frame.name;
    this.compactCounter.text = frame.counter;
    this.compactCounter.x = GEAR_W - 16 - this.compactCounter.width;

    drawArtifacts(this.artifacts, this.theme, frame.seed, frame.glitch, GEAR_W, h, k);
    this.effects.apply(frame.glitch, frame.seed, frame.bloom, k);
  }
}
