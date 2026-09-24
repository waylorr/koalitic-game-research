import { useEffect, useRef, useState } from 'react';
import { Application, Sprite, Texture } from 'pixi.js';
import { evaluatePlayer, type PlayerScript } from './player';
import { PlayerPixi } from './PlayerPixi';

async function loadTexture(url: string): Promise<Texture> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return Texture.from(image);
}

interface Props {
  readonly t: number;
  readonly script: PlayerScript;
  readonly width: number;
  readonly height: number;
  readonly background?: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

/**
 * Hosts the PixiJS PLAYER in a canvas. Rendering is manual (no ticker): the
 * canvas is redrawn only when t or the script change, from evaluatePlayer.
 */
export function PlayerCanvas({ t, script, width, height, background, x, y, scale }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<{ app: Application; player: PlayerPixi; bg: Sprite } | null>(null);
  const [ready, setReady] = useState(0);

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
      const player = new PlayerPixi({ backdropBlur: true });
      app.stage.addChild(bg, player.root);
      host.current?.appendChild(app.canvas);
      scene.current = { app, player, bg };
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
  }, [background, ready > 0, width, height]);

  useEffect(() => {
    const current = scene.current;
    if (!current || current.player.photo === script.photo) return;
    let alive = true;
    loadTexture(script.photo).then(texture => {
      if (!alive) return;
      current.player.setPhoto(script.photo, texture);
      setReady(r => r + 1);
    });
    return () => { alive = false; };
  }, [script.photo, ready > 0]);

  const frame = evaluatePlayer(t, script);
  useEffect(() => {
    const current = scene.current;
    if (!current) return;
    current.player.setPlacement(x, y, scale);
    current.player.update(frame, script);
    current.app.render();
  });

  return (
    <div
      ref={host}
      className="kg-pixi-host"
      style={{ width, height }}
      data-testid="player-module"
      data-phase={frame?.phase ?? 'hidden'}
      data-xp={frame ? Math.round(frame.xp) : ''}
      data-ready={ready > 0 ? 'yes' : 'no'}
    />
  );
}
