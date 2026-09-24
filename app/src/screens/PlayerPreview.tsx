import { useEffect, useRef, useState } from 'react';
import { PlayerCanvas } from '../hud/v2/PlayerCanvas';
import type { PlayerScript } from '../hud/v2/player';

const BASE = import.meta.env.BASE_URL;
const PORTRAIT = `${BASE}hud/player-portrait.jpg`;
const BACKGROUND = `${BASE}hud/preview-bg.jpg`;
const VIEW = { width: 440, height: 300, x: 22, y: 34, scale: 1.1 };

/** Demo script: the episode would decide these instants. */
const DEMO: PlayerScript = {
  name: 'KOALITIC', level: 12, baseXp: 3250, nextLevelXp: 5000, photo: PORTRAIT,
  enterAt: 300, exitAt: 7000,
  xpGains: [{ at: 2700, amount: 150 }],
  folds: [{ at: 4300, folded: true }, { at: 5500, folded: false }],
  edits: [],
};
const LOOP = 8000;
const MARKS = [
  { at: 300, label: 'ENTER' },
  { at: 2700, label: '+150 XP' },
  { at: 4300, label: 'FOLD' },
  { at: 5500, label: 'OPEN' },
  { at: 7000, label: 'EXIT' },
];

declare global {
  interface Window { __kgPlayer?: { seek: (ms: number) => void } }
}

