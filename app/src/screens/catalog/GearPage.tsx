import type { GearInput } from '../../hud/v2/gear';
import { ElementPage, type EditContext, type ElementDef } from './ElementPage';
import { key } from '../../design/TokensProvider';
import { GEAR_SLOTS as SLOTS } from './samples';

const BASE: GearInput = { slots: SLOTS, enterAt: 0, exitAt: null, layout: [key(0, 'Open')], hover: [], disabled: [], selection: [key(0, 0)], pulses: [] };

function select(ctx: EditContext<GearInput>, index: number) {
  const n = ctx.input.slots.length;
  const target = ((index % n) + n) % n;
  if (target === (ctx.input.selection.at(-1)?.v ?? 0)) return;
  ctx.set(s => ({ ...s, selection: ctx.addKey(s.selection, target) }));
  ctx.record(`SELECT → ${ctx.input.slots[target]!.name}`);
}

/** GEAR RADIAL: a ring of the loadout; a new selection turns it one sector per step. */
const GEAR: ElementDef<GearInput> = {
  kind: 'gear',
  base: BASE,
  place: { x: 130, y: 4, scale: 0.94 },
  values: ctx => {
    const selected = ctx.input.selection.at(-1)?.v ?? 0;
    return (
      <div className="kg-props__slots">
        {ctx.input.slots.map((slot, i) => (
          <button type="button" key={slot.name} className={i === selected ? 'is-on' : ''} onClick={() => select(ctx, i)} data-testid={`prop-slot-${i}`}>
            {String(i + 1).padStart(2, '0')} {slot.name}
          </button>
        ))}
      </div>
    );
  },
  reactions: ctx => {
    const selected = ctx.input.selection.at(-1)?.v ?? 0;
    return (
      <>
        <button type="button" onClick={() => select(ctx, selected - 1)} data-testid="prop-prev">◀ PREV</button>
        <button type="button" onClick={() => select(ctx, selected + 1)} data-testid="prop-next-slot">NEXT ▶</button>
        <button type="button" onClick={() => select(ctx, selected + 3)} data-testid="prop-jump">JUMP +3</button>
      </>
    );
  },
  demo: {
    input: {
      ...BASE, enterAt: 300, exitAt: 8600,
      selection: [key(0, 0), key(2200, 1), key(3300, 4), key(5000, 3)],
      layout: [key(0, 'Open'), key(6200, 'Compact'), key(7400, 'Open')],
    },
    length: 9600,
    marks: [{ at: 300, label: 'ENTER' }, { at: 2200, label: 'NEXT' }, { at: 3300, label: 'JUMP +3' }, { at: 5000, label: 'BACK 1' }, { at: 6200, label: 'COMPACT' }, { at: 7400, label: 'OPEN' }, { at: 8600, label: 'EXIT' }],
    note: 'The ring enters sector by sector, then turns: one step, a jump of three ("pim, pim, pim"), one back. Each step lands with a ping. Then it compacts to its selected item and opens again.',
  },
  summary: { cols: 6, scale: 0.42, cellW: 158, cellH: 170, x0: 10, y0: 60 },
};

export const GearPage = () => <ElementPage def={GEAR} />;
