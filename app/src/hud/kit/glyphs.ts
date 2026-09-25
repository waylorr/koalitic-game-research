import { Container, Sprite, Texture } from 'pixi.js';
import type { GearIcon } from './icons';

/**
 * HUD kit: solid glyph icons (Material Symbols, Apache-2.0, see glyphs/README.md).
 * Each SVG is rasterised once at high resolution into a white texture; sprites
 * tint it with theme colours, so icons stay crisp and glow under bloom.
 */
const SOURCES = import.meta.glob('./glyphs/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const RASTER = 160;
const textures = new Map<GearIcon, Texture>();
let loading: Promise<void> | null = null;

/** Rasterise every glyph (idempotent). Canvases await this before their first frame. */
export function loadGlyphs(): Promise<void> {
  if (!loading) {
    loading = Promise.all(
      Object.entries(SOURCES).map(async ([path, svg]) => {
        const id = path.replace('./glyphs/', '').replace('.svg', '') as GearIcon;
        const image = new Image(RASTER, RASTER);
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/width="\d+" height="\d+"/, `width="${RASTER}" height="${RASTER}"`))}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = RASTER;
        canvas.getContext('2d')!.drawImage(image, 0, 0, RASTER, RASTER);
        textures.set(id, Texture.from(canvas));
      }),
    ).then(() => undefined);
  }
  return loading;
}

/**
 * A pool of glyph sprites redrawn every frame: begin(), add() as many as
 * needed, end() hides the rest. Keeps the draw code as simple as Graphics.
 */
export class IconLayer {
  readonly root = new Container();
  private readonly pool: Sprite[] = [];
  private used = 0;

  begin() {
    this.used = 0;
  }

  add(icon: GearIcon, x: number, y: number, size: number, tint: number, alpha = 1) {
    const texture = textures.get(icon);
    if (!texture || alpha <= 0.001) return;
    let sprite = this.pool[this.used];
    if (!sprite) {
      sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      this.pool.push(sprite);
      this.root.addChild(sprite);
    }
    this.used++;
    sprite.texture = texture;
    sprite.visible = true;
    sprite.position.set(x, y);
    sprite.width = sprite.height = size;
    sprite.tint = tint;
    sprite.alpha = alpha;
  }

  end() {
    for (let i = this.used; i < this.pool.length; i++) this.pool[i]!.visible = false;
  }
}
