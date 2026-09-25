import type { FocusEvent, KeyboardEvent } from 'react';
import type { PlayerInput } from '../../hud/v2/player';
import { ElementPage, type EditContext, type ElementDef } from './ElementPage';
import { PORTRAIT, key } from './kitState';

const BASE: PlayerInput = {
  record: { name: 'KOALITIC', level: 12, nextLevelXp: 5000, photo: PORTRAIT },
  enterAt: 0, exitAt: null, layout: [key(0, 'Open')], hover: [], disabled: [], xp: [key(0, 3250)], pulses: [],
};

const onCommit = (fn: (value: string) => void) => ({
  onBlur: (e: FocusEvent<HTMLInputElement>) => fn(e.target.value),
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') fn(e.currentTarget.value); },
});

function setXp(ctx: EditContext<PlayerInput>, xp: number) {
  const now = ctx.input.xp.at(-1)?.v ?? 0;
  if (!Number.isFinite(xp) || xp === now) return;
  ctx.set(s => ({ ...s, xp: ctx.addKey(s.xp, xp) }));
  ctx.record(`XP ${xp > now ? '+' : ''}${xp - now} → ${xp}`);
}

function setRecord(ctx: EditContext<PlayerInput>, field: 'name' | 'level', value: string | number) {
  if (value === '' || (typeof value === 'number' && !Number.isFinite(value)) || ctx.input.record[field] === value) return;
  ctx.set(s => ({ ...s, record: { ...s.record, [field]: value }, pulses: [...s.pulses, { at: ctx.at(), field }] }));
  ctx.record(`${field.toUpperCase()} → ${value}`);
}

/** PLAYER PROFILE: portrait, name, level and one XP value (bar and figure). */
const PLAYER: ElementDef<PlayerInput> = {
  kind: 'player',
  base: BASE,
  place: { x: 40, y: 60, scale: 1.4 },
  values: ctx => {
    const xpNow = ctx.input.xp.at(-1)?.v ?? 0;
    return (
      <>
        <label>NAME<input defaultValue={ctx.input.record.name} maxLength={18} {...onCommit(v => setRecord(ctx, 'name', v.toUpperCase().trim()))} data-testid="prop-name" /></label>
        <div className="kg-props__pair">
          <label>LEVEL<input type="number" defaultValue={ctx.input.record.level} min={1} {...onCommit(v => setRecord(ctx, 'level', Number(v)))} data-testid="prop-level" /></label>
          <label>XP<input key={xpNow} type="number" defaultValue={xpNow} min={0} step={10} {...onCommit(v => setXp(ctx, Number(v)))} data-testid="prop-xp" /></label>
          <label>NEXT LV XP<input type="number" defaultValue={ctx.input.record.nextLevelXp} min={1} step={100} {...onCommit(v => {
            const next = Number(v);
            if (Number.isFinite(next) && next > 0) ctx.set(s => ({ ...s, record: { ...s.record, nextLevelXp: next } }));
          })} data-testid="prop-next" /></label>
          <label className="kg-props__file">PHOTO<input type="file" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            ctx.set(s => ({ ...s, record: { ...s.record, photo: url }, pulses: [...s.pulses, { at: ctx.at(), field: 'photo' }] }));
            ctx.record('PHOTO → ' + file.name.slice(0, 18));
          }} data-testid="prop-photo" /></label>
        </div>
      </>
    );
  },
  reactions: ctx => <button type="button" onClick={() => setXp(ctx, (ctx.input.xp.at(-1)?.v ?? 0) + 150)} data-testid="prop-xp-plus">XP +150</button>,
  demo: {
    input: {
      ...BASE, enterAt: 300, exitAt: 8000,
      layout: [key(0, 'Open'), key(4300, 'Compact'), key(6400, 'Open')],
      hover: [key(0, false), key(5200, true), key(5900, false)],
      xp: [key(0, 3250), key(2700, 3400)],
    },
    length: 9000,
    marks: [{ at: 300, label: 'ENTER' }, { at: 2700, label: '+150 XP' }, { at: 4300, label: 'COMPACT' }, { at: 5200, label: 'HOVER' }, { at: 6400, label: 'OPEN' }, { at: 8000, label: 'EXIT' }],
    note: 'A fragment of an episode, keyed like the timeline will be: it enters, gains XP, compacts, is hovered, opens again and exits. Drag the bar to any instant.',
  },
  summary: { cols: 3, scale: 0.72, cellW: 318, cellH: 150, x0: 16, y0: 32 },
};

export const PlayerPage = () => <ElementPage def={PLAYER} />;
