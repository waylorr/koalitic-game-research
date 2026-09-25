import { useEffect, useRef, useState } from 'react';
import { Application, Sprite, Texture } from 'pixi.js';
import { createDrawn, type Drawn, type HudItem } from '../registry';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from '../kit/theme';

async function loadTexture(url: string): Promise<Texture> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return Texture.from(image);
}

interface Props {
  readonly width: number;
  readonly height: number;
  readonly background?: string;
  readonly items: readonly HudItem[];
  readonly theme?: Theme;
  readonly motion?: MotionKnobs;
}

/**
 * Hosts HUD elements in one PixiJS canvas. Rendering is manual (no ticker):
 * the canvas is redrawn only when the items change, from their evaluators.
 * A theme change rebuilds the elements so every piece takes the new look.
 */
export function HudCanvas({ width, height, background, items, theme = THEME, motion = DEFAULT_MOTION }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<{ app: Application; bg: Sprite; drawn: Map<string, Drawn>; theme: Theme } | null>(null);
  const [ready, setReady] = useState(0);
  /** Bumps each time a new Pixi scene is ready (the canvas is recreated when its size changes). */
  const [sceneId, setSceneId] = useState(0);
  const [info, setInfo] = useState<{ phases: string; value: string }>({ phases: '', value: '' });

  useEffect(() => {
    let cancelled = false;
    setInfo({ phases: '', value: '' });
    const app = new Application();
    (async () => {
      await app.init({ width, height, backgroundAlpha: 0, antialias: true, autoStart: false, resolution: Math.max(2, window.devicePixelRatio || 1), autoDensity: true, preference: 'webgl', useBackBuffer: true, preserveDrawingBuffer: true });
      await Promise.all(['500', '600', '700'].map(weight => document.fonts.load(`${weight} 20px Rajdhani`)));
      if (cancelled) {
        app.destroy(true);
        return;
      }
      app.ticker.stop();
      const bg = new Sprite(Texture.EMPTY);
      app.stage.addChild(bg);
      host.current?.appendChild(app.canvas);
      scene.current = { app, bg, drawn: new Map(), theme };
      setSceneId(n => n + 1);
      setReady(r => r + 1);
    })();
    return () => {
      cancelled = true;
      if (scene.current) {
        scene.current.app.destroy(true, { children: true });
        scene.current = null;
      }
    };
  }, [width, height]);

  useEffect(() => {
    const current = scene.current;
    if (!current || !background) return;
    let alive = true;
    loadTexture(background).then(texture => {
      if (!alive) return;
      const cover = Math.max(width / texture.width, height / texture.height);
      current.bg.texture = texture;
      current.bg.scale.set(cover);
      current.bg.position.set((width - texture.width * cover) / 2, (height - texture.height * cover) / 2);
      setReady(r => r + 1);
    });
    return () => { alive = false; };
  }, [background, sceneId, width, height]);

  // One drawn element per item key (rebuilt on theme change); photos load as they change.
  const signature = items.map(item => `${item.key}:${item.kind}`).join('|');
  const photos = items.map(item => `${item.key}=${item.kind === 'player' ? item.input.record.photo : item.kind === 'board' ? item.photo : ''}`).join('|');
  useEffect(() => {
    const current = scene.current;
    if (!current) return;
    const rebuild = current.theme !== theme;
    current.theme = theme;
    const keys = new Set(items.map(item => item.key));
    for (const [key, drawn] of current.drawn) {
      if (rebuild || !keys.has(key)) {
        current.app.stage.removeChild(drawn.root);
        drawn.root.destroy({ children: true });
        current.drawn.delete(key);
      }
    }
    let alive = true;
    for (const item of items) {
      let drawn = current.drawn.get(item.key);
      if (!drawn) {
        drawn = createDrawn(item.kind, theme);
        current.drawn.set(item.key, drawn);
        current.app.stage.addChild(drawn.root);
      }
      const url = drawn.photoUrl(item);
      if (url && drawn.photo !== url && drawn.setPhoto) {
        const target = drawn;
        loadTexture(url).then(texture => {
          if (!alive) return;
          target.setPhoto?.(url, texture);
          setReady(r => r + 1);
        });
      }
    }
    return () => { alive = false; };
  }, [signature, photos, sceneId, theme]);

  useEffect(() => {
    const current = scene.current;
    if (!current) return;
    const results = items.map(item => current.drawn.get(item.key)?.draw(item, motion) ?? { phase: 'hidden', value: null });
    current.app.render();
    const next = { phases: results.map(r => r.phase).join(','), value: results[0]?.value === null || results[0] === undefined ? '' : String(results[0].value) };
    if (next.phases !== info.phases || next.value !== info.value) setInfo(next);
  });

  const photosLoaded = scene.current !== null && items.every(item => {
    const drawn = scene.current!.drawn.get(item.key);
    const url = drawn?.photoUrl(item);
    return drawn !== undefined && (!url || drawn.photo === url);
  });
  return (
    <div
      ref={host}
      className="kg-pixi-host"
      style={{ width, height }}
      data-testid="player-module"
      data-phase={info.phases.split(',')[0] || 'hidden'}
      data-phases={info.phases}
      data-xp={info.value}
      data-ready={ready > 0 && photosLoaded ? 'yes' : 'no'}
    />
  );
}
