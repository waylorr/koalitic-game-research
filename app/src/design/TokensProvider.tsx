import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_MOTION, THEME, applyCssVariables, type MotionKnobs, type Theme } from './tokens';

/**
 * The live design tokens and motion knobs for the whole app. Mounted at the
 * app root: every HUD canvas reads them and they are written as CSS variables,
 * so a THEME change restyles the menus (SYSTEM UI) and the HUD at once. Kept in
 * this browser only (a convenience); saving them for real belongs to the HUD
 * Template.
 */
interface KitState {
  readonly theme: Theme;
  readonly motion: MotionKnobs;
  setTheme(theme: Theme): void;
  setMotion(motion: MotionKnobs): void;
  reset(): void;
}

const STORAGE = 'koalitic.kit.v2';
const Ctx = createContext<KitState | null>(null);

function load(): { theme: Theme; motion: MotionKnobs } {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const saved = JSON.parse(raw) as { theme?: Partial<Theme>; motion?: Partial<MotionKnobs> };
      return {
        theme: { ...THEME, ...saved.theme, color: { ...THEME.color, ...saved.theme?.color }, bars: { ...THEME.bars, ...saved.theme?.bars } },
        motion: { ...DEFAULT_MOTION, ...saved.motion },
      };
    }
  } catch {
    // Storage blocked or bad data: start from the defaults.
  }
  return { theme: THEME, motion: DEFAULT_MOTION };
}

export function TokensProvider({ children }: { children: ReactNode }) {
  const initial = useRef(load());
  const [theme, setTheme] = useState<Theme>(initial.current.theme);
  const [motion, setMotion] = useState<MotionKnobs>(initial.current.motion);
  useEffect(() => {
    applyCssVariables(theme);
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ theme, motion }));
    } catch {
      // Not saved; the catalog still works for this visit.
    }
  }, [theme, motion]);
  const reset = () => {
    setTheme(THEME);
    setMotion(DEFAULT_MOTION);
  };
  return <Ctx.Provider value={{ theme, motion, setTheme, setMotion, reset }}>{children}</Ctx.Provider>;
}

export function useKit(): KitState {
  const kit = useContext(Ctx);
  if (!kit) throw new Error('useKit outside TokensProvider');
  return kit;
}

/** Real-time clock for previews (authoring only; the HUD itself never reads it). */
export function useClock(running: boolean) {
  const [t, setT] = useState(0);
  const now = useRef(0);
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (stamp: number) => {
      if (last !== null) {
        now.current += stamp - last;
        setT(now.current);
      }
      last = stamp;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  return { t, now };
}

let serial = 0;
export const keyId = () => `k${++serial}`;
export const key = <V,>(t: number, v: V) => ({ id: keyId(), t, v });

export const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
export const fromHex = (s: string) => parseInt(s.slice(1), 16);

export const BASE = import.meta.env.BASE_URL;
export const PORTRAIT = `${BASE}hud/player-portrait.jpg`;
export const BACKGROUND = `${BASE}hud/preview-bg.jpg`;
