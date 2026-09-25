import { useEffect, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { upsertKey, type Track } from '../../core/tracks';
import { MODULE_STATES, type ModuleState } from '../../hud/kit/module';
import type { HudItem } from '../../hud/registry';
import { HudCanvas } from '../../hud/v2/HudCanvas';
import type { PlayerInput } from '../../hud/v2/player';
import { BACKGROUND, PORTRAIT, key, keyId, useClock, useKit } from './kitState';

const RECORD = { name: 'KOALITIC', level: 12, nextLevelXp: 5000, photo: PORTRAIT };
const BASE_INPUT: PlayerInput = { record: RECORD, enterAt: 0, exitAt: null, state: [key(0, 'Open')], xp: [key(0, 3250)], pulses: [] };
const STATE_LABEL: Record<ModuleState, string> = { Compact: 'COMPACT', Open: 'OPEN', Pinned: 'PINNED', Hover: 'HOVER', Disabled: 'DISABLED' };
const VIEW = { width: 600, height: 300 };

/** Animation clips: each shows one kit animation on this component, looped and scrubbable. */
const CLIPS: readonly { id: string; label: string; note: string; length: number; input: PlayerInput; marks: readonly { at: number; label: string }[] }[] = [
  { id: 'enter', label: 'ENTER', note: 'Born from a line, built in reading order, corners lock.', length: 2200, input: { ...BASE_INPUT, enterAt: 200 }, marks: [{ at: 200, label: 'ENTER' }] },
  { id: 'exit', label: 'EXIT', note: 'Glitch burst, content goes, collapse to a line that burns out.', length: 1600, input: { ...BASE_INPUT, enterAt: -5000, exitAt: 400 }, marks: [{ at: 400, label: 'EXIT' }] },
  { id: 'compact', label: 'OPEN ↔ COMPACT', note: 'State transition: folds to a row and opens again.', length: 2600, input: { ...BASE_INPUT, enterAt: -5000, state: [key(0, 'Open'), key(500, 'Compact'), key(1600, 'Open')] }, marks: [{ at: 500, label: 'COMPACT' }, { at: 1600, label: 'OPEN' }] },
  { id: 'pinned', label: '→ PINNED', note: 'State transition: pin and red corner.', length: 2600, input: { ...BASE_INPUT, enterAt: -5000, state: [key(0, 'Open'), key(500, 'Pinned'), key(1700, 'Open')] }, marks: [{ at: 500, label: 'PINNED' }, { at: 1700, label: 'OPEN' }] },
  { id: 'hover', label: '→ HOVER', note: 'State transition: cyan edge and side bar light up.', length: 2600, input: { ...BASE_INPUT, enterAt: -5000, state: [key(0, 'Open'), key(500, 'Hover'), key(1700, 'Open')] }, marks: [{ at: 500, label: 'HOVER' }, { at: 1700, label: 'OPEN' }] },
  { id: 'disabled', label: '→ DISABLED', note: 'State transition: dims and calms down.', length: 2600, input: { ...BASE_INPUT, enterAt: -5000, state: [key(0, 'Open'), key(500, 'Disabled'), key(1700, 'Open')] }, marks: [{ at: 500, label: 'DISABLED' }, { at: 1700, label: 'OPEN' }] },
  { id: 'xp', label: 'XP REACTION', note: 'Reaction: +150 XP white-hot, glitch, bar with a hot head.', length: 2200, input: { ...BASE_INPUT, enterAt: -5000, xp: [key(0, 3250), key(500, 3400)] }, marks: [{ at: 500, label: '+150 XP' }] },
  {
    id: 'demo', label: 'FULL DEMO', note: 'Everything together, as an episode would key it.', length: 8000,
    input: { ...BASE_INPUT, enterAt: 300, exitAt: 7000, state: [key(0, 'Open'), key(4300, 'Compact'), key(5500, 'Open')], xp: [key(0, 3250), key(2700, 3400)] },
    marks: [{ at: 300, label: 'ENTER' }, { at: 2700, label: '+150 XP' }, { at: 4300, label: 'COMPACT' }, { at: 5500, label: 'OPEN' }, { at: 7000, label: 'EXIT' }],
  },
];

declare global {
  interface Window { __kgPlayer?: { seek: (ms: number) => void } }
}

type Mode = 'states' | 'animations' | 'edit';

/**
 * PLAYER PROFILE in the catalog. STATES: how it rests in each state, each with
 * its ambient loop. ANIMATIONS: how it arrives, leaves, changes state and
 * reacts. EDIT VALUES: change its values; each change becomes a keyframe.
 */
export function PlayerPage() {
  const { theme, motion } = useKit();
  const [mode, setMode] = useState<Mode>('states');
  const states = useStates(mode === 'states');
  const animations = useAnimations(mode === 'animations');
  const edit = useEdit(mode === 'edit');
  useEffect(() => {
    window.__kgPlayer = { seek: ms => { setMode('animations'); animations.seekDemo(ms); } };
    return () => { delete window.__kgPlayer; };
  });
  const current = mode === 'states' ? states : mode === 'animations' ? animations : edit;
  const tabs: [Mode, string][] = [['states', 'STATES'], ['animations', 'ANIMATIONS'], ['edit', 'EDIT VALUES']];
  return (
    <div className="kg-page">
      <div className="kg-page__tabs" role="tablist">
        {tabs.map(([id, text]) => (
          <button type="button" role="tab" key={id} className={mode === id ? 'is-active' : ''} onClick={() => setMode(id)} data-testid={`player-mode-${id}`}>{text}</button>
        ))}
      </div>
      <div className="kg-page__row">
        <div className="kg-page__view" data-testid="player-preview" style={{ width: current.width, height: VIEW.height }}>
          <HudCanvas width={current.width} height={VIEW.height} background={BACKGROUND} items={current.items} theme={theme} motion={motion} />
          {current.overlay}
        </div>
        {current.side}
      </div>
      {current.below}
    </div>
  );
}

/** Every state at rest, side by side, each running its ambient loop. */
function useStates(active: boolean) {
  const { t } = useClock(active);
  const cols = 3, scale = 0.72, cellW = 318, cellH = 146;
  const items: HudItem[] = MODULE_STATES.map((state, i) => ({
    key: `state-${state}`, kind: 'player', t: 4000 + t,
    input: { ...BASE_INPUT, state: [key(0, state)] },
    x: 16 + (i % cols) * cellW, y: 30 + Math.floor(i / cols) * cellH, scale,
  }));
  const overlay = (
    <div className="kg-page__labels">
      {MODULE_STATES.map((state, i) => <span key={state} style={{ left: 16 + (i % cols) * cellW, top: 8 + Math.floor(i / cols) * cellH }}>{STATE_LABEL[state]}</span>)}
    </div>
  );
  const side = null;
  const below = <p className="kg-page__note">Each state at rest. The ambient loop (sheen, micro-glitch, flicker) runs by itself in every state except DISABLED.</p>;
  return { width: 960, items, overlay, side, below };
}

function useAnimations(active: boolean) {
  const [clipId, setClipId] = useState('enter');
  const [playing, setPlaying] = useState(true);
  const { t: clock } = useClock(active && playing);
  const [offset, setOffset] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const clip = CLIPS.find(c => c.id === clipId) ?? CLIPS[0]!;
  const t = held ?? (((clock + offset) % clip.length) + clip.length) % clip.length;
  const seek = (ms: number) => { setPlaying(false); setHeld(ms); };
  const choose = (id: string) => { setClipId(id); setHeld(null); setOffset(-clock); setPlaying(true); };
  const play = () => {
    if (playing) { setHeld(t); setPlaying(false); return; }
    setOffset((held ?? 0) - clock);
    setHeld(null);
    setPlaying(true);
  };
  const items: HudItem[] = [{ key: 'anim', kind: 'player', t, input: clip.input, x: 36, y: 50, scale: 1.3 }];
  const side = (
    <div className="kg-clips">
      <div className="kg-clips__heading">KIT ANIMATIONS ON THIS COMPONENT</div>
      {CLIPS.map(c => (
        <button type="button" key={c.id} className={c.id === clip.id ? 'is-on' : ''} onClick={() => choose(c.id)} data-testid={`clip-${c.id}`}>
          {c.label}
        </button>
      ))}
      <p>{clip.note}</p>
    </div>
  );
  const below = (
    <div className="kg-scrub">
      <button type="button" className="kg-chip" onClick={play} data-testid="player-play">{playing ? 'PAUSE' : 'PLAY'}</button>
      <div className="kg-scrub__bar">
        <input type="range" min={0} max={clip.length} step={1} value={Math.round(t)} aria-label="Time" onChange={event => seek(Number(event.target.value))} data-testid="player-scrub" />
        <div className="kg-scrub__marks">
          {clip.marks.map(mark => <button type="button" key={mark.label + mark.at} style={{ left: `${(mark.at / clip.length) * 100}%` }} onClick={() => seek(mark.at)}>{mark.label}</button>)}
        </div>
      </div>
      <span className="kg-scrub__time">{(t / 1000).toFixed(2)} s</span>
    </div>
  );
  const seekDemo = (ms: number) => { setClipId('demo'); seek(ms); };
  return { width: VIEW.width, items, overlay: null, side, below, seekDemo };
}

const fmtTime = (ms: number) => `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(1).padStart(4, '0')}`;

function useEdit(active: boolean) {
  const { t, now } = useClock(active);
  const [input, setInput] = useState<PlayerInput>({ ...BASE_INPUT, enterAt: 300 });
  const [log, setLog] = useState<string[]>([]);
  const record = (text: string) => setLog(list => [`${fmtTime(now.current)} · ${text}`, ...list].slice(0, 4));
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
  const enter = () => { setInput(s => ({ ...s, enterAt: at(), exitAt: null })); record('ENTER'); };
  const exit = () => {
    if (input.exitAt !== null) return;
    setInput(s => ({ ...s, exitAt: at() }));
    record('EXIT');
  };
  const onCommit = (fn: (value: string) => void) => ({
    onBlur: (e: FocusEvent<HTMLInputElement>) => fn(e.target.value),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') fn(e.currentTarget.value); },
  });

  const side = (
    <form className="kg-props" onSubmit={event => event.preventDefault()} data-testid="player-props">
      <label>NAME<input defaultValue={input.record.name} maxLength={18} {...onCommit(v => setRecord('name', v.toUpperCase().trim()))} data-testid="prop-name" /></label>
      <div className="kg-props__pair">
        <label>LEVEL<input type="number" defaultValue={input.record.level} min={1} {...onCommit(v => setRecord('level', Number(v)))} data-testid="prop-level" /></label>
        <label>XP<input type="number" defaultValue={xpNow} min={0} step={10} {...onCommit(v => setXp(Number(v)))} data-testid="prop-xp" /></label>
      </div>
      <label>NEXT LEVEL XP<input type="number" defaultValue={input.record.nextLevelXp} min={1} step={100} {...onCommit(v => setNext(Number(v)))} data-testid="prop-next" /></label>
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
    </form>
  );
  const below = (
    <div className="kg-log">
      <span>KEYFRAMES CREATED</span>
      <ol data-testid="prop-log">{log.length ? log.map(line => <li key={line}>{line}</li>) : <li className="is-empty">Change a value to create one</li>}</ol>
    </div>
  );
  return { width: VIEW.width, items: [{ key: 'edit', kind: 'player', t, input, x: 36, y: 50, scale: 1.3 }] as HudItem[], overlay: null, side, below };
}
