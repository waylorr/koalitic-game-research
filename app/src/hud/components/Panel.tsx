import type { CSSProperties, ReactNode } from 'react';

/** Angular glass panel: square top-left, cut top-right and bottom-left, red corner accent. */
export function Panel({ w, h, cut = 20, title, children, style }: {
  w: number;
  h: number;
  cut?: number;
  title?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const outline = `M0 0 H${w - cut} L${w} ${cut} V${h} H${cut} L0 ${h - cut} Z`;
  const polygon = `polygon(0 0, ${w - cut}px 0, ${w}px ${cut}px, ${w}px ${h}px, ${cut}px ${h}px, 0 ${h - cut}px)`;
  return (
    <div className="k-panel" style={{ width: w, height: h, ...style }}>
      <div className="k-panel__glass" style={{ clipPath: polygon }} />
      <svg className="k-panel__frame" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <path className="k-panel__line" d={outline} />
        <path className="k-panel__edge" d={`M${w - cut - 70} 0 H${w - cut} L${w} ${cut} V${cut + 36}`} />
        <path className="k-panel__accent" d={`M0 ${h - cut - 34} V${h - cut} L${cut} ${h} H${cut + 30}`} />
      </svg>
      {title && (
        <header className="k-panel__title">
          <Slash />
          {title}
        </header>
      )}
      <div className="k-panel__body">{children}</div>
    </div>
  );
}

export function Slash() {
  return (
    <svg className="k-slash" viewBox="0 0 16 16">
      <path d="M7 1h7L9 15H2z" />
    </svg>
  );
}
