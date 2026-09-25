import { useState } from 'react';
import { upsertKey, type Track } from '../../core/tracks';
import { BOARD_LAYOUT } from '../../hud/kit/board';
import { MODULE_LAYOUTS, type ModuleLayout } from '../../hud/kit/module';
import type { SampleInput } from '../../hud/kit/sample';
import type { MotionKnobs, Theme } from '../../hud/kit/theme';
import type { HudItem } from '../../hud/registry';
import { HudCanvas } from '../../hud/v2/HudCanvas';
import { BACKGROUND, PORTRAIT, fromHex, hex, key, keyId, useClock, useKit } from '../../design/TokensProvider';
import { GALLERY_LABELS, gallery } from './samples';

const SAMPLE: SampleInput = { title: 'STAMINA', enterAt: 0, exitAt: null, layout: [key(0, 'Open')], hover: [], disabled: [], value: [key(0, 72)], pulses: [] };
const LAYOUT_LABEL: Record<ModuleLayout, string> = { Compact: 'COMPACT', Open: 'OPEN', Pinned: 'PINNED' };

/** THEME: the colours and lines every HUD element takes, shown on all elements at once. */
export function KitThemePage() {
  const { theme, motion, setTheme, reset } = useKit();
  const { t } = useClock(true);
  const setColor = (name: keyof Theme['color'], value: string) => setTheme({ ...theme, color: { ...theme.color, [name]: fromHex(value) } });
  const setBar = (bar: keyof Theme['bars'], end: 'from' | 'to', value: string) => setTheme({ ...theme, bars: { ...theme.bars, [bar]: { ...theme.bars[bar], [end]: fromHex(value) } } });
  const colors: [keyof Theme['color'], string][] = [['red', 'ACCENT'], ['cyan', 'DATA'], ['text', 'TEXT'], ['dim', 'LABELS'], ['edge', 'EDGE'], ['glass', 'GLASS'], ['white', 'HOT'], ['disabled', 'DISABLED']];
  return (
    <div className="kg-page">
      <p className="kg-page__intro">Layer 1: the shared design tokens. They restyle every HUD element here AND the app's own menus around it (SYSTEM UI). Each new component joins this screen automatically.</p>
      <div className="kg-page__row">
        <div className="kg-page__view" style={{ width: 720, height: 360 }} data-testid="kit-theme-view">
          <HudCanvas width={720} height={360} background={BACKGROUND} items={gallery(4000 + t)} theme={theme} motion={motion} />
          <div className="kg-page__labels">{GALLERY_LABELS.map(l => <span key={l.text} style={{ left: l.x, top: l.y }}>{l.text}</span>)}</div>
        </div>
        <div className="kg-knobs kg-knobs--theme" data-testid="kit-theme-controls">
          <div className="kg-knobs__grid">
            {colors.map(([name, text]) => (
              <label key={name} className="kg-knobs__color">
                <input type="color" value={hex(theme.color[name])} onChange={e => setColor(name, e.target.value)} data-testid={`theme-${name}`} />
                {text}
              </label>
            ))}
          </div>
          {(['xp', 'stamina'] as const).map(bar => (
            <div key={bar} className="kg-knobs__color">
              <input type="color" value={hex(theme.bars[bar].from)} onChange={e => setBar(bar, 'from', e.target.value)} data-testid={`theme-bar-${bar}-from`} />
              <input type="color" value={hex(theme.bars[bar].to)} onChange={e => setBar(bar, 'to', e.target.value)} data-testid={`theme-bar-${bar}-to`} />
              {bar === 'xp' ? 'XP BAR' : 'STAMINA BAR'}
            </div>
          ))}
          <label className="kg-knobs__range"><span>GLASS OPACITY</span><input type="range" min={0.3} max={0.95} step={0.01} value={theme.glassAlpha} onChange={e => setTheme({ ...theme, glassAlpha: Number(e.target.value) })} /></label>
          <label className="kg-knobs__range"><span>FRAME LINE</span><input type="range" min={0.6} max={3} step={0.1} value={theme.line} onChange={e => setTheme({ ...theme, line: Number(e.target.value) })} /></label>
          <button type="button" className="kg-chip" onClick={reset} data-testid="kit-reset">RESET KIT</button>
        </div>
      </div>
    </div>
  );
}

const KNOBS: [keyof MotionKnobs, string, number, number][] = [
  ['speed', 'SPEED', 0.5, 2],
  ['glitch', 'GLITCH', 0, 2],
  ['artifacts', 'ARTIFACTS', 0, 2],
  ['bloom', 'BLOOM', 0, 2],
  ['ambient', 'AMBIENT LOOP', 0, 2],
];

const KIT_GROUPS = [
  { name: 'ENTER · EXIT', items: [['ENTER', 'Born from a line → bar → panel → corners; content in reading order.'], ['EXIT', 'Glitch burst, content goes, collapse to a line that burns out.']] },
  { name: 'STATES', items: [['LAYOUT', 'COMPACT ↔ OPEN ↔ PINNED: accordion and pin; one at a time.'], ['FLAGS', 'HOVER on/off (cyan light) and DISABLED on/off (dim, calm), on top of any layout.']] },
  { name: 'REACTIONS', items: [['VALUE', 'A new value jumps: pop-up white-hot → colour, glitch, hot bar head.'], ['PULSE', 'A replaced value (name, photo) glitches and decodes again.']] },
  { name: 'AMBIENT', items: [['LOOP', 'While visible: sheen, micro-glitch, text flicker. Off when DISABLED.']] },
] as const;

