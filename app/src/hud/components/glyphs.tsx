import type { GearIcon } from '../../core/model';

/** Provisional line icons (48×48 box). Final gear art arrives as transparent PNG/WebP assets. */
const GLYPHS: Record<GearIcon, string> = {
  camera: 'M8 17h8l3-5h10l3 5h8a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V20a3 3 0 0 1 3-3z M24 22a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M24 26a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M35 22h3',
  lens: 'M14 9h20v30H14z M14 16h20 M14 21h20 M11 39h26 M18 9V5h12v4 M20 27h8',
  cam360: 'M18 5h12a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z M24 10a5 5 0 1 0 0 10a5 5 0 1 0 0-10z M20 34h8',
  phone: 'M16 4h16a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z M26 9a5 5 0 1 0 0 10a5 5 0 1 0 0-10z M21 39h6',
  skates: 'M14 6h9v16l12 5a5 5 0 0 1 3 5v2H10V9a3 3 0 0 1 4-3z M10 34h28 M13 40a3 3 0 1 0 0.1 0z M22 40a3 3 0 1 0 0.1 0z M31 40a3 3 0 1 0 0.1 0z M14 14h6 M14 19h6',
};

export function GearGlyph({ icon, x, y, size = 46, dim = false }: { icon: GearIcon; x: number; y: number; size?: number; dim?: boolean }) {
  const s = size / 48;
  return <path className={dim ? 'k-glyph k-glyph--dim' : 'k-glyph'} d={GLYPHS[icon]} transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`} />;
}
