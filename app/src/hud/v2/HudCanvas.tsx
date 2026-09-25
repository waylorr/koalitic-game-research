import { useEffect, useRef, useState } from 'react';
import { Application, Sprite, Texture, VideoSource } from 'pixi.js';
import { createDrawn, type Drawn, type HudItem } from '../registry';
import { DEFAULT_MOTION, THEME, type MotionKnobs, type Theme } from '../kit/theme';
import { useStageScale } from '../../ui/Stage';
import { loadGlyphs } from '../kit/glyphs';

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
  /** A playing or paused video drawn as the background (takes precedence over `background`). */
  readonly backgroundVideo?: HTMLVideoElement | null;
  readonly items: readonly HudItem[];
  readonly theme?: Theme;
  readonly motion?: MotionKnobs;
}

/**
 * Hosts HUD elements in one PixiJS canvas. Rendering is manual (no ticker):
 * the canvas is redrawn only when the items change, from their evaluators.
 * A theme change rebuilds the elements so every piece takes the new look.
 */
export function HudCanvas({ width, height, background, backgroundVideo, items, theme = THEME, motion = DEFAULT_MOTION }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<{ app: Application; bg: Sprite; drawn: Map<string, Drawn>; theme: Theme } | null>(null);
  const [ready, setReady] = useState(0);
  /** Bumps each time a new Pixi scene is ready (the canvas is recreated when its size changes). */
  const [sceneId, setSceneId] = useState(0);
  const [info, setInfo] = useState<{ phases: string; value: string }>({ phases: '', value: '' });
  // Render at the canvas's real size on screen: stage scale × device pixels (never below 2× for small text).
  const stageScale = useStageScale();
  const resolution = Math.max(2, Math.ceil((window.devicePixelRatio || 1) * stageScale * 4) / 4);

  useEffect(() => {
    let cancelled = false;
    setInfo({ phases: '', value: '' });
    const app = new Application();
    (async () => {
      await app.init({ width, height, backgroundAlpha: 0, antialias: true, autoStart: false, resolution, autoDensity: true, preference: 'webgl', useBackBuffer: true, preserveDrawingBuffer: true });
      await Promise.all([...['500', '600', '700'].map(weight => document.fonts.load(`${weight} 20px Rajdhani`)), loadGlyphs()]);
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

  const fitBackground = (current: { bg: Sprite }, w: number, h: number) => {
    const cover = Math.max(width / w, height / h);
    current.bg.scale.set(cover);
    current.bg.position.set((width - w * cover) / 2, (height - h * cover) / 2);
  };

  useEffect(() => {
    const current = scene.current;
    if (!current) return;
    if (backgroundVideo) {
      // The video is drawn inside the canvas, so glass blurs it and a future export sees it.
      const source = new VideoSource({ resource: backgroundVideo, autoPlay: false, autoLoad: true });
      const texture = new Texture({ source });
      const apply = () => {
        current.bg.texture = texture;
        fitBackground(current, backgroundVideo.videoWidth || width, backgroundVideo.videoHeight || height);
        setReady(r => r + 1);
      };
      if (backgroundVideo.readyState >= 1) apply();
      else backgroundVideo.addEventListener('loadedmetadata', apply, { once: true });
      return () => {
        backgroundVideo.removeEventListener('loadedmetadata', apply);
        current.bg.texture = Texture.EMPTY;
        texture.destroy(false);
      };
    }
    if (!background) {
      current.bg.texture = Texture.EMPTY;
      setReady(r => r + 1);
      return;
    }
    let alive = true;
    loadTexture(background).then(texture => {
      if (!alive) return;
      current.bg.texture = texture;
      fitBackground(current, texture.width, texture.height);
      setReady(r => r + 1);
    });
    return () => { alive = false; };
  }, [background, backgroundVideo, sceneId, width, height]);

  useEffect(() => {
    const current = scene.current;
    if (!current || current.app.renderer.resolution === resolution) return;
    current.app.renderer.resize(width, height, resolution);
    setReady(r => r + 1);
  }, [resolution, sceneId]);

  // One drawn element per item key (rebuilt on theme change); photos load as they change.
  const signature = items.map(item => `${item.key}:${item.kind}`).join('|');
  const photos = items.map(item => `${item.key}=${item.kind === 'player' ? item.input.record.photo : item.kind === 'rail' ? item.input.player.record.photo : item.kind === 'board' ? item.photo : ''}`).join('|');
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
    if (backgroundVideo && current.bg.texture.source instanceof VideoSource) current.bg.texture.source.update();
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
