import { Container, FillGradient, Graphics, type Text, type Texture } from 'pixi.js';
import { IconLayer } from '../kit/glyphs';
import { Effects, Portrait, drawArtifacts, drawBar, label, mix } from '../kit/pixi';
import { SamplePixi } from '../kit/sample';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from '../kit/theme';
import { GearPixi, RADIAL } from './GearPixi';
import { RAIL_TILE, tileY, type RailFrame, type RailInput } from './rail';

/**
 * Draws the LEFT RAIL in DOCK mode as in the HUD design: the profile closed
 * (portrait tile, name, level, cyan XP bar, no panel), a column of glowing
 * rounded tiles with solid icons, and ONE open module beside its icon. The
 * Gear Radial opens over the column with red arcs on both sides and a red
 * link from its icon; other modules open as panels. No timing logic here.
 */
const PORTRAIT = { x: 0, y: 0, w: 60, h: 64 };
const TEXT_X = 74;
const hexColor = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

export class RailPixi {
  readonly root = new Container();
  private readonly fx = new Container();
  private readonly effects: Effects;
  private readonly profile = new Graphics();
  private readonly portrait = new Portrait({ x: PORTRAIT.x + 3, y: PORTRAIT.y + 3, w: PORTRAIT.w - 6, h: PORTRAIT.h - 6 });
  private readonly name: Text;
  private readonly level: Text;
  private readonly bar = new Graphics();
  private readonly xpText: Text;
  private readonly tiles = new Graphics();
  private readonly tileIcons = new IconLayer();
  private readonly links = new Graphics();
  private readonly artifacts = new Graphics();
  private readonly flyouts = new Container();
  private readonly gear: GearPixi;
  private readonly samples = new Map<string, SamplePixi>();
  private readonly tileFill: FillGradient;
  private readonly tileHot: FillGradient;

