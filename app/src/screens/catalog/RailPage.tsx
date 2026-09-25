import { useEffect, useState } from 'react';
import { upsertKey, type Track } from '../../core/tracks';
import type { HudItem } from '../../hud/registry';
import { HudCanvas } from '../../hud/v2/HudCanvas';
import type { RailInput } from '../../hud/v2/rail';
import { BACKGROUND, key, keyId, useClock, useKit } from '../../design/TokensProvider';
import { RAIL_MODULES, RAIL_SAMPLE } from './samples';

/**
 * LEFT RAIL · DOCK in the catalog. EDIT: pick a module from the icon column
 * (it opens beside its icon), turn the Gear Radial, change values, enter/exit;
 * every change is a keyframe. DEMO: a scripted fragment with a time bar.
 */
const VIEW = { width: 620, height: 340 };
const PLACE = { x: 150, y: 12, scale: 0.84 };
const BASE: RailInput = { ...RAIL_SAMPLE, selected: [key(0, '')] };

const DEMO_LENGTH = 12000;
const DEMO: RailInput = {
  ...BASE,
  enterAt: 300,
  exitAt: 11200,
  selected: [key(0, ''), key(1800, 'gear'), key(6000, 'stamina'), key(8200, ''), key(9000, 'inventory'), key(10200, '')],
  gear: { ...BASE.gear, selection: [key(0, 0), key(3000, 1), key(4200, 4)] },
  stamina: [key(0, 72), key(7000, 52)],
};
const DEMO_MARKS = [
  { at: 300, label: 'ENTER' }, { at: 1800, label: 'GEAR' }, { at: 4200, label: 'JUMP +3' }, { at: 6000, label: 'STAMINA' },
  { at: 7000, label: '−20' }, { at: 8200, label: 'CLOSE' }, { at: 9000, label: 'INVENTORY' }, { at: 11200, label: 'EXIT' },
];

declare global {
  interface Window { __kgPlayer?: { seek: (ms: number) => void } }
}

type Mode = 'edit' | 'demo';
const fmtTime = (ms: number) => `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(1).padStart(4, '0')}`;

