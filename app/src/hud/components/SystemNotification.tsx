import { memo } from 'react';
import { clamp01 } from '../../core/time';
import { easeOutCubic, phase } from '../../core/motion';
import type { OverlayFrame } from '../../core/evaluate';

const LINE = 'M0 0 L-44 -108';
const LINE_LENGTH = 116;
const stage = (localT: number, from: number, duration: number) => easeOutCubic(clamp01((localT - from) / duration));

/**
 * POV overlay anchored manually on the footage. The reveal order (anchor → line
 * → box → text) is computed from the clip's local time, so any instant renders
 * the same picture whether it was reached by playback or by a jump.
 */
export const SystemNotification = memo(function SystemNotification({ overlay, t }: { overlay: OverlayFrame; t: number }) {
  const { localT, presence, props } = overlay;
  const anchor = stage(localT, 0, 220);
  const line = stage(localT, 120, 260);
  const box = stage(localT, 260, 320);
  const pulse = phase(t, 1400);
  return (
    <div
      className="k-notice"
      data-testid="overlay-notification"
      style={{ left: `${overlay.x}%`, top: `${overlay.y}%`, opacity: presence, transform: `translateY(${(1 - presence) * -10}px)` }}
    >
      <svg width="1" height="1">
        <path className="k-notice__line" d={LINE} strokeDasharray={LINE_LENGTH} strokeDashoffset={LINE_LENGTH * (1 - line)} />
        <g transform={`scale(${anchor})`}>
          <circle className="k-notice__pulse" r={12 + 16 * pulse} opacity={1 - pulse} />
          <circle className="k-notice__ring" r={12} />
          <circle className="k-notice__dot" r={4} />
        </g>
      </svg>
      <div className="k-notice__box" style={{ clipPath: `inset(0 ${(1 - box) * 100}% 0 0)` }}>
        <svg className="k-notice__warn" viewBox="0 0 44 40"><path d="M22 3 42 37H2z M22 15v10 M22 30v1" /></svg>
        <div className="k-notice__title" style={{ opacity: stage(localT, 330, 200) }}>{props.title}</div>
        {props.lines.map((text, i) => (
          <div className="k-notice__text" key={i} style={{ opacity: stage(localT, 420 + i * 110, 220) }}>{text}</div>
        ))}
      </div>
    </div>
  );
});