  constructor(private readonly theme: Theme = THEME) {
    const { color } = theme;
    const linear = (stops: [number, number][]) => new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, colorStops: stops.map(([offset, c]) => ({ offset, color: hexColor(c) })), textureSpace: 'local' });
    this.tileFill = linear([[0, mix(0x0d3350, color.cyan, 0.12)], [0.5, 0x081b2e], [1, 0x040c18]]);
    this.tileHot = linear([[0, mix(0x5a1020, color.red, 0.2)], [0.6, 0x2a0610], [1, 0x12030a]]);
    this.name = label(theme, '', 19, '700', color.text, 1.3, TEXT_X, 2, 0x000000);
    this.level = label(theme, '', 14, '700', mix(color.dim, color.text, 0.6), 1.2, TEXT_X, 27, 0x000000);
    this.xpText = label(theme, '', 12, '700', mix(color.dim, color.text, 0.6), 1, TEXT_X, 55, 0x000000);
    this.fx.addChild(this.profile, this.portrait.root, this.name, this.level, this.bar, this.xpText, this.tiles, this.tileIcons.root, this.links, this.artifacts);
    this.gear = new GearPixi(theme, { bare: true });
    this.flyouts.addChild(this.gear.root);
    this.root.addChild(this.fx, this.flyouts);
    this.effects = new Effects(this.fx);
    this.effects.setArea(420, tileY(6));
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

  update(frame: RailFrame | null, input: RailInput, k: MotionKnobs = DEFAULT_MOTION) {
    this.root.visible = frame !== null;
    if (!frame) return;
    const { color } = this.theme;
    const { card } = frame;
    const reveal = card.content * Math.min(1, card.h / 40);

    // Profile, closed: portrait tile and text beside it, no panel.
    const pg = this.profile.clear();
    if (reveal > 0.01) {
      const c = 8;
      const tile = [PORTRAIT.x + c, PORTRAIT.y, PORTRAIT.x + PORTRAIT.w, PORTRAIT.y, PORTRAIT.x + PORTRAIT.w, PORTRAIT.y + PORTRAIT.h - c, PORTRAIT.x + PORTRAIT.w - c, PORTRAIT.y + PORTRAIT.h, PORTRAIT.x, PORTRAIT.y + PORTRAIT.h, PORTRAIT.x, PORTRAIT.y + c];
      pg.poly(tile).stroke({ width: 8, color: color.cyan, alpha: 0.12 * reveal, join: 'round' });
      pg.poly(tile).fill({ color: 0x050d18, alpha: 0.9 * reveal }).stroke({ width: 1.8, color: color.cyan, alpha: 0.9 * reveal, join: 'round' });
    }
    this.portrait.update(card.portraitReveal * reveal, card.portraitFlash, color.cyan);
    this.name.text = card.name;
    this.name.alpha = reveal;
    this.level.text = `LV ${input.player.record.level}`;
    this.level.alpha = card.levelIn * reveal;
    this.bar.clear();
    drawBar(this.bar, this.theme, TEXT_X, 47, 150, 4, card.ratio, card.levelIn * reveal, card.heat, { from: mix(0x0a4f70, color.cyan, 0.3), to: color.cyan });
    this.xpText.text = `${Math.round(card.xp).toLocaleString('en-US')} / ${input.player.record.nextLevelXp.toLocaleString('en-US')} XP`;
    this.xpText.alpha = card.levelIn * reveal;

    // Icon column: rounded glowing tiles; the selected one turns red.
    const g = this.tiles.clear();
    this.tileIcons.begin();
    const s = RAIL_TILE.size;
    const inset = (PORTRAIT.w - s) / 2;
    frame.tiles.forEach((tile, i) => {
      if (tile.appear <= 0) return;
      const y = tileY(i);
      const a = tile.appear;
      const x = inset - 10 * (1 - a);
      const edge = mix(color.cyan, color.red, tile.selected);
      g.roundRect(x, y, s, s, 7).stroke({ width: 8, color: edge, alpha: (0.1 + 0.15 * tile.selected) * a });
      g.roundRect(x, y, s, s, 7).fill(tile.selected > 0.5 ? this.tileHot : this.tileFill).stroke({ width: 1.8, color: edge, alpha: 0.95 * a });
      g.moveTo(x + 8, y + 1.5).lineTo(x + s - 8, y + 1.5).stroke({ width: 1.2, color: mix(edge, color.white, 0.5), alpha: 0.6 * a });
      if (tile.ping > 0.02) g.roundRect(x - 6 * (1 - tile.ping) - 3, y - 6 * (1 - tile.ping) - 3, s + 12 * (1 - tile.ping) + 6, s + 12 * (1 - tile.ping) + 6, 9).stroke({ width: 1.6, color: color.red, alpha: tile.ping });
      this.tileIcons.add(tile.icon, x + s / 2, y + s / 2, 26, mix(0xdff6ff, 0xffffff, tile.selected), a);
    });
    this.tileIcons.end();

    // Flyouts: one module beside its icon.
    const l = this.links.clear();
    let gearShown = false;
    const liveSamples = new Set<string>();
    for (const fly of frame.flyouts) {
      const cy = tileY(fly.index) + s / 2;
      const left = inset - 12;
      if (fly.link > 0) {
        // Red selection bar along the column and link towards the module.
        l.rect(left - 3, cy - 30 * fly.link, 3, 60 * fly.link).fill({ color: color.red, alpha: 0.95 });
        l.rect(left - 6, cy - 34 * fly.link, 9, 68 * fly.link).fill({ color: color.red, alpha: 0.15 });
      }
      if (fly.gear) {
        gearShown = true;
        const scale = 0.8;
        const cx = inset + s + RADIAL.rOut * scale * 0.55;
        this.gear.setPlacement(cx - RADIAL.x * scale, cy - RADIAL.y * scale, scale);
        this.gear.update(fly.gear, { enterAt: 0, exitAt: null, layout: [], hover: [], disabled: [], pulses: [], slots: input.gear.slots, selection: input.gear.selection }, k);
        const r = (RADIAL.rOut + 14) * scale;
        const sweep = 0.95 * fly.link * fly.gear.content;
        if (sweep > 0) {
          const arc = (radius: number, from: number, to: number, width: number, alpha: number) => {
            l.moveTo(cx + Math.cos(from) * radius, cy + Math.sin(from) * radius).arc(cx, cy, radius, from, to).stroke({ width, color: color.red, alpha });
          };
          for (const base of [Math.PI, 0]) {
            arc(r, base - sweep * 0.62, base + sweep * 0.62, 10, 0.12);
            arc(r, base - sweep * 0.62, base + sweep * 0.62, 3, 0.95);
            arc(r + 9, base - sweep * 0.42, base + sweep * 0.42, 1.5, 0.55);
          }
          l.moveTo(left, cy).lineTo(cx - r, cy).stroke({ width: 2, color: color.red, alpha: 0.8 * fly.link });
        }
      } else if (fly.sample && fly.sampleInput) {
        liveSamples.add(fly.id);
        let sample = this.samples.get(fly.id);
        if (!sample) {
          sample = new SamplePixi(this.theme);
          this.samples.set(fly.id, sample);
          this.flyouts.addChild(sample.root);
        }
        sample.root.visible = true;
        const sx = inset + s + 26;
        const top = Math.min(cy - 26, tileY(frame.tiles.length - 1) + s - 104);
        sample.setPlacement(sx, top, 1);
        sample.update(fly.sample, fly.sampleInput, k);
        if (fly.link > 0) l.moveTo(inset + s + 2, cy).lineTo(inset + s + 2 + (sx - inset - s - 2) * fly.link, cy).stroke({ width: 2.2, color: color.red, alpha: 0.9 });
      }
    }
    if (!gearShown) this.gear.update(null, { enterAt: 0, exitAt: null, layout: [], hover: [], disabled: [], pulses: [], slots: input.gear.slots, selection: input.gear.selection }, k);
    for (const [id, sample] of this.samples) if (!liveSamples.has(id)) sample.root.visible = false;

    drawArtifacts(this.artifacts, this.theme, frame.seed, frame.glitch, 240, tileY(frame.tiles.length), k);
    this.effects.apply(frame.glitch, frame.seed, frame.bloom, k);
  }
}