/** MOTION: the kit's animations, grouped, tried live on a panel built only from kit parts, plus the global knobs. */
export function KitMotionPage() {
  const { theme, motion, setMotion } = useKit();
  const { t, now } = useClock(true);
  const [input, setInput] = useState<SampleInput>({ ...SAMPLE, enterAt: 300 });
  const at = () => Math.round(now.current);
  const addKey = <V,>(track: Track<V>, v: V) => upsertKey(track, at(), v, keyId);
  const value = input.value.at(-1)?.v ?? 0;
  const layoutNow = input.layout.at(-1)?.v ?? 'Open';
  const hoverNow = input.hover.at(-1)?.v ?? false;
  const disabledNow = input.disabled.at(-1)?.v ?? false;
  const items: HudItem[] = [{ key: 'motion-sample', kind: 'sample', t, input, x: 50, y: 56, scale: 1.4 }];
  return (
    <div className="kg-page">
      <p className="kg-page__intro">Layer 2: the animations every HUD element shares, tried on a panel made only of kit parts. Knobs retime all elements.</p>
      <div className="kg-page__row">
        <div className="kg-page__view" style={{ width: 520, height: 262 }} data-testid="kit-motion-view">
          <HudCanvas width={520} height={262} background={BACKGROUND} items={items} theme={theme} motion={motion} />
        </div>
        <form className="kg-props kg-props--narrow" onSubmit={e => e.preventDefault()}>
          <fieldset>
            <legend>ENTER · EXIT</legend>
            <div className="kg-props__flags">
              <button type="button" onClick={() => setInput(s => ({ ...s, enterAt: at(), exitAt: null }))} data-testid="kit-enter">ENTER</button>
              <button type="button" onClick={() => setInput(s => (s.exitAt === null ? { ...s, exitAt: at() } : s))} data-testid="kit-exit">EXIT</button>
            </div>
          </fieldset>
          <fieldset>
            <legend>STATES</legend>
            <div className="kg-props__states">
              {MODULE_LAYOUTS.map(layout => (
                <button type="button" key={layout} className={layoutNow === layout ? 'is-on' : ''} onClick={() => setInput(s => ({ ...s, layout: addKey(s.layout, layout) }))}>{LAYOUT_LABEL[layout]}</button>
              ))}
            </div>
            <div className="kg-props__flags">
              <button type="button" className={hoverNow ? 'is-on' : ''} onClick={() => setInput(s => ({ ...s, hover: addKey(s.hover, !hoverNow) }))}>HOVER {hoverNow ? 'ON' : 'OFF'}</button>
              <button type="button" className={disabledNow ? 'is-on' : ''} onClick={() => setInput(s => ({ ...s, disabled: addKey(s.disabled, !disabledNow) }))}>DISABLED {disabledNow ? 'ON' : 'OFF'}</button>
            </div>
          </fieldset>
          <fieldset>
            <legend>REACTIONS</legend>
            <div className="kg-props__states">
              <button type="button" onClick={() => setInput(s => ({ ...s, value: addKey(s.value, Math.min(100, value + 15)) }))} data-testid="kit-plus">VALUE +15</button>
              <button type="button" onClick={() => setInput(s => ({ ...s, value: addKey(s.value, Math.max(0, value - 25)) }))}>VALUE −25</button>
              <button type="button" onClick={() => setInput(s => ({ ...s, pulses: [...s.pulses, { at: at() }] }))}>PULSE</button>
            </div>
          </fieldset>
        </form>
        <div className="kg-knobs kg-knobs--narrow" data-testid="kit-motion-controls">
          <div className="kg-props__legend">GLOBAL KNOBS</div>
          {KNOBS.map(([name, text, min, max]) => (
            <label key={name} className="kg-knobs__range">
              <span>{text} <b>{motion[name].toFixed(2)}×</b></span>
              <input type="range" min={min} max={max} step={0.05} value={motion[name]} onChange={e => setMotion({ ...motion, [name]: Number(e.target.value) })} data-testid={`knob-${name}`} />
            </label>
          ))}
        </div>
      </div>
      <div className="kg-kitlist">
        {KIT_GROUPS.map(group => (
          <div key={group.name}>
            <h4>{group.name}</h4>
            {group.items.map(([name, text]) => <p key={name}><b>{name}</b> {text}</p>)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** PIECES: every kit piece at rest, redrawn with the current theme. */
export function KitPiecesPage() {
  const { theme, motion } = useKit();
  const { t } = useClock(true);
  const offset = { x: 110, y: 0 };
  const items: HudItem[] = [{ key: 'board', kind: 'board', t, photo: PORTRAIT, x: offset.x, y: offset.y, scale: 1 }];
  return (
    <div className="kg-page">
      <p className="kg-page__intro">Layer 3 of the kit. Components are assembled from these pieces; restyle a piece and every component using it changes. The panel frame is the default card: a component can bring its own card variant.</p>
      <div className="kg-page__view" style={{ width: 960, height: 380 }} data-testid="kit-pieces-view">
        <HudCanvas width={960} height={380} background={BACKGROUND} items={items} theme={theme} motion={motion} />
        <div className="kg-page__labels">
          {BOARD_LAYOUT.map(piece => <span key={piece.id} style={{ left: offset.x + piece.x, top: offset.y + piece.y - 22 }}>{piece.label}</span>)}
        </div>
      </div>
    </div>
  );
}
