import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/**
 * The authoring app is laid out like a game menu: a fixed 1920×1080 canvas scaled
 * to fit the window, so every screen matches its 16:9 design. Outside the canvas the
 * active background continues, blurred, instead of black bars.
 */
export function Stage({ background, children }: { background: string; children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 0.5, x: 0, y: 0 });
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const update = () => {
      const w = node.clientWidth, h = node.clientHeight;
      const scale = Math.min(w / STAGE_W, h / STAGE_H);
      setFit({ scale, x: (w - STAGE_W * scale) / 2, y: (h - STAGE_H * scale) / 2 });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={viewport} className="kg-viewport">
      <div className="kg-bleed" style={{ backgroundImage: `url(${background})` }} />
      <div className="kg-stage" data-testid="stage" style={{ transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})` }}>
        {children}
      </div>
    </div>
  );
}

/** Background art of each screen, cross-faded when the screen changes. */
export function Backdrop({ images, active, dimmed }: { images: Record<string, string>; active: string; dimmed?: boolean }) {
  return (
    <div className={`kg-backdrop${dimmed ? ' is-dimmed' : ''}`} aria-hidden="true">
      {Object.entries(images).map(([id, url]) => (
        <img key={id} src={url} alt="" className={id === active ? 'is-active' : undefined} data-testid={id === active ? 'backdrop-active' : undefined} />
      ))}
    </div>
  );
}
