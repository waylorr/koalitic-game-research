import { useEffect, useState, type ReactNode } from 'react';
import { upsertKey, type Track } from '../../core/tracks';
import { MODULE_LAYOUTS, type ModuleInput, type ModuleLayout } from '../../hud/kit/module';
import type { HudItem } from '../../hud/registry';
import { HudCanvas } from '../../hud/v2/HudCanvas';
import { BACKGROUND, key, keyId, useClock, useKit } from '../../design/TokensProvider';

/**
 * Catalog page shared by every rail module (PLAYER PROFILE, GEAR RADIAL, …):
 *   EDIT  – try it like the episode editor: its own values and reactions, plus
 *           the common STATE (layout + HOVER/DISABLED) and ENTER/EXIT. Each change is a keyframe.
 *   DEMO  – a scripted fragment with a time bar.
 *   ALL STATES – every state side by side.
 * A component only describes its values, reactions, demo and placement.
 */
export interface EditContext<I extends ModuleInput> {
  readonly input: I;
  set(update: (input: I) => I): void;
  /** Current preview time (ms), for keys and pulses. */
  at(): number;
  addKey<V>(track: Track<V>, v: V): Track<V>;
  record(text: string): void;
}

export interface ElementDef<I extends ModuleInput> {
  readonly kind: HudItem['kind'];
  readonly base: I;
  readonly place: { readonly x: number; readonly y: number; readonly scale: number };
  readonly values: (ctx: EditContext<I>) => ReactNode;
  readonly reactions?: (ctx: EditContext<I>) => ReactNode;
  readonly demo: { readonly input: I; readonly length: number; readonly marks: readonly { at: number; label: string }[]; readonly note: string };
  readonly summary: { readonly cols: number; readonly scale: number; readonly cellW: number; readonly cellH: number; readonly x0: number; readonly y0: number };
}

const LAYOUT_LABEL: Record<ModuleLayout, string> = { Compact: 'COMPACT', Open: 'OPEN', Pinned: 'PINNED' };
const VIEW = { width: 620, height: 330 };

declare global {
  interface Window { __kgPlayer?: { seek: (ms: number) => void } }
}

type Mode = 'edit' | 'demo' | 'states';

