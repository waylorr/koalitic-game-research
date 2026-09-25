import { useEffect, useRef, useState } from 'react';
import { Application, Sprite, Texture } from 'pixi.js';
import { DEFAULT_MOTION, type MotionKnobs } from '../kit/theme';
import { evaluatePlayer, type PlayerInput } from './player';
import { PlayerPixi } from './PlayerPixi';

async function loadTexture(url: string): Promise<Texture> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return Texture.from(image);
}

/** One HUD element placed on the canvas at its own time t. */
export interface HudItem {
  readonly key: string;
  readonly t: number;
  readonly input: PlayerInput;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

interface Props {
  readonly width: number;
  readonly height: number;
  readonly background?: string;
  readonly items: readonly HudItem[];
  readonly motion?: MotionKnobs;
}

/**
 * Hosts HUD elements in one PixiJS canvas. Rendering is manual (no ticker):
 * the canvas is redrawn only when the items change, from their evaluators.
 */
export function HudCanvas({ width, height, background, items, motion = DEFAULT_MOTION }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<{ app: Application; bg: Sprite; players: Map<string, PlayerPixi> } | null>(null);
  const [ready, setReady] = useState(0);
  /** Bumps each time a new Pixi scene is ready (the canvas is recreated when its size changes). */
  const [sceneId, setSceneId] = useState(0);

  useEffect(() => {
    let cancelled = false;
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
      scene.current = { app, bg, players: new Map() };
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

  // Keep one PlayerPixi per item key; load photos as they change.
  const photos = items.map(item => `${item.key}=${item.input.record.photo}`).join('|');
  useEffect(() => {
    const current = scene.current;
    if (!current) return;
    const keys = new Set(items.map(item => item.key));
    for (const [key, player] of current.players) {
      if (!keys.has(key)) {
        current.app.stage.removeChild(player.root);
        player.root.destroy({ children: true });
        current.players.delete(key);
      }
    }
    let alive = true;
    for (const item of items) {
      let player = current.players.get(item.key);
      if (!player) {
        player = new PlayerPixi();
        current.players.set(item.key, player);
        current.app.stage.addChild(player.root);
      }
      const url = item.input.record.photo;
      if (player.photo !== url) {
        const target = player;
        loadTexture(url).then(texture => {
          if (!alive) return;
          target.setPhoto(url, texture);
          setReady(r => r + 1);
        });
      }
    }
    return () => { alive = false; };
  }, [photos, sceneId]);

  const frames = items.map(item => evaluatePlayer(item.t, item.input, motion));
  useEffect(() => {
    const current = scene.current;
    if (!current) return;
    items.forEach((item, i) => {
      const player = current.players.get(item.key);
      if (!player) return;
      player.setPlacement(item.x, item.y, item.scale);
      player.update(frames[i]!, item.input, motion);
    });
    current.app.render();
  });

  const first = frames[0];
  const photosLoaded = scene.current !== null && items.every(item => scene.current!.players.get(item.key)?.photo === item.input.record.photo);
  return (
    <div
      ref={host}
      className="kg-pixi-host"
      style={{ width, height }}
      data-testid="player-module"
      data-phase={first?.phase ?? 'hidden'}
      data-phases={frames.map(frame => frame?.phase ?? 'hidden').join(',')}
      data-xp={first ? Math.round(first.xp) : ''}
      data-ready={ready > 0 && photosLoaded ? 'yes' : 'no'}
    />
  );
}
