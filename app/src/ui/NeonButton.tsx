import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export type NeonState = 'idle' | 'selected' | 'pressed' | 'disabled';

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setSize({ w: node.offsetWidth, h: node.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Octagonal outline: every corner cut at 45°. */
function octagon(x0: number, y0: number, x1: number, y1: number, c: number): string {
  return `M${x0 + c} ${y0} H${x1 - c} L${x1} ${y0 + c} V${y1 - c} L${x1 - c} ${y1} H${x0 + c} L${x0} ${y1 - c} V${y0 + c} Z`;
}

/**
 * KOALITIC menu button: cyan when idle, red when selected (mouse or keyboard), like a
 * game menu. `state` forces a look for the component catalog.
 */
export function NeonButton({ label, icon, selected, state, entering, delay = 0, size = 'menu', onSelect, onActivate, testId }: {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  state?: NeonState;
  entering?: boolean;
  delay?: number;
  size?: 'menu' | 'back' | 'catalog';
  onSelect?: () => void;
  onActivate?: () => void;
  testId?: string;
}) {
  const [ref, { w, h }] = useSize<HTMLButtonElement>();
  const look: NeonState = state ?? (selected ? 'selected' : 'idle');
  const cut = size === 'back' ? 11 : 15;
  const inset = size === 'back' ? 8 : 11;
  const ci = cut - 5;
  const ready = w > 0 && h > 0;
  const style = { '--delay': `${delay}s`, '--cut': `${cut}px` } as CSSProperties;
  return (
    <button
      ref={ref}
      type="button"
      className={`nb nb--${size} is-${look}${entering ? ' is-entering' : ''}`}
      style={style}
      data-testid={testId}
      data-state={look}
      disabled={look === 'disabled'}
      aria-current={look === 'selected' || undefined}
      onPointerEnter={onSelect}
      onFocus={onSelect}
      onClick={onActivate}
    >
      <span className="nb__glass" />
      <svg className="nb__frame" viewBox={`0 0 ${w || 1} ${h || 1}`} aria-hidden="true">
        {ready && (
          <>
            <path className="nb__edge" d={octagon(1, 1, w - 1, h - 1, cut)} pathLength={1} />
            <path className="nb__inner" d={octagon(inset, inset, w - inset, h - inset, ci)} />
            <path className="nb__bracket" d={`M${inset} ${inset + ci + 16} V${inset + ci} L${inset + ci} ${inset} H${inset + ci + 26}`} />
            <path className="nb__bracket" d={`M${w - inset} ${h - inset - ci - 16} V${h - inset - ci} L${w - inset - ci} ${h - inset} H${w - inset - ci - 26}`} />
          </>
        )}
      </svg>
      <span className="nb__sweep" />
      {icon && <span className="nb__icon" aria-hidden="true">{icon}</span>}
      <span className="nb__label">{label}</span>
    </button>
  );
}

export const Icons = {
  episodes: (
    <svg viewBox="0 0 40 40"><path d="M9 5 34 20 9 35Z" /></svg>
  ),
  configure: (
    <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8.5" /><circle cx="20" cy="20" r="2" /><path d="M20 4v8M20 28v8M4 20h8M28 20h8M5 5h6M5 5v6M35 5h-6M35 5v6M5 35h6M5 35v-6M35 35h-6M35 35v-6" /></svg>
  ),
  assets: (
    <svg viewBox="0 0 40 40"><ellipse cx="20" cy="9" rx="13" ry="4.5" /><path d="M7 9v22c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5V9" /><path d="M7 16.5c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5M7 24c0 2.5 5.8 4.5 13 4.5s13-2 13-4.5" /></svg>
  ),
  back: (
    <svg viewBox="0 0 40 40"><path d="M34 20H8M17 10 7 20l10 10" /></svg>
  ),
};
