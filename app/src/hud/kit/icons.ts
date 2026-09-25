import type { Graphics } from 'pixi.js';

/**
 * HUD kit: line icons drawn as vectors, so they take the theme colours and
 * stay sharp at any scale. Each fits a 24×24 box centred on (cx, cy).
 */
export type GearIcon = 'camera' | 'lens' | 'cam360' | 'phone' | 'skates' | 'tripod' | 'drone';
export const GEAR_ICONS: readonly GearIcon[] = ['camera', 'lens', 'cam360', 'phone', 'skates', 'tripod', 'drone'];

export function drawIcon(g: Graphics, icon: GearIcon, cx: number, cy: number, size: number, color: number, alpha = 1) {
  const s = size / 24;
  const X = (x: number) => cx + x * s;
  const Y = (y: number) => cy + y * s;
  const stroke = { width: Math.max(1.2, 1.7 * s), color, alpha };
  switch (icon) {
    case 'camera':
      g.roundRect(X(-10), Y(-6), 20 * s, 14 * s, 2 * s).stroke(stroke);
      g.rect(X(-4), Y(-9), 7 * s, 3 * s).stroke(stroke);
      g.circle(X(0), Y(1), 4.2 * s).stroke(stroke);
      g.circle(X(6.5), Y(-3), 0.8 * s).fill({ color, alpha });
      break;
    case 'lens':
      g.circle(X(0), Y(0), 9.5 * s).stroke(stroke);
      g.circle(X(0), Y(0), 5.5 * s).stroke(stroke);
      g.circle(X(0), Y(0), 1.8 * s).fill({ color, alpha });
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.moveTo(X(Math.cos(a) * 9.5), Y(Math.sin(a) * 9.5)).lineTo(X(Math.cos(a) * 11.5), Y(Math.sin(a) * 11.5)).stroke(stroke);
      }
      break;
    case 'cam360':
      g.roundRect(X(-5), Y(-11), 10 * s, 22 * s, 4 * s).stroke(stroke);
      g.circle(X(0), Y(-6), 2.6 * s).stroke(stroke);
      g.circle(X(0), Y(3), 1.2 * s).fill({ color, alpha });
      break;
    case 'phone':
      g.roundRect(X(-6.5), Y(-11), 13 * s, 22 * s, 2.5 * s).stroke(stroke);
      g.circle(X(0), Y(-5), 3 * s).stroke(stroke);
      g.moveTo(X(-2.5), Y(8)).lineTo(X(2.5), Y(8)).stroke(stroke);
      break;
    case 'skates':
      g.moveTo(X(-8), Y(-10)).lineTo(X(-2), Y(-10)).lineTo(X(-1), Y(-2)).lineTo(X(8), Y(1)).lineTo(X(9), Y(5)).lineTo(X(-8), Y(5)).closePath().stroke(stroke);
      for (const x of [-6, -1, 4, 8]) g.circle(X(x), Y(9), 2 * s).stroke(stroke);
      break;
    case 'tripod':
      g.rect(X(-5), Y(-11), 10 * s, 5 * s).stroke(stroke);
      g.moveTo(X(0), Y(-6)).lineTo(X(0), Y(0)).stroke(stroke);
      g.moveTo(X(0), Y(0)).lineTo(X(-8), Y(11)).moveTo(X(0), Y(0)).lineTo(X(8), Y(11)).moveTo(X(0), Y(0)).lineTo(X(0), Y(11)).stroke(stroke);
      break;
    case 'drone':
      g.roundRect(X(-3.5), Y(-3), 7 * s, 6 * s, 1.5 * s).stroke(stroke);
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        g.moveTo(X(dx * 3), Y(dy * 2.5)).lineTo(X(dx * 8), Y(dy * 7)).stroke(stroke);
        g.ellipse(X(dx * 8), Y(dy * 7), 4 * s, 1.6 * s).stroke(stroke);
      }
      break;
  }
}
