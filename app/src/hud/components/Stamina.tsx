import { memo } from 'react';
import { Panel } from './Panel';

const SEGMENTS = 12;
const CRITICAL_BELOW = 25;

/** Stamina: one value drives the number and the segmented bar. Critical look derives from a threshold. */
export const Stamina = memo(function Stamina({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const filled = (clamped / 100) * SEGMENTS;
  return (
    <div className={clamped < CRITICAL_BELOW ? 'is-critical' : undefined}>
      <Panel w={430} h={112}>
        <div className="k-stamina__row">
          <svg className="k-stamina__icon" viewBox="0 0 34 34">
            <path d="M20 4a3 3 0 1 0 0.1 0z M13 13l6-3 5 6 5 1 M19 10l-3 9 6 5-2 8 M16 19l-4 6H5" />
          </svg>
          <span className="k-stamina__label">STAMINA</span>
        </div>
        <div className="k-stamina__meter">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <div className="k-seg" key={i}>
              <div className="k-seg__fill" style={{ width: `${Math.min(1, Math.max(0, filled - i)) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="k-stamina__value" data-testid="stamina-value">{Math.round(clamped)}<small>%</small></div>
      </Panel>
    </div>
  );
});