export function RailPage() {
  const { theme, motion } = useKit();
  const [mode, setMode] = useState<Mode>('edit');
  const { t: editT, now } = useClock(mode === 'edit');
  const [input, setInput] = useState<RailInput>({ ...BASE, enterAt: 300 });
  const [log, setLog] = useState<string[]>([]);
  const [playing, setPlaying] = useState(true);
  const { t: clock } = useClock(mode === 'demo' && playing);
  const [offset, setOffset] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const demoT = held ?? (((clock + offset) % DEMO_LENGTH) + DEMO_LENGTH) % DEMO_LENGTH;
  const seek = (ms: number) => { setPlaying(false); setHeld(ms); };
  useEffect(() => {
    window.__kgPlayer = { seek: ms => { setMode('demo'); seek(ms); } };
    return () => { delete window.__kgPlayer; };
  });

  const at = () => Math.round(now.current);
  const addKey = <V,>(track: Track<V>, v: V) => upsertKey(track, at(), v, keyId);
  const record = (text: string) => setLog(list => [`${fmtTime(now.current)} · ${text}`, ...list].slice(0, 4));
  const selectedNow = input.selected.at(-1)?.v ?? '';
  const gearNow = input.gear.selection.at(-1)?.v ?? 0;
  const staminaNow = input.stamina.at(-1)?.v ?? 0;
  const xpNow = input.player.xp.at(-1)?.v ?? 0;
  const n = input.gear.slots.length;
  const select = (id: string) => {
    const next = id === selectedNow ? '' : id;
    setInput(s => ({ ...s, selected: addKey(s.selected, next) }));
    record(next ? `OPEN → ${RAIL_MODULES.find(m => m.id === next)!.label}` : 'CLOSE');
  };
  const turn = (d: number) => {
    const target = (((gearNow + d) % n) + n) % n;
    setInput(s => ({ ...s, gear: { ...s.gear, selection: addKey(s.gear.selection, target) } }));
    record(`GEAR → ${input.gear.slots[target]!.name}`);
  };

  const items: HudItem[] = [{ key: 'rail', kind: 'rail', t: mode === 'edit' ? editT : demoT, input: mode === 'edit' ? input : DEMO, ...PLACE }];
  return (
    <div className="kg-page">
      <div className="kg-page__tabs" role="tablist">
        {([['edit', 'EDIT'], ['demo', 'DEMO']] as const).map(([id, text]) => (
          <button type="button" role="tab" key={id} className={mode === id ? 'is-active' : ''} onClick={() => setMode(id)} data-testid={`player-mode-${id}`}>{text}</button>
        ))}
      </div>
      <div className="kg-page__row">
        <div className="kg-page__view" data-testid="player-preview" style={{ width: VIEW.width, height: VIEW.height }}>
          <HudCanvas width={VIEW.width} height={VIEW.height} background={BACKGROUND} items={items} theme={theme} motion={motion} />
        </div>
        {mode === 'edit' ? (
          <form className="kg-props" onSubmit={e => e.preventDefault()} data-testid="rail-props">
            <fieldset>
              <legend>OPEN A MODULE</legend>
              <div className="kg-props__slots">
                {RAIL_MODULES.map(module => (
                  <button type="button" key={module.id} className={selectedNow === module.id ? 'is-on' : ''} onClick={() => select(module.id)} data-testid={`rail-open-${module.id}`}>{module.label}</button>
                ))}
                <button type="button" className={selectedNow === '' ? 'is-on' : ''} onClick={() => selectedNow && select(selectedNow)} data-testid="rail-close">NONE</button>
              </div>
            </fieldset>
            <fieldset>
              <legend>GEAR RADIAL</legend>
              <div className="kg-props__states">
                <button type="button" onClick={() => turn(-1)} data-testid="rail-gear-prev">◀ PREV</button>
                <button type="button" onClick={() => turn(1)} data-testid="rail-gear-next">NEXT ▶</button>
                <button type="button" onClick={() => turn(3)} data-testid="rail-gear-jump">JUMP +3</button>
              </div>
            </fieldset>
            <fieldset>
              <legend>VALUES · ENTER · EXIT</legend>
              <div className="kg-props__states">
                <button type="button" onClick={() => { setInput(s => ({ ...s, player: { ...s.player, xp: addKey(s.player.xp, xpNow + 150) } })); record('XP +150'); }}>XP +150</button>
                <button type="button" onClick={() => { setInput(s => ({ ...s, stamina: addKey(s.stamina, Math.max(0, staminaNow - 20)) })); record('STAMINA −20'); }}>STAMINA −20</button>
                <button type="button" onClick={() => { setInput(s => ({ ...s, stamina: addKey(s.stamina, Math.min(100, staminaNow + 20)) })); record('STAMINA +20'); }}>STAMINA +20</button>
                <button type="button" onClick={() => { setInput(s => ({ ...s, enterAt: at(), exitAt: null })); record('ENTER'); }}>ENTER</button>
                <button type="button" onClick={() => { if (input.exitAt === null) { setInput(s => ({ ...s, exitAt: at() })); record('EXIT'); } }}>EXIT</button>
              </div>
            </fieldset>
            <p className="kg-props__hint">Placeholder panels stand in for INVENTORY, CAMERA and TIME LEFT until those components are built.</p>
          </form>
        ) : (
          <p className="kg-page__aside">The rail enters folded (DOCK). GEAR opens beside its icon and turns; STAMINA opens and drops 20; the rail closes, INVENTORY opens and closes; then it exits. Only one module opens at a time; the rest stay folded.</p>
        )}
      </div>
      {mode === 'edit' ? (
        <div className="kg-log">
          <span>KEYFRAMES CREATED</span>
          <ol data-testid="prop-log">{log.length ? log.map(line => <li key={line}>{line}</li>) : <li className="is-empty">Open a module on the right: it becomes a keyframe of the rail's selection track</li>}</ol>
        </div>
      ) : (
        <div className="kg-scrub">
          <button type="button" className="kg-chip" onClick={() => {
            if (playing) { setHeld(demoT); setPlaying(false); return; }
            setOffset((held ?? 0) - clock); setHeld(null); setPlaying(true);
          }} data-testid="player-play">{playing ? 'PAUSE' : 'PLAY'}</button>
          <div className="kg-scrub__bar">
            <input type="range" min={0} max={DEMO_LENGTH} step={1} value={Math.round(demoT)} aria-label="Time" onChange={e => seek(Number(e.target.value))} data-testid="player-scrub" />
            <div className="kg-scrub__marks">
              {DEMO_MARKS.map(mark => <button type="button" key={mark.label} style={{ left: `${(mark.at / DEMO_LENGTH) * 100}%` }} onClick={() => seek(mark.at)}>{mark.label}</button>)}
            </div>
          </div>
          <span className="kg-scrub__time">{(demoT / 1000).toFixed(2)} s</span>
        </div>
      )}
    </div>
  );
}
