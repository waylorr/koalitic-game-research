import type { CSSProperties } from 'react';
import { easeInOutCubic, easeOutCubic, phase } from '../../core/motion';
import './playerModule.css';

/**
 * PLAYER module of the Left Rail (HUD v2 look, HUD v1 motion).
 * A pure function of episode time: the script says *when* things happen
 * (enter, XP gains, fold/open, exit); this file says *how* they look.
 * Timings follow ENTREGA_CLAUDE/06_MOVIMIENTO_HUD.md. No CSS transitions.
 */
export interface PlayerScript {
  readonly name: string;
  readonly level: number;
  readonly baseXp: number;
  readonly nextLevelXp: number;
  readonly enterAt: number;
  readonly exitAt: number | null;
  readonly xpGains: readonly { at: number; amount: number }[];
  readonly folds: readonly { at: number; folded: boolean }[];
}

export const PLAYER_W = 360;
const H_OPEN = 150;
const H_FOLDED = 50;
const TAB_X = 146;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t: number, start: number, duration: number) => clamp01((t - start) / duration);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const GLYPHS = 'ABCDEFGHJKLMNPRSTUVXYZ0123456789#%<>/=';

/** Decode effect: settled letters from the left, a few scrambling glyphs ahead of them. */
function decode(text: string, p: number, t: number, seed: number): string {
  if (p >= 1) return text;
  if (p <= 0) return '';
  const settled = p * text.length;
  const tick = Math.floor(t / 45);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (i < Math.floor(settled) || ch === ' ') out += ch;
    else if (i < settled + 3) out += GLYPHS[Math.floor(hash(seed * 97 + i * 13 + tick) * GLYPHS.length)];
  }
  return out;
}

/** 0 = open, 1 = folded; each change eases from wherever the previous one was. */
function foldAmount(t: number, folds: PlayerScript['folds']): number {
  let f = 0;
  for (const change of folds) {
    if (change.at > t) break;
    f += ((change.folded ? 1 : 0) - f) * easeInOutCubic(seg(t, change.at, 380));
  }
  return f;
}

