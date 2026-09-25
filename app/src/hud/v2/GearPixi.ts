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
const C = { x: GEAR_W / 2, y: 168, rOut: 116, rIn: 50, gap: 0.045 };

function sector(g: Graphics, a0: number, a1: number, rIn: number, rOut: number) {
  const pts: number[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pts.push(C.x + Math.cos(a) * rOut, C.y + Math.sin(a) * rOut);
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pts.push(C.x + Math.cos(a) * rIn, C.y + Math.sin(a) * rIn);
  }
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

  constructor(private readonly theme: Theme = THEME) {
    const { color } = theme;
    this.panel = new PanelFrame(theme, { backdropBlur: true });
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
    this.panel.update(frame.panel);
    this.mask.clear().rect(-2, -2, GEAR_W + 4, h + 2).fill({ color: 0xffffff });
    this.content.alpha = frame.content * (1 - 0.45 * frame.disabled);
    this.slash.clear().poly([14, 19, 17, 5, 21, 5, 18, 19]).fill({ color: accent });
    this.header.text = frame.header;
    this.counter.text = frame.counter;
    this.counter.x = GEAR_W - 18 - this.counter.width;
    this.counter.y = frame.compactContent > 0.5 ? 24 : 22;
    this.counter.alpha = frame.openContent;

    // OPEN: the ring. Sector i sits at (i - pos) steps from the top; the one at the top is selected.
    this.open.alpha = frame.openContent;
    this.open.visible = frame.openContent > 0.001;
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
      const rOut = C.rIn + (C.rOut - C.rIn) * grow;
      sector(ring, mid - span / 2 + C.gap, mid + span / 2 - C.gap, C.rIn, rOut)
        .fill({ color: mix(0x0b1522, 0x3a0a14, top), alpha: 0.78 })
        .stroke({ width: 1.2 + top * 1.4, color: mix(data, accent, top), alpha: 0.55 + 0.45 * top });
      const slot = input.slots[i];
      if (slot) {
        const r = (C.rIn + rOut) / 2;
        drawIcon(icons, slot.icon, C.x + Math.cos(mid) * r, C.y + Math.sin(mid) * r, 26 + top * 6, mix(mix(data, color.white, top), color.white, frame.ping * top), 0.55 + 0.45 * top);
      }
    }
    // Centre: selected item large, ping ring when a step lands.
    const c = this.center.clear();
    const inner = C.rIn - 6;
    c.circle(C.x, C.y, inner * frame.centerIn).fill({ color: 0x050b14, alpha: 0.85 }).stroke({ width: 1.6, color: mix(data, accent, frame.ping), alpha: frame.centerIn });
    if (frame.ping > 0.02) c.circle(C.x, C.y, inner + 26 * (1 - frame.ping)).stroke({ width: 2, color: accent, alpha: frame.ping });
    const chosen = input.slots[frame.selected];
    if (chosen && frame.centerIn > 0.2) drawIcon(c, chosen.icon, C.x, C.y, 44, mix(color.white, accent, 0.25 + 0.5 * frame.ping), frame.centerIn);
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
