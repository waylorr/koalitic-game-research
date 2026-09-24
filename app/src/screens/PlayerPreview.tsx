import { useEffect, useRef, useState } from 'react';
import { PlayerModule, type PlayerScript } from '../hud/v2/PlayerModule';

/** Demo script for the catalog: the episode would decide these instants. */
const SCRIPT: PlayerScript = {
  name: 'KOALITIC',
  level: 12,
  baseXp: 3250,
  nextLevelXp: 5000,
  enterAt: 300,
  exitAt: 7000,
  xpGains: [{ at: 2700, amount: 150 }],
  folds: [{ at: 4300, folded: true }, { at: 5500, folded: false }],
};
const LOOP = 8000;
const MARKS = [
  { at: SCRIPT.enterAt, label: 'ENTER' },
  { at: 2700, label: '+150 XP' },
  { at: 4300, label: 'FOLD' },
  { at: 5500, label: 'OPEN' },
  { at: 7000, label: 'EXIT' },
];

declare global {
  interface Window { __kgPlayer?: { seek: (ms: number) => void } }
}

/** Plays the module on its own clock; the slider scrubs to any instant. */
export function PlayerPreview() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : now - last.current;
      last.current = now;
      setT(prev => (prev + dt) % LOOP);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    window.__kgPlayer = { seek: ms => { setPlaying(false); setT(ms); } };
    return () => { delete window.__kgPlayer; };
  }, []);

  return (
    <div className="kg-player-preview">
      <div className="kg-player-preview__view" data-testid="player-preview">
        <img className="kg-player-preview__bg" src={`${import.meta.env.BASE_URL}hud/preview-bg.jpg`} alt="" />
        <PlayerModule t={t} script={SCRIPT} style={{ position: 'absolute', left: 36, top: 30, transform: 'scale(1.5)', transformOrigin: '0 0' }} />
      </div>
      <div className="kg-player-preview__controls">
        <button type="button" className="kg-chip" onClick={() => setPlaying(p => !p)} data-testid="player-play">{playing ? 'PAUSE' : 'PLAY'}</button>
        <div className="kg-player-preview__scrub">
          <input type="range" min={0} max={LOOP} step={1} value={Math.round(t)} aria-label="Time" onChange={event => { setPlaying(false); setT(Number(event.target.value)); }} data-testid="player-scrub" />
          <div className="kg-player-preview__marks">
            {MARKS.map(mark => (
              <button type="button" key={mark.label} style={{ left: `${(mark.at / LOOP) * 100}%` }} onClick={() => { setPlaying(false); setT(mark.at); }}>{mark.label}</button>
            ))}
          </div>
        </div>
        <span className="kg-player-preview__time">{(t / 1000).toFixed(2)} s</span>
      </div>
    </div>
  );
}