/** Real-time clock for the preview (authoring only; the HUD itself never reads it). */
function useClock(running: boolean) {
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

const fmtTime = (ms: number) => `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(1).padStart(4, '0')}`;

type Mode = 'edit' | 'demo';

/** Catalog view of the PLAYER: edit its values live, or watch the scripted demo and scrub it. One canvas for both. */
export function PlayerPreview() {
  const [mode, setMode] = useState<Mode>('edit');
  const edit = useEditMode(mode === 'edit');
  const demo = useDemoMode(mode === 'demo');
  useEffect(() => {
    window.__kgPlayer = { seek: ms => { setMode('demo'); demo.seek(ms); } };
    return () => { delete window.__kgPlayer; };
  });
  const current = mode === 'edit' ? edit : demo;
  return (
    <div className="kg-player-preview">
      <div className="kg-player-preview__modes" role="tablist">
        <button type="button" role="tab" className={mode === 'edit' ? 'is-active' : ''} onClick={() => setMode('edit')} data-testid="player-mode-edit">EDIT VALUES</button>
        <button type="button" role="tab" className={mode === 'demo' ? 'is-active' : ''} onClick={() => setMode('demo')} data-testid="player-mode-demo">MOTION DEMO</button>
      </div>
      <div className={mode === 'edit' ? 'kg-player-preview__row' : ''}>
        <div className="kg-player-preview__view" data-testid="player-preview">
          <PlayerCanvas t={current.t} script={current.script} background={BACKGROUND} {...VIEW} />
        </div>
        {current.controls}
      </div>
    </div>
  );
}

function useEditMode(active: boolean) {
  const { t, now } = useClock(active);
  const [script, setScript] = useState<PlayerScript>({ ...DEMO, enterAt: 300, exitAt: null, xpGains: [], folds: [], edits: [] });
  const [log, setLog] = useState<string[]>([]);
  const xpTarget = script.baseXp + script.xpGains.reduce((sum, gain) => sum + gain.amount, 0);
  const folded = script.folds.at(-1)?.folded ?? false;
  const record = (label: string) => setLog(list => [`${fmtTime(now.current)} · ${label}`, ...list].slice(0, 5));

  const setName = (name: string) => {
    if (!name || name === script.name) return;
    setScript(s => ({ ...s, name, edits: [...s.edits, { at: now.current, field: 'name' }] }));
    record(`NAME → ${name}`);
  };
  const setLevel = (level: number) => {
    if (!Number.isFinite(level) || level === script.level) return;
    setScript(s => ({ ...s, level, edits: [...s.edits, { at: now.current, field: 'level' }] }));
    record(`LEVEL → ${level}`);
  };
  const setXp = (xp: number) => {
    if (!Number.isFinite(xp) || xp === xpTarget) return;
    const amount = xp - xpTarget;
    setScript(s => ({ ...s, xpGains: [...s.xpGains, { at: now.current, amount }] }));
    record(`XP ${amount > 0 ? '+' : ''}${amount} → ${xp}`);
  };
  const setNext = (nextLevelXp: number) => {
    if (!Number.isFinite(nextLevelXp) || nextLevelXp <= 0) return;
    setScript(s => ({ ...s, nextLevelXp }));
    record(`NEXT LEVEL → ${nextLevelXp}`);
  };
  const setFolded = (value: boolean) => {
    if (value === folded) return;
    setScript(s => ({ ...s, folds: [...s.folds, { at: now.current, folded: value }] }));
    record(value ? 'STATE → FOLDED' : 'STATE → OPEN');
  };
  const setPhoto = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScript(s => ({ ...s, photo: url, edits: [...s.edits, { at: now.current, field: 'photo' }] }));
    record('PHOTO → ' + file.name.slice(0, 18));
  };
  const enter = () => {
    setScript(s => ({ ...s, enterAt: now.current, exitAt: null, baseXp: xpTarget, xpGains: [], folds: [], edits: [] }));
    record('ENTER');
  };
  const exit = () => {
    if (script.exitAt !== null) return;
    setScript(s => ({ ...s, exitAt: now.current }));
    record('EXIT');
  };

  const controls = (
      <form className="kg-props" onSubmit={event => event.preventDefault()} data-testid="player-props">
        <label>NAME<input defaultValue={script.name} maxLength={18} onBlur={e => setName(e.target.value.toUpperCase().trim())} onKeyDown={e => { if (e.key === 'Enter') setName(e.currentTarget.value.toUpperCase().trim()); }} data-testid="prop-name" /></label>
        <div className="kg-props__pair">
          <label>LEVEL<input type="number" defaultValue={script.level} min={1} onBlur={e => setLevel(Number(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') setLevel(Number(e.currentTarget.value)); }} data-testid="prop-level" /></label>
          <label>XP<input type="number" defaultValue={xpTarget} min={0} step={10} onBlur={e => setXp(Number(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') setXp(Number(e.currentTarget.value)); }} data-testid="prop-xp" /></label>
        </div>
        <label>NEXT LEVEL XP<input type="number" defaultValue={script.nextLevelXp} min={1} step={100} onBlur={e => setNext(Number(e.target.value))} data-testid="prop-next" /></label>
        <label className="kg-props__file">PHOTO<input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0])} data-testid="prop-photo" /></label>
        <div className="kg-props__label">STATE</div>
        <div className="kg-props__seg">
          <button type="button" className={!folded ? 'is-on' : ''} onClick={() => setFolded(false)} data-testid="prop-open">OPEN</button>
          <button type="button" className={folded ? 'is-on' : ''} onClick={() => setFolded(true)} data-testid="prop-folded">FOLDED</button>
        </div>
        <div className="kg-props__seg">
          <button type="button" onClick={enter} data-testid="prop-enter">ENTER</button>
          <button type="button" onClick={exit} data-testid="prop-exit">EXIT</button>
        </div>
        <div className="kg-props__label">KEYFRAMES CREATED</div>
        <ol className="kg-props__log" data-testid="prop-log">{log.length ? log.map(line => <li key={line}>{line}</li>) : <li className="is-empty">Change a value to create one</li>}</ol>
      </form>
  );
  return { t, script, controls };
}

function useDemoMode(active: boolean) {
  const [playing, setPlaying] = useState(true);
  const { t: clock } = useClock(active && playing);
  const [offset, setOffset] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const t = held ?? (clock + offset) % LOOP;
  const seek = (ms: number) => { setPlaying(false); setHeld(ms); };
  const play = () => {
    if (playing) { setHeld(t); setPlaying(false); return; }
    setOffset((held ?? 0) - clock);
    setHeld(null);
    setPlaying(true);
  };
  const controls = (
      <div className="kg-player-preview__controls">
        <button type="button" className="kg-chip" onClick={play} data-testid="player-play">{playing ? 'PAUSE' : 'PLAY'}</button>
        <div className="kg-player-preview__scrub">
          <input type="range" min={0} max={LOOP} step={1} value={Math.round(t)} aria-label="Time" onChange={event => seek(Number(event.target.value))} data-testid="player-scrub" />
          <div className="kg-player-preview__marks">
            {MARKS.map(mark => <button type="button" key={mark.label} style={{ left: `${(mark.at / LOOP) * 100}%` }} onClick={() => seek(mark.at)}>{mark.label}</button>)}
          </div>
        </div>
        <span className="kg-player-preview__time">{(t / 1000).toFixed(2)} s</span>
      </div>
  );
  return { t, script: DEMO, controls, seek };
}