export function ElementPage<I extends ModuleInput>({ def }: { def: ElementDef<I> }) {
  const { theme, motion } = useKit();
  const [mode, setMode] = useState<Mode>('edit');
  const edit = useEdit(def, mode === 'edit');
  const demo = useDemo(def, mode === 'demo');
  const states = useStates(def, mode === 'states');
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
const item = <I extends ModuleInput>(def: ElementDef<I>, keyName: string, t: number, input: I, x: number, y: number, scale: number) =>
  ({ key: keyName, kind: def.kind, t, input, x, y, scale }) as unknown as HudItem;

function useEdit<I extends ModuleInput>(def: ElementDef<I>, active: boolean) {
  const { t, now } = useClock(active);
  const [input, setInput] = useState<I>({ ...def.base, enterAt: 300 });
  const [log, setLog] = useState<string[]>([]);
  const ctx: EditContext<I> = {
    input,
    set: update => setInput(update),
    at: () => Math.round(now.current),
    addKey: (track, v) => upsertKey(track, Math.round(now.current), v, keyId),
    record: text => setLog(list => [`${fmtTime(now.current)} · ${text}`, ...list].slice(0, 4)),
  };
  const layoutNow = input.layout.at(-1)?.v ?? 'Open';
  const hoverNow = input.hover.at(-1)?.v ?? false;
  const disabledNow = input.disabled.at(-1)?.v ?? false;
  const setLayout = (layout: ModuleLayout) => {
    if (layout === layoutNow) return;
    setInput(s => ({ ...s, layout: ctx.addKey(s.layout, layout) }));
    ctx.record(`STATE → ${LAYOUT_LABEL[layout]}`);
  };
  const setFlag = (flag: 'hover' | 'disabled', on: boolean) => {
    setInput(s => ({ ...s, [flag]: ctx.addKey(s[flag], on) }));
    ctx.record(`${flag.toUpperCase()} → ${on ? 'ON' : 'OFF'}`);
  };
  const enter = () => { setInput(s => ({ ...s, enterAt: ctx.at(), exitAt: null })); ctx.record('ENTER'); };
  const exit = () => {
    if (input.exitAt !== null) return;
    setInput(s => ({ ...s, exitAt: ctx.at() }));
    ctx.record('EXIT');
  };
  const side = (
    <form className="kg-props" onSubmit={event => event.preventDefault()} data-testid="player-props">
      <fieldset>
        <legend>VALUES</legend>
        {def.values(ctx)}
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
        <legend>ENTER · EXIT{def.reactions ? ' · REACTIONS' : ''}</legend>
        <div className="kg-props__states">
          <button type="button" onClick={enter} data-testid="prop-enter">ENTER</button>
          <button type="button" onClick={exit} data-testid="prop-exit">EXIT</button>
          {def.reactions?.(ctx)}
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
  return { width: VIEW.width, items: [item(def, 'edit', t, input, def.place.x, def.place.y, def.place.scale)], overlay: null, side, below };
}

function useDemo<I extends ModuleInput>(def: ElementDef<I>, active: boolean) {
  const [playing, setPlaying] = useState(true);
  const { t: clock } = useClock(active && playing);
  const [offset, setOffset] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const { length, marks } = def.demo;
  const t = held ?? (((clock + offset) % length) + length) % length;
  const seek = (ms: number) => { setPlaying(false); setHeld(ms); };
  const play = () => {
    if (playing) { setHeld(t); setPlaying(false); return; }
    setOffset((held ?? 0) - clock);
    setHeld(null);
    setPlaying(true);
  };
  const side = <p className="kg-page__aside">{def.demo.note}</p>;
  const below = (
    <div className="kg-scrub">
      <button type="button" className="kg-chip" onClick={play} data-testid="player-play">{playing ? 'PAUSE' : 'PLAY'}</button>
      <div className="kg-scrub__bar">
        <input type="range" min={0} max={length} step={1} value={Math.round(t)} aria-label="Time" onChange={event => seek(Number(event.target.value))} data-testid="player-scrub" />
        <div className="kg-scrub__marks">
          {marks.map(mark => <button type="button" key={mark.label + mark.at} style={{ left: `${(mark.at / length) * 100}%` }} onClick={() => seek(mark.at)}>{mark.label}</button>)}
        </div>
      </div>
      <span className="kg-scrub__time">{(t / 1000).toFixed(2)} s</span>
    </div>
  );
  return { width: VIEW.width, items: [item(def, 'demo', t, def.demo.input, def.place.x, def.place.y, def.place.scale)], overlay: null, side, below, seek };
}

const SUMMARY: readonly { label: string; layout: ModuleLayout; hover?: boolean; disabled?: boolean }[] = [
  { label: 'COMPACT', layout: 'Compact' },
  { label: 'OPEN', layout: 'Open' },
  { label: 'PINNED', layout: 'Pinned' },
  { label: 'COMPACT + HOVER', layout: 'Compact', hover: true },
  { label: 'OPEN + HOVER', layout: 'Open', hover: true },
  { label: 'DISABLED', layout: 'Open', disabled: true },
];

function useStates<I extends ModuleInput>(def: ElementDef<I>, active: boolean) {
  const { t } = useClock(active);
  const { cols, scale, cellW, cellH, x0, y0 } = def.summary;
  const items = SUMMARY.map((cell, i) =>
    item(def, `state-${i}`, 4000 + t, { ...def.base, layout: [key(0, cell.layout)], hover: [key(0, !!cell.hover)], disabled: [key(0, !!cell.disabled)] }, x0 + (i % cols) * cellW, y0 + Math.floor(i / cols) * cellH, scale));
  const overlay = (
    <div className="kg-page__labels">
      {SUMMARY.map((cell, i) => <span key={cell.label} style={{ left: x0 + (i % cols) * cellW, top: y0 - 24 + Math.floor(i / cols) * cellH }}>{cell.label}</span>)}
    </div>
  );
  const below = <p className="kg-page__note">Summary of every state at rest. Each runs its ambient loop (sheen, micro-glitch, flicker) by itself, except DISABLED.</p>;
  return { width: 960, items, overlay, side: null, below };
}
