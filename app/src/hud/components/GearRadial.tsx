import { memo } from 'react';
import { phase } from '../../core/motion';
import type { GearSlotView } from '../../core/evaluate';
import { GearGlyph } from './glyphs';
import { Panel } from './Panel';

const C = 170, R = 158, INNER = 74, GAP = 2.4, SECTOR = 72;
const f = (n: number) => n.toFixed(2);
const polar = (radius: number, deg: number) => [C + radius * Math.cos((deg * Math.PI) / 180), C + radius * Math.sin((deg * Math.PI) / 180)] as const;

/** Sector k (0-based) is centred at -90° + k·72°, so sector 1 sits at the top. */
export function sectorAngles(k: number): { from: number; to: number; mid: number } {
  const mid = -90 + k * SECTOR;
  return { from: mid - SECTOR / 2 + GAP, to: mid + SECTOR / 2 - GAP, mid };
}
function sectorPath(k: number): string {
  const { from, to } = sectorAngles(k);
  const [x0, y0] = polar(R, from), [x1, y1] = polar(R, to), [x2, y2] = polar(INNER, to), [x3, y3] = polar(INNER, from);
  return `M${f(x0)} ${f(y0)} A${R} ${R} 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${INNER} ${INNER} 0 0 0 ${f(x3)} ${f(y3)} Z`;
}
function rimPath(k: number): string {
  const { from, to } = sectorAngles(k);
  const rr = R + 9;
  const [x0, y0] = polar(rr, from + 3), [x1, y1] = polar(rr, to - 3);
  return `M${f(x0)} ${f(y0)} A${rr} ${rr} 0 0 1 ${f(x1)} ${f(y1)}`;
}
const SECTOR_PATHS = Array.from({ length: 5 }, (_, k) => sectorPath(k));
const RIM_PATHS = Array.from({ length: 5 }, (_, k) => rimPath(k));

interface RadialProps {
  weights: readonly number[];
  selected: number;
  progress: number;
  slots: readonly (GearSlotView | null)[];
  hover: number | null;
  onSector?: (sector: number) => void;
  onHover?: (sector: number | null) => void;
}

const Sectors = memo(function Sectors({ weights, selected, progress, slots, hover, onSector, onHover }: RadialProps) {
  const current = slots[selected - 1] ?? null;
  return (
    <>
      <defs>
        <radialGradient id="k-sector-active" cx={C} cy={C} r={R} gradientUnits="userSpaceOnUse">
          <stop offset="0.45" stopColor="#1b8fd6" stopOpacity="0.35" />
          <stop offset="1" stopColor="#54e4ff" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      {SECTOR_PATHS.map((d, k) => {
        const w = weights[k] ?? 0;
        const slot = slots[k] ?? null;
        const { mid } = sectorAngles(k);
        const [gx, gy] = polar((R + INNER) / 2, mid);
        return (
          <g key={k}>
            <path
              d={d}
              className={`k-sector k-hit${hover === k + 1 ? ' is-hover' : ''}`}
              data-sector={k + 1}
              onClick={onSector ? () => onSector(k + 1) : undefined}
              onPointerEnter={onHover ? () => onHover(k + 1) : undefined}
              onPointerLeave={onHover ? () => onHover(null) : undefined}
            />
            {w > 0.001 && <path d={d} className="k-sector__active" opacity={w} />}
            {w > 0.001 && <path d={RIM_PATHS[k]} className="k-sector__rim" opacity={w} />}
            {slot ? <GearGlyph icon={slot.icon} x={gx} y={gy} /> : <GearGlyph icon="camera" x={gx} y={gy} size={30} dim />}
          </g>
        );
      })}
      <circle className="k-radial__core" cx={C} cy={C} r={INNER - 8} />
      <g opacity={0.35 + 0.65 * progress}>
        {current && <GearGlyph icon={current.icon} x={C} y={C - 20} size={50} />}
        <text className="k-radial__name" x={C} y={C + 24} data-testid="radial-name">{current?.name ?? 'EMPTY SLOT'}</text>
        <text className="k-radial__spec" x={C} y={C + 42}>{current?.spec ?? ''}</text>
      </g>
    </>
  );
}, (a, b) =>
  a.selected === b.selected && a.progress === b.progress && a.hover === b.hover && a.onSector === b.onSector &&
  a.weights.every((w, i) => w === b.weights[i]) && a.slots.every((s, i) => s?.name === b.slots[i]?.name));

/** Gear Radial: five authored sectors, exact SVG hit areas, selection eased by the evaluator. */
export function GearRadial(props: RadialProps & { t: number }) {
  const spin = phase(props.t, 24_000) * 360;
  return (
    <Panel w={430} h={430} title="GEAR">
      <svg className="k-radial" viewBox="0 0 340 340" data-testid="gear-radial">
        <circle className="k-radial__ticks" cx={C} cy={C} r={R + 18} transform={`rotate(${f(spin)} ${C} ${C})`} />
        <circle className="k-radial__ring" cx={C} cy={C} r={R + 3} />
        <Sectors {...props} />
      </svg>
      <div className="k-radial__count">{String(props.selected).padStart(2, '0')} / 05</div>
    </Panel>
  );
}
