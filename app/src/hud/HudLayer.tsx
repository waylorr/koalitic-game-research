import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { clamp01 } from '../core/time';
import type { HudFrame } from '../core/evaluate';
import { PlayerProfile } from './components/PlayerProfile';
import { GearRadial } from './components/GearRadial';
import { Stamina } from './components/Stamina';
import { SystemNotification } from './components/SystemNotification';
import './hud.css';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

const CORNERS: readonly { style: CSSProperties; flip: string }[] = [
  { style: { left: 18, top: 18 }, flip: '' },
  { style: { right: 18, top: 18 }, flip: 'scale(-1,1)' },
  { style: { right: 18, bottom: 18 }, flip: 'scale(-1,-1)' },
  { style: { left: 18, bottom: 18 }, flip: 'scale(1,-1)' },
];

const Shell = memo(function Shell() {
  return (
    <>
      {CORNERS.map(({ style, flip }, i) => (
        <svg key={i} className="k-corner" viewBox="0 0 64 64" style={style}>
          <g transform={flip ? `translate(32 32) ${flip} translate(-32 -32)` : undefined}>
            <path d="M2 40V2h38" />
            <path className="k-corner__tip" d="M2 14V2h12" />
          </g>
        </svg>
      ))}
      <div className="k-logo">
        <svg className="k-logo__mark" viewBox="0 0 38 34"><path d="M10 0h9L9 34H0z M27 0h9L26 34h-9z" /></svg>
        <div>
          <div className="k-logo__word">KOALITIC</div>
          <div className="k-logo__tag">EXPLORE / CAPTURE / PLAY</div>
        </div>
      </div>
    </>
  );
});

/** Staggered reveal of rail modules, derived from openness only (so interruptions stay continuous). */
function moduleStyle(openness: number, index: number) {
  const local = clamp01(openness * 1.4 - index * 0.14);
  return local <= 0 ? { opacity: 0, visibility: 'hidden' as const } : { opacity: local, transform: `translateX(${((1 - local) * -70).toFixed(2)}px)` };
}

export interface HudInteraction {
  onSector?: (sector: number) => void;
}

/** Everything THE SYSTEM draws for one evaluated frame. Same code for template preview, episode and export. */
export function HudLayer({ frame, interaction }: { frame: HudFrame; interaction?: HudInteraction }) {
  const [hover, setHover] = useState<number | null>(null);
  const { openness, pin } = frame.leftRail;
  const railVisible = openness > 0.001;
  return (
    <div className="k-hud" data-testid="hud-layer" data-rail-state={frame.leftRail.state}>
      <Shell />
      {openness < 0.999 && (
        <div className="k-handle" style={{ opacity: 1 - clamp01(openness * 2) }} data-testid="rail-handle">
          <div className="k-handle__glass" />
          <svg viewBox="0 0 46 230"><path d="M1 0 45 14V216L1 230" fill="none" stroke="var(--k-cyan-soft)" strokeWidth="1.5" /><path d="M17 22l10 11-10 11" fill="none" stroke="var(--k-cyan)" strokeWidth="2.5" /></svg>
          <div className="k-handle__label">SYSTEM</div>
        </div>
      )}
      {railVisible && (
        <div className="k-rail" data-testid="left-rail">
          {pin > 0.001 && (
            <div className="k-rail__pin" style={{ opacity: pin }}>
              <svg viewBox="0 0 16 16"><path d="M5 1h6l-1 5 3 3H9l-1 6-1-6H3l3-3z" /></svg>PINNED
            </div>
          )}
          <div className="k-rail__module" style={moduleStyle(openness, 0)}>
            <PlayerProfile name={frame.player?.name ?? null} level={frame.player?.level ?? null} xp={frame.player?.xp ?? 0} xpGoal={frame.player?.xpGoal ?? 0} />
          </div>
          <div className="k-rail__module" style={moduleStyle(openness, 1)}>
            <GearRadial
              t={frame.t}
              weights={frame.radial.weights}
              selected={frame.radial.selected}
              progress={frame.radial.progress}
              slots={frame.radial.slots}
              hover={hover}
              onSector={interaction?.onSector}
              onHover={interaction?.onSector ? setHover : undefined}
            />
          </div>
          <div className="k-rail__module" style={moduleStyle(openness, 2)}>
            <Stamina value={frame.stamina.value} />
          </div>
        </div>
      )}
      {frame.overlays.map(overlay => <SystemNotification key={overlay.id} overlay={overlay} t={frame.t} />)}
    </div>
  );
}

/** Fixed 1920×1080 logical stage scaled uniformly into its container: what you see is what a future export renders. */
export function ScaledStage({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const node = outer.current;
    if (!node) return;
    const update = () => setScale(Math.min(node.clientWidth / STAGE_W, node.clientHeight / STAGE_H));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={outer} className="k-stage-outer">
      <div style={{ width: STAGE_W * scale, height: STAGE_H * scale, position: 'relative' }}>
        <div className="k-stage" data-testid="hud-stage" style={{ transform: `scale(${scale})` }}>{children}</div>
      </div>
    </div>
  );
}