/** XP shown at t (the bar and the figure read this single value) and how hot the bar head is. */
function xpAt(t: number, script: PlayerScript, introFill: number) {
  let xp = script.baseXp * introFill;
  let heat = introFill > 0 && introFill < 1 ? 1 : 0;
  for (const gain of script.xpGains) {
    const p = seg(t, gain.at + 150, 650);
    xp += gain.amount * easeOutCubic(p);
    const since = t - (gain.at + 150);
    if (since >= 0) heat = Math.max(heat, p < 1 ? 1 : Math.exp(-(since - 650) / 260));
  }
  return { xp, heat };
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

function framePath(h: number): string {
  const tab = Math.min(14, h * 0.45);
  const cut = Math.min(12, h * 0.4);
  return `M0.5 0.5 H${TAB_X} L${TAB_X + tab} ${tab} H${PLAYER_W - 0.5} V${h - cut} L${PLAYER_W - cut} ${h - 0.5} H0.5 Z`;
}
function framePolygon(h: number): string {
  const tab = Math.min(14, h * 0.45);
  const cut = Math.min(12, h * 0.4);
  return `polygon(0 0, ${TAB_X}px 0, ${TAB_X + tab}px ${tab}px, 100% ${tab}px, 100% ${h - cut}px, ${PLAYER_W - cut}px ${h}px, 0 ${h}px)`;
}

export function PlayerModule({ t, script, style }: { t: number; script: PlayerScript; style?: CSSProperties }) {
  const e = t - script.enterAt;
  const x = script.exitAt === null ? -1 : t - script.exitAt;
  if (e < 0 || x >= 620) return <div className="pm" style={{ ...style, height: H_OPEN }} data-testid="player-module" data-phase="hidden" />;

  // Birth: line → bar → panel → corners (measured on the v1 NIKON chip and MAIN QUEST).
  const lineP = easeOutCubic(seg(e, 0, 140));
  const barP = easeOutCubic(seg(e, 140, 160));
  const growP = easeOutCubic(seg(e, 300, 320));
  const cornersIn = easeOutCubic(seg(e, 560, 160));
  const fold = foldAmount(t, script.folds);
  const target = lerp(H_OPEN, H_FOLDED, fold);
  let h = e < 140 ? 2 : e < 300 ? lerp(2, 14, barP) : lerp(14, target, growP);

  // Exit: corners and content first, then collapse to a line that burns out.
  const cornersOut = x >= 0 ? seg(x, 0, 100) : 0;
  const contentOut = x >= 0 ? seg(x, 0, 160) : 0;
  const shrinkP = x >= 0 ? easeInOutCubic(seg(x, 80, 260)) : 0;
  const lineOut = x >= 0 ? seg(x, 340, 260) : 0;
  h = lerp(h, 2, shrinkP);

  const showLine = e < 320 || x >= 300;
  const lineScale = x >= 300 ? 1 - easeInOutCubic(lineOut) : lineP;
  const lineOpacity = x >= 300 ? 1 - lineOut * 0.6 : 1 - seg(e, 260, 60);
  const glass = e < 140 ? 0 : 1 - (x >= 300 ? 1 : 0);
  const corners = cornersIn * (1 - cornersOut);
  const content = 1 - contentOut;
  const openContent = content * (1 - clamp01(fold * 2.2));
  const foldedContent = content * clamp01((fold - 0.55) / 0.45);

  // Content reveals, in reading order.
  const header = decode('PLAYER', seg(e, 420, 260), t, 1);
  const portraitReveal = seg(e, 480, 200);
  const portraitFlash = 1 - easeOutCubic(seg(e, 480, 460));
  const ambientGlitch = phase(t + 3100, 9000) < 0.014;
  const name = decode(script.name, ambientGlitch ? 0.55 : seg(e, 600, 360), t, 2);
  const levelIn = easeOutCubic(seg(e, 720, 260));
  const trackIn = easeOutCubic(seg(e, 780, 220));
  const introFill = easeOutCubic(seg(e, 900, 700));
  const { xp, heat } = xpAt(t, script, introFill);
  const ratio = clamp01(xp / script.nextLevelXp);
  const xpTextIn = seg(e, 900, 200);

  // Ambient: a diagonal sheen crosses the glass every 7 s.
  const sheen = phase(t, 7000);
  const sheenX = sheen < 0.16 ? lerp(-40, 130, sheen / 0.16) : -60;

  const gains = script.xpGains
    .map(gain => ({ gain, l: t - gain.at }))
    .filter(({ l }) => l >= 0 && l < 1400);

  return (
    <div className="pm" style={{ ...style, height: H_OPEN }} data-testid="player-module" data-phase={x >= 0 ? 'exit' : e < 720 ? 'enter' : fold > 0.5 ? 'folded' : 'open'}>
      {glass > 0 && (
        <div className="pm__glass" style={{ height: h, clipPath: framePolygon(h) }}>
          <div className="pm__sheen" style={{ left: `${sheenX}%` }} />
        </div>
      )}
      {glass > 0 && (
        <svg className="pm__frame" width={PLAYER_W} height={h} viewBox={`0 0 ${PLAYER_W} ${h}`}>
          <path d={framePath(h)} />
          <line className="pm__redtick" x1={PLAYER_W - 70} y1={Math.min(14, h * 0.45)} x2={PLAYER_W - 8} y2={Math.min(14, h * 0.45)} style={{ opacity: corners }} />
        </svg>
      )}
      {showLine && (
        <div className="pm__line" style={{ transform: `scaleX(${lineScale})`, opacity: lineOpacity, transformOrigin: x >= 300 ? '100% 50%' : '0 50%', top: x >= 300 ? h / 2 - 1 : 0 }}>
          {x >= 300 && <i className="pm__spark" style={{ left: `${lerp(10, 90, lineOut)}%` }} />}
        </div>
      )}
      <span className="pm__corner pm__corner--tl" style={{ opacity: corners, transform: `translate(${-8 * (1 - cornersIn)}px, ${-8 * (1 - cornersIn)}px)` }} />
      <span className="pm__corner pm__corner--br" style={{ opacity: corners, top: h - 10, transform: `translate(${8 * (1 - cornersIn)}px, ${8 * (1 - cornersIn)}px)` }} />

      <div className="pm__content" style={{ clipPath: `inset(0 0 ${H_OPEN - h}px 0)`, opacity: content }}>
        <div className="pm__header">
          <i className="pm__slash" style={{ transform: `skewX(-24deg) scaleY(${seg(e, 400, 120)})` }} />
          <span>{header}</span>
        </div>

        <div className="pm__open" style={{ opacity: openContent }}>
          <div className="pm__portrait" style={{ clipPath: `inset(0 0 ${(1 - portraitReveal) * 100}% 0)` }}>
            <img src={`${import.meta.env.BASE_URL}hud/player-portrait.jpg`} alt="" style={{ filter: `brightness(${1 + 2.4 * portraitFlash}) saturate(${1 - 0.6 * portraitFlash})` }} />
            <i className="pm__flash" style={{ opacity: portraitFlash * 0.75 }} />
            <b className="pm__bracket pm__bracket--tl" /><b className="pm__bracket pm__bracket--br" />
          </div>
          <div className="pm__name">{name}</div>
          <div className="pm__level" style={{ opacity: levelIn, transform: `translateX(${(1 - levelIn) * -10}px)` }}>
            LEVEL <b>{script.level}</b>
          </div>
          <svg className="pm__emblem" viewBox="0 0 24 22" style={{ opacity: levelIn * 0.8 }}>
            <path d="M12 1 L23 21 H1 Z M12 7 L18 18 H6 Z" />
          </svg>
          <div className="pm__track" style={{ transform: `scaleX(${trackIn})` }}>
            <div className="pm__fill" style={{ width: `${ratio * 100}%` }}>
              <i className="pm__head" style={{ opacity: 0.25 + 0.75 * heat, boxShadow: `0 0 ${4 + 10 * heat}px rgba(255,255,255,${0.5 + 0.5 * heat}), 0 0 ${8 + 22 * heat}px rgba(88,255,142,${0.4 + 0.6 * heat})` }} />
            </div>
          </div>
          <div className="pm__xp" style={{ opacity: xpTextIn }}>
            {fmt(xp)} / {fmt(script.nextLevelXp)} XP
          </div>
          {gains.map(({ gain, l }) => {
            const pop = easeOutCubic(seg(l, 0, 120));
            const cool = seg(l, 120, 330);
            const out = seg(l, 1000, 400);
            return (
              <div
                key={gain.at}
                className="pm__gain"
                style={{
                  opacity: pop * (1 - out),
                  transform: `translateY(${-14 * easeOutCubic(seg(l, 300, 1100))}px) scale(${lerp(1.35, 1, pop)})`,
                  color: `rgb(${Math.round(lerp(255, 88, cool))}, 255, ${Math.round(lerp(255, 142, cool))})`,
                  textShadow: `0 0 ${lerp(16, 6, cool)}px rgba(${cool < 1 ? '255,255,255' : '88,255,142'}, 0.9)`,
                }}
              >
                +{gain.amount} XP
              </div>
            );
          })}
        </div>

        <div className="pm__folded" style={{ opacity: foldedContent }}>
          <span className="pm__folded-level">LVL <b>{script.level}</b></span>
          <div className="pm__folded-track"><div className="pm__fill" style={{ width: `${ratio * 100}%` }} /></div>
        </div>
      </div>
    </div>
  );
}
