import type { Container, Texture } from 'pixi.js';
import { PiecesBoard } from './kit/board';
import { SamplePixi, evaluateSample, type SampleInput } from './kit/sample';
import type { MotionKnobs, Theme } from './kit/theme';
import { PlayerPixi } from './v2/PlayerPixi';
import { evaluatePlayer, type PlayerInput } from './v2/player';

/**
 * Registry of HUD elements: how to create, evaluate and draw each kind.
 * A new component is programmed outside the app and enters here (CLAUDE.md);
 * canvases, the catalog and later the editor only talk to this table.
 */
export type HudItem = { readonly key: string; readonly x: number; readonly y: number; readonly scale: number; readonly t: number } & (
  | { readonly kind: 'player'; readonly input: PlayerInput }
  | { readonly kind: 'sample'; readonly input: SampleInput }
  | { readonly kind: 'board'; readonly photo: string }
);

export interface Drawn {
  readonly root: Container;
  /** Phase and shown value for tests and labels. */
  draw(item: HudItem, k: MotionKnobs): { phase: string; value: number | null };
  photoUrl(item: HudItem): string | null;
  readonly photo?: string;
  setPhoto?(url: string, texture: Texture): void;
}

export function createDrawn(kind: HudItem['kind'], theme: Theme): Drawn {
  if (kind === 'player') {
    const player = new PlayerPixi(theme);
    return {
      root: player.root,
      draw(item, k) {
        if (item.kind !== 'player') return { phase: 'hidden', value: null };
        const frame = evaluatePlayer(item.t, item.input, k);
        player.setPlacement(item.x, item.y, item.scale);
        player.update(frame, item.input, k);
        return { phase: frame?.phase ?? 'hidden', value: frame ? Math.round(frame.xp) : null };
      },
      photoUrl: item => (item.kind === 'player' ? item.input.record.photo : null),
      get photo() { return player.photo; },
      setPhoto: (url, texture) => player.setPhoto(url, texture),
    };
  }
  if (kind === 'sample') {
    const sample = new SamplePixi(theme);
    return {
      root: sample.root,
      draw(item, k) {
        if (item.kind !== 'sample') return { phase: 'hidden', value: null };
        const frame = evaluateSample(item.t, item.input, k);
        sample.setPlacement(item.x, item.y, item.scale);
        sample.update(frame, item.input, k);
        return { phase: frame?.phase ?? 'hidden', value: frame ? Math.round(frame.value) : null };
      },
      photoUrl: () => null,
    };
  }
  const board = new PiecesBoard(theme);
  return {
    root: board.root,
    draw(item, k) {
      board.root.position.set(item.x, item.y);
      board.root.scale.set(item.scale);
      board.update(item.t, k);
      return { phase: 'board', value: null };
    },
    photoUrl: item => (item.kind === 'board' ? item.photo : null),
    get photo() { return board.photo; },
    setPhoto: (url, texture) => board.setPhoto(url, texture),
  };
}
