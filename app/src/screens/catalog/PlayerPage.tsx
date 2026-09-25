import { useEffect, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { upsertKey, type Track } from '../../core/tracks';
import { MODULE_LAYOUTS, type ModuleLayout } from '../../hud/kit/module';
import type { HudItem } from '../../hud/registry';
import { HudCanvas } from '../../hud/v2/HudCanvas';
import type { PlayerInput } from '../../hud/v2/player';
import { BACKGROUND, PORTRAIT, key, keyId, useClock, useKit } from './kitState';

const RECORD = { name: 'KOALITIC', level: 12, nextLevelXp: 5000, photo: PORTRAIT };
const BASE_INPUT: PlayerInput = { record: RECORD, enterAt: 0, exitAt: null, layout: [key(0, 'Open')], hover: [], disabled: [], xp: [key(0, 3250)], pulses: [] };
const LAYOUT_LABEL: Record<ModuleLayout, string> = { Compact: 'COMPACT', Open: 'OPEN', Pinned: 'PINNED' };
const VIEW = { width: 620, height: 330 };

const DEMO_LENGTH = 9000;
const DEMO: PlayerInput = {
  ...BASE_INPUT,
  enterAt: 300,
  exitAt: 8000,
  layout: [key(0, 'Open'), key(4300, 'Compact'), key(6400, 'Open')],
  hover: [key(0, false), key(5200, true), key(5900, false)],
  xp: [key(0, 3250), key(2700, 3400)],
};
const DEMO_MARKS = [
  { at: 300, label: 'ENTER' },
  { at: 2700, label: '+150 XP' },
  { at: 4300, label: 'COMPACT' },
  { at: 5200, label: 'HOVER' },
  { at: 6400, label: 'OPEN' },
  { at: 8000, label: 'EXIT' },
];

declare global {
  interface Window { __kgPlayer?: { seek: (ms: number) => void } }
}

type Mode = 'edit' | 'demo' | 'states';

/**
 * PLAYER PROFILE in the catalog.
 * EDIT: try it like the episode editor will (values, state, enter/exit, reactions); every change is a keyframe.
 * DEMO: a scripted episode fragment with a time bar.
 * STATES: every state side by side, as a summary.
 */
export function PlayerPage() {
  const { theme, motion } = useKit();
  const [mode, setMode] = useState<Mode>('edit');
  const edit = useEdit(mode === 'edit');
  const demo = useDemo(mode === 'demo');
  const states = useStates(mode === 'states');
  useEffect(() => {
    window.__kgPlayer = { seek: ms => { setMode('demo'); demo.seek(ms); } };
    return () => { delete window.__kgPlayer; };
  });
  const current = mode === 'edit' ? edit : mode === 'demo' ? demo : states;
  const tabs: [Mode, string][] = [['edit', 'EDIT'], ['demo', 'DEMO'], ['states', 'ALL STATES']];
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

const fmtTime = (ms: number) => `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(1).padStart(4, '0')}`;

function useEdit(active: boolean) {
  const { t, now } = useClock(active);
  const [input, setInput] = useState<PlayerInput>({ ...BASE_INPUT, enterAt: 300 });
  const [log, setLog] = useState<string[]>([]);
  const record = (text: string) => setLog(list => [`${fmtTime(now.current)} · ${text}`, ...list].slice(0, 4));
  const xpNow = input.xp.at(-1)?.v ?? 0;
  const layoutNow = input.layout.at(-1)?.v ?? 'Open';
  const hoverNow = input.hover.at(-1)?.v ?? false;
  const disabledNow = input.disabled.at(-1)?.v ?? false;
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
  const setLayout = (layout: ModuleLayout) => {
    if (layout === layoutNow) return;
    setInput(s => ({ ...s, layout: addKey(s.layout, layout) }));
    record(`STATE → ${LAYOUT_LABEL[layout]}`);
  };
  const setFlag = (flag: 'hover' | 'disabled', on: boolean) => {
    if ((flag === 'hover' ? hoverNow : disabledNow) === on) return;
    setInput(s => ({ ...s, [flag]: addKey(s[flag], on) }));
    record(`${flag.toUpperCase()} → ${on ? 'ON' : 'OFF'}`);
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
      <fieldset>
        <legend>VALUES</legend>
        <label>NAME<input defaultValue={input.record.name} maxLength={18} {...onCommit(v => setRecord('name', v.toUpperCase().trim()))} data-testid="prop-name" /></label>
        <div className="kg-props__pair">
          <label>LEVEL<input type="number" defaultValue={input.record.level} min={1} {...onCommit(v => setRecord('level', Number(v)))} data-testid="prop-level" /></label>
          <label>XP<input key={xpNow} type="number" defaultValue={xpNow} min={0} step={10} {...onCommit(v => setXp(Number(v)))} data-testid="prop-xp" /></label>
          <label>NEXT LV XP<input type="number" defaultValue={input.record.nextLevelXp} min={1} step={100} {...onCommit(v => setNext(Number(v)))} data-testid="prop-next" /></label>
          <label className="kg-props__file">PHOTO<input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0])} data-testid="prop-photo" /></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>STATE</legend>
        <div className="kg-props__states">
          {MODULE_LAYOUTS.map(layout => (
            <button type="button" key={layout} className={layoutNow === layout ? 'is-on' : ''} onClick={() => setLayout(layout)} data-testid={`prop-state-${layout.toLowerCase()}`}>{LAYOUT_LABEL[layout]}</button>
          ))}
        </div>
        <div className="kg-props__flags">
          <button type="button" className={hoverNow ? 'is-on' : ''} onClick={() => setFlag('hover', !hoverNow)} data-testid="prop-hover">HOVER {hoverNow ? 'ON' : 'OFF'}</button>
          <button type="button" className={disabledNow ? 'is-on' : ''} onClick={() => setFlag('disabled', !disabledNow)} data-testid="prop-disabled">DISABLED {disabledNow ? 'ON' : 'OFF'}</button>
        </div>
      </fieldset>
      <fieldset>
        <legend>ENTER · EXIT · REACTIONS</legend>
        <div className="kg-props__states">
          <button type="button" onClick={enter} data-testid="prop-enter">ENTER</button>
          <button type="button" onClick={exit} data-testid="prop-exit">EXIT</button>
          <button type="button" onClick={() => setXp(xpNow + 150)} data-testid="prop-xp-plus">XP +150</button>
        </div>
      </fieldset>
    </form>
  );
  const below = (
    <div className="kg-log">
      <span>KEYFRAMES CREATED</span>
      <ol data-testid="prop-log">{log.length ? log.map(line => <li key={line}>{line}</li>) : <li className="is-empty">Change anything on the right: each change is a keyframe at the current time</li>}</ol>
    </div>
  );
  return { width: VIEW.width, items: [{ key: 'edit', kind: 'player', t, input, x: 40, y: 60, scale: 1.4 }] as HudItem[], overlay: null, side, below };
}

