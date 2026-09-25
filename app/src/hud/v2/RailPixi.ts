import { Container, Graphics, type Text, type Texture } from 'pixi.js';
import { drawIcon } from '../kit/icons';
import { Effects, PanelFrame, Portrait, drawArtifacts, drawBar, label, mix } from '../kit/pixi';
import { SamplePixi } from '../kit/sample';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from '../kit/theme';
import { GearPixi, RADIAL } from './GearPixi';
import { RAIL_CARD, RAIL_TILE, tileY, type RailFrame, type RailInput } from './rail';

/**
 * Draws the LEFT RAIL in DOCK mode: mini player card, icon column and the one
 * open flyout beside its icon, joined by a red connector. The flyouts are the
 * modules' own renderers (Gear Radial bare, kit panel for the others).
 */
const FLY_X = 78;

export class RailPixi {
  readonly root = new Container();
  private readonly card: PanelFrame;
  private readonly fx = new Container();
  private readonly effects: Effects;
  private readonly cardContent = new Container();
  private readonly portrait = new Portrait({ x: 10, y: 12, w: 58, h: 68 });
  private readonly name: Text;
  private readonly level: Text;
  private readonly bar = new Graphics();
  private readonly xpText: Text;
  private readonly tiles = new Graphics();
  private readonly tileIcons = new Graphics();
  private readonly links = new Graphics();
  private readonly artifacts = new Graphics();
  private readonly flyouts = new Container();
  private readonly gear: GearPixi;
  private readonly samples = new Map<string, SamplePixi>();

  constructor(private readonly theme: Theme = THEME) {
    const { color } = theme;
    this.card = new PanelFrame(theme, { backdropBlur: true });
    this.name = label(theme, '', 17, '700', color.text, 1.3, 80, 12);
    this.level = label(theme, '', 14, '700', color.dim, 1.2, 80, 34);
    this.xpText = label(theme, '', 11, '600', color.dim, 1, 80, 68);
    this.cardContent.addChild(this.portrait.root, this.name, this.level, this.bar, this.xpText);
    this.fx.addChild(this.card.front, this.cardContent, this.tiles, this.tileIcons, this.links, this.artifacts);
    this.gear = new GearPixi(theme, { bare: true });
    this.root.addChild(this.card.back, this.fx, this.flyouts);
    this.flyouts.addChild(this.gear.root);
    this.effects = new Effects(this.fx);
    this.effects.setArea(FLY_X + 300, tileY(6));
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
    const { color, bars } = this.theme;
    const { card } = frame;

    // Mini player card.
    this.card.update({ w: RAIL_CARD.w, h: card.h, tabX: RAIL_CARD.w - 70, glass: card.glass, glitch: frame.glitch, sheen: card.sheen, corners: card.corners, cornersIn: card.cornersIn, line: card.line, hover: 0, pinned: 0, disabled: 0 });
    this.cardContent.alpha = card.content;
    this.cardContent.visible = card.h > 20;
    this.portrait.update(card.portraitReveal, card.portraitFlash, color.cyan);
    this.name.text = card.name;
    this.level.text = `LV ${input.player.record.level}`;
    this.level.alpha = card.levelIn;
    this.bar.clear();
    drawBar(this.bar, this.theme, 80, 56, RAIL_CARD.w - 94, 5, card.ratio, card.levelIn, card.heat, bars.xp);
    this.xpText.text = `${Math.round(card.xp).toLocaleString('en-US')} / ${input.player.record.nextLevelXp.toLocaleString('en-US')} XP`;
    this.xpText.alpha = card.levelIn;

    // Icon column: cyan tiles, the selected one red with a side bar.
    const g = this.tiles.clear();
    const icons = this.tileIcons.clear();
    const s = RAIL_TILE.size;
    frame.tiles.forEach((tile, i) => {
      if (tile.appear <= 0) return;
      const y = tileY(i);
      const a = tile.appear;
      const edge = mix(color.cyan, color.red, tile.selected);
      const c = 7;
      g.poly([c, y, s, y, s, y + s - c, s - c, y + s, 0, y + s, 0, y + c])
        .fill({ color: mix(0x07131f, 0x2a0610, tile.selected), alpha: 0.8 * a })
        .stroke({ width: 1.6 + tile.selected * 1.2, color: edge, alpha: (0.6 + 0.4 * tile.selected) * a });
      if (tile.selected > 0.01) g.rect(-9, y + 6, 3, s - 12).fill({ color: color.red, alpha: tile.selected * a });
      if (tile.ping > 0.02) g.rect(-4 - 10 * (1 - tile.ping), y - 4 - 10 * (1 - tile.ping), s + 8 + 20 * (1 - tile.ping), s + 8 + 20 * (1 - tile.ping)).stroke({ width: 1.5, color: color.red, alpha: tile.ping * 0.8 });
      drawIcon(icons, tile.icon, s / 2, y + s / 2, 24, mix(color.cyan, color.white, tile.selected), a);
    });

    // Flyouts: one module beside its icon, joined by a red connector.
    const l = this.links.clear();
    let gearShown = false;
    const liveSamples = new Set<string>();
    for (const fly of frame.flyouts) {
      const cy = tileY(fly.index) + s / 2;
      if (fly.gear) {
        gearShown = true;
        const cx = FLY_X + RADIAL.rOut;
        this.gear.setPlacement(FLY_X + RADIAL.rOut - RADIAL.x, cy - RADIAL.y, 1);
        this.gear.update(fly.gear, { enterAt: 0, exitAt: null, layout: [], hover: [], disabled: [], pulses: [], slots: input.gear.slots, selection: input.gear.selection }, k);
        const r = RADIAL.rOut + 12;
        const reach = fly.link;
        if (reach > 0) {
          l.moveTo(s + 2, cy).lineTo(s + 2 + (cx - r - s - 2) * reach, cy).stroke({ width: 2.2, color: color.red, alpha: 0.9 });
          const sweep = 0.9 * reach * (fly.gear.content > 0 ? 1 : 0);
          if (sweep > 0) l.arc(cx, cy, r, Math.PI - sweep, Math.PI + sweep).stroke({ width: 3, color: color.red, alpha: 0.9 * fly.gear.content });
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
        sample.setPlacement(FLY_X + 8, cy - 26, 1);
        sample.update(fly.sample, fly.sampleInput, k);
        if (fly.link > 0) l.moveTo(s + 2, cy).lineTo(s + 2 + (FLY_X + 8 - s - 2) * fly.link, cy).stroke({ width: 2.2, color: color.red, alpha: 0.9 });
      }
    }
    if (!gearShown) this.gear.update(null, { enterAt: 0, exitAt: null, layout: [], hover: [], disabled: [], pulses: [], slots: input.gear.slots, selection: input.gear.selection }, k);
    for (const [id, sample] of this.samples) if (!liveSamples.has(id)) sample.root.visible = false;

    drawArtifacts(this.artifacts, this.theme, frame.seed, frame.glitch, RAIL_CARD.w, card.h, k);
    this.effects.apply(frame.glitch, frame.seed, frame.bloom, k);
  }
}
