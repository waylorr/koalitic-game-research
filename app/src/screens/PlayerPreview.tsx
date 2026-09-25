import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { upsertKey, type Track } from '../core/tracks';
import { HudCanvas } from '../hud/v2/HudCanvas';
import { MODULE_STATES, type ModuleState, type PlayerInput } from '../hud/v2/player';

const BASE = import.meta.env.BASE_URL;
const PORTRAIT = `${BASE}hud/player-portrait.jpg`;
const BACKGROUND = `${BASE}hud/preview-bg.jpg`;
const VIEW = { width: 440, height: 300 };
const RECORD = { name: 'KOALITIC', level: 12, nextLevelXp: 5000, photo: PORTRAIT };

let keySerial = 0;
const keyId = () => `k${++keySerial}`;
const key = <V,>(t: number, v: V) => ({ id: keyId(), t, v });

/** Demo script: the episode would decide these instants with keyframes. */
const DEMO: PlayerInput = {
  record: RECORD,
  enterAt: 300,
  exitAt: 7000,
  state: [key(0, 'Open'), key(4300, 'Compact'), key(5500, 'Open')],
  xp: [key(0, 3250), key(2700, 3400)],
  pulses: [],
};
const LOOP = 8000;
const MARKS = [
  { at: 300, label: 'ENTER' },
  { at: 2700, label: '+150 XP' },
  { at: 4300, label: 'COMPACT' },
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

type Mode = 'edit' | 'states' | 'demo';
const STATE_LABEL: Record<ModuleState, string> = { Compact: 'COMPACT', Open: 'OPEN', Pinned: 'PINNED', Hover: 'HOVER', Disabled: 'DISABLED' };

/**
 * Catalog view of PLAYER PROFILE: edit its values (each change is a keyframe),
 * see every state side by side, or watch the scripted demo and scrub it.
 */
export function PlayerPreview() {
  const [mode, setMode] = useState<Mode>('edit');
  const edit = useEditMode(mode === 'edit');
  const states = useStatesMode(mode === 'states');
  const demo = useDemoMode(mode === 'demo');
  useEffect(() => {
    window.__kgPlayer = { seek: ms => { setMode('demo'); demo.seek(ms); } };
    return () => { delete window.__kgPlayer; };
  });
  const current = mode === 'edit' ? edit : mode === 'states' ? states : demo;
  const tabs: [Mode, string][] = [['edit', 'EDIT VALUES'], ['states', 'ALL STATES'], ['demo', 'MOTION DEMO']];
  return (
    <div className="kg-player-preview">
      <div className="kg-player-preview__modes" role="tablist">
        {tabs.map(([id, text]) => (
          <button type="button" role="tab" key={id} className={mode === id ? 'is-active' : ''} onClick={() => setMode(id)} data-testid={`player-mode-${id}`}>{text}</button>
        ))}
      </div>
      <div className={mode === 'edit' ? 'kg-player-preview__row' : ''}>
        <div className={`kg-player-preview__view${mode === 'states' ? ' is-wide' : ''}`} data-testid="player-preview">
          <HudCanvas width={mode === 'states' ? 716 : VIEW.width} height={VIEW.height} background={BACKGROUND} items={current.items} />
          {current.overlay}
        </div>
        {current.controls}
      </div>
    </div>
  );
}

function useEditMode(active: boolean) {
  const { t, now } = useClock(active);
  const [input, setInput] = useState<PlayerInput>({ ...DEMO, enterAt: 300, exitAt: null, state: [key(0, 'Open')], xp: [key(0, 3250)] });
  const [log, setLog] = useState<string[]>([]);
  const record = (text: string) => setLog(list => [`${fmtTime(now.current)} · ${text}`, ...list].slice(0, 5));
  const xpNow = input.xp.at(-1)?.v ?? 0;
  const stateNow = input.state.at(-1)?.v ?? 'Open';
  const at = () => Math.round(now.current);
  const addKey = <V,>(track: Track<V>, v: V) => upsertKey(track, at(), v, keyId);

  const setRecord = (field: 'name' | 'level', value: string | number) => {
    if (value === '' || (typeof value === 'number' && !Number.isFinite(value)) || input.record[field] === value) return;
    setInput(s => ({ ...s, record: { ...s.record, [field]: value }, pulses: [...s.pulses, { at: at(), field }] }));
    record(`${field.toUpperCase()} → ${value}`);
  };
  const setXp = (xp: number) => {
    if (!Number.isFinite(xp) || xp === xpNow) return;
    setInput(s => ({ ...s, xp: addKey(s.xp, xp) }));
    record(`XP ${xp > xpNow ? '+' : ''}${xp - xpNow} → ${xp}`);
  };
  const setNext = (nextLevelXp: number) => {
    if (!Number.isFinite(nextLevelXp) || nextLevelXp <= 0) return;
    setInput(s => ({ ...s, record: { ...s.record, nextLevelXp } }));
  };
  const setState = (state: ModuleState) => {
    if (state === stateNow) return;
    setInput(s => ({ ...s, state: addKey(s.state, state) }));
    record(`STATE → ${STATE_LABEL[state]}`);
  };
  const setPhoto = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setInput(s => ({ ...s, record: { ...s.record, photo: url }, pulses: [...s.pulses, { at: at(), field: 'photo' }] }));
    record('PHOTO → ' + file.name.slice(0, 18));
  };
  const enter = () => {
    setInput(s => ({ ...s, enterAt: at(), exitAt: null }));
    record('ENTER');
  };
  const exit = () => {
    if (input.exitAt !== null) return;
    setInput(s => ({ ...s, exitAt: at() }));
    record('EXIT');
  };
  const onEnter = (fn: (value: string) => void) => ({
    onBlur: (e: FocusEvent<HTMLInputElement>) => fn(e.target.value),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') fn(e.currentTarget.value); },
  });

  const controls = (
    <form className="kg-props" onSubmit={event => event.preventDefault()} data-testid="player-props">
      <label>NAME<input defaultValue={input.record.name} maxLength={18} {...onEnter(v => setRecord('name', v.toUpperCase().trim()))} data-testid="prop-name" /></label>
      <div className="kg-props__pair">
        <label>LEVEL<input type="number" defaultValue={input.record.level} min={1} {...onEnter(v => setRecord('level', Number(v)))} data-testid="prop-level" /></label>
        <label>XP<input type="number" defaultValue={xpNow} min={0} step={10} {...onEnter(v => setXp(Number(v)))} data-testid="prop-xp" /></label>
      </div>
      <label>NEXT LEVEL XP<input type="number" defaultValue={input.record.nextLevelXp} min={1} step={100} {...onEnter(v => setNext(Number(v)))} data-testid="prop-next" /></label>
      <label className="kg-props__file">PHOTO<input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0])} data-testid="prop-photo" /></label>
      <div className="kg-props__label">STATE</div>
      <div className="kg-props__states">
        {MODULE_STATES.map(state => (
          <button type="button" key={state} className={stateNow === state ? 'is-on' : ''} onClick={() => setState(state)} data-testid={`prop-state-${state.toLowerCase()}`}>{STATE_LABEL[state]}</button>
        ))}
      </div>
      <div className="kg-props__seg">
        <button type="button" onClick={enter} data-testid="prop-enter">ENTER</button>
        <button type="button" onClick={exit} data-testid="prop-exit">EXIT</button>
      </div>
      <div className="kg-props__label">KEYFRAMES CREATED</div>
      <ol className="kg-props__log" data-testid="prop-log">{log.length ? log.map(line => <li key={line}>{line}</li>) : <li className="is-empty">Change a value to create one</li>}</ol>
    </form>
  );
  return { items: [{ key: 'edit', t, input, x: 22, y: 34, scale: 1.1 }], controls, overlay: null };
}

/** Every state at rest, side by side, with the ambient loop running. */
function useStatesMode(active: boolean) {
  const { t } = useClock(active);
  const cols = 3, scale = 0.58, cellW = 238, cellH = 142;
  const items = MODULE_STATES.map((state, i) => ({
    key: `state-${state}`,
    t: 4000 + t,
    input: { ...DEMO, enterAt: 0, exitAt: null, state: [key(0, state)], xp: [key(0, 3250)] },
    x: 18 + (i % cols) * cellW,
    y: 34 + Math.floor(i / cols) * cellH,
    scale,
  }));
  const overlay = (
    <div className="kg-player-preview__labels">
      {MODULE_STATES.map((state, i) => (
        <span key={state} style={{ left: 18 + (i % cols) * cellW, top: 10 + Math.floor(i / cols) * cellH }}>{STATE_LABEL[state]}</span>
      ))}
    </div>
  );
  return { items, controls: null, overlay };
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
  return { items: [{ key: 'demo', t, input: DEMO, x: 22, y: 34, scale: 1.1 }], controls, overlay: null, seek };
}