function useDemo(active: boolean) {
  const [playing, setPlaying] = useState(true);
  const { t: clock } = useClock(active && playing);
  const [offset, setOffset] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const t = held ?? (((clock + offset) % DEMO_LENGTH) + DEMO_LENGTH) % DEMO_LENGTH;
  const seek = (ms: number) => { setPlaying(false); setHeld(ms); };
  const play = () => {
    if (playing) { setHeld(t); setPlaying(false); return; }
    setOffset((held ?? 0) - clock);
    setHeld(null);
    setPlaying(true);
  };
  const side = <p className="kg-page__aside">A fragment of an episode, keyed like the timeline will be: it enters, gains XP, compacts, is hovered, opens again and exits. Drag the bar to any instant.</p>;
  const below = (
    <div className="kg-scrub">
      <button type="button" className="kg-chip" onClick={play} data-testid="player-play">{playing ? 'PAUSE' : 'PLAY'}</button>
      <div className="kg-scrub__bar">
        <input type="range" min={0} max={DEMO_LENGTH} step={1} value={Math.round(t)} aria-label="Time" onChange={event => seek(Number(event.target.value))} data-testid="player-scrub" />
        <div className="kg-scrub__marks">
          {DEMO_MARKS.map(mark => <button type="button" key={mark.label} style={{ left: `${(mark.at / DEMO_LENGTH) * 100}%` }} onClick={() => seek(mark.at)}>{mark.label}</button>)}
        </div>
      </div>
      <span className="kg-scrub__time">{(t / 1000).toFixed(2)} s</span>
    </div>
  );
  return { width: VIEW.width, items: [{ key: 'demo', kind: 'player', t, input: DEMO, x: 40, y: 60, scale: 1.4 }] as HudItem[], overlay: null, side, below, seek };
}

const SUMMARY: readonly { label: string; layout: ModuleLayout; hover?: boolean; disabled?: boolean }[] = [
  { label: 'COMPACT', layout: 'Compact' },
  { label: 'OPEN', layout: 'Open' },
  { label: 'PINNED', layout: 'Pinned' },
  { label: 'COMPACT + HOVER', layout: 'Compact', hover: true },
  { label: 'OPEN + HOVER', layout: 'Open', hover: true },
  { label: 'DISABLED', layout: 'Open', disabled: true },
];

/** Every state at rest, side by side, each running its ambient loop. */
function useStates(active: boolean) {
  const { t } = useClock(active);
  const cols = 3, scale = 0.72, cellW = 318, cellH = 150;
  const items: HudItem[] = SUMMARY.map((cell, i) => ({
    key: `state-${i}`, kind: 'player', t: 4000 + t,
    input: { ...BASE_INPUT, layout: [key(0, cell.layout)], hover: [key(0, !!cell.hover)], disabled: [key(0, !!cell.disabled)] },
    x: 16 + (i % cols) * cellW, y: 32 + Math.floor(i / cols) * cellH, scale,
  }));
  const overlay = (
    <div className="kg-page__labels">
      {SUMMARY.map((cell, i) => <span key={cell.label} style={{ left: 16 + (i % cols) * cellW, top: 8 + Math.floor(i / cols) * cellH }}>{cell.label}</span>)}
    </div>
  );
  const below = <p className="kg-page__note">Summary of every state at rest. Each runs its ambient loop (sheen, micro-glitch, flicker) by itself, except DISABLED.</p>;
  return { width: 960, items, overlay, side: null, below };
}
