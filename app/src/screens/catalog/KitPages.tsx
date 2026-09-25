import { useState } from 'react';
import { upsertKey, type Track } from '../../core/tracks';
import { BOARD_LAYOUT } from '../../hud/kit/board';
import { MODULE_STATES, type ModuleState } from '../../hud/kit/module';
import type { SampleInput } from '../../hud/kit/sample';
import type { MotionKnobs, Theme } from '../../hud/kit/theme';
import type { HudItem } from '../../hud/registry';
import { HudCanvas } from '../../hud/v2/HudCanvas';
import type { PlayerInput } from '../../hud/v2/player';
import { BACKGROUND, PORTRAIT, fromHex, hex, key, keyId, useClock, useKit } from './kitState';

const PLAYER: PlayerInput = { record: { name: 'KOALITIC', level: 12, nextLevelXp: 5000, photo: PORTRAIT }, enterAt: 0, exitAt: null, state: [key(0, 'Open')], xp: [key(0, 3250)], pulses: [] };
const SAMPLE: SampleInput = { title: 'STAMINA', enterAt: 0, exitAt: null, state: [key(0, 'Open')], value: [key(0, 72)], pulses: [] };
const STATE_LABEL: Record<ModuleState, string> = { Compact: 'COMPACT', Open: 'OPEN', Pinned: 'PINNED', Hover: 'HOVER', Disabled: 'DISABLED' };

/** THEME: the colours and lines every HUD element takes. Changes show on every element at once. */
export function KitThemePage() {
  const { theme, motion, setTheme, reset } = useKit();
  const { t } = useClock(true);
  const setColor = (name: keyof Theme['color'], value: string) => setTheme({ ...theme, color: { ...theme.color, [name]: fromHex(value) } });
  const setBar = (bar: keyof Theme['bars'], end: 'from' | 'to', value: string) => setTheme({ ...theme, bars: { ...theme.bars, [bar]: { ...theme.bars[bar], [end]: fromHex(value) } } });
  const colors: [keyof Theme['color'], string][] = [['red', 'ACCENT · RED'], ['cyan', 'DATA · CYAN'], ['text', 'TEXT'], ['dim', 'LABELS'], ['edge', 'FRAME EDGE'], ['glass', 'GLASS'], ['white', 'HOT WHITE'], ['disabled', 'DISABLED']];
  const items: HudItem[] = [
    { key: 'theme-player', kind: 'player', t: 4000 + t, input: PLAYER, x: 20, y: 34, scale: 1 },
    { key: 'theme-sample', kind: 'sample', t: 4000 + t, input: SAMPLE, x: 20, y: 200, scale: 1 },
  ];
  return (
    <div className="kg-page">
      <p className="kg-page__intro">Layer 1 of the kit. Every HUD element reads these values, so changing one restyles all of them.</p>
      <div className="kg-page__row">
        <div className="kg-page__view" style={{ width: 600, height: 300 }} data-testid="kit-theme-view">
          <HudCanvas width={600} height={300} background={BACKGROUND} items={items} theme={theme} motion={motion} />
        </div>
        <div className="kg-knobs" data-testid="kit-theme-controls">
          {colors.map(([name, text]) => (
            <label key={name} className="kg-knobs__color">
              <input type="color" value={hex(theme.color[name])} onChange={e => setColor(name, e.target.value)} data-testid={`theme-${name}`} />
              {text}
            </label>
          ))}
          {(['xp', 'stamina'] as const).map(bar => (
            <div key={bar} className="kg-knobs__color">
              <input type="color" value={hex(theme.bars[bar].from)} onChange={e => setBar(bar, 'from', e.target.value)} data-testid={`theme-bar-${bar}-from`} />
              <input type="color" value={hex(theme.bars[bar].to)} onChange={e => setBar(bar, 'to', e.target.value)} data-testid={`theme-bar-${bar}-to`} />
              {bar === 'xp' ? 'XP BAR' : 'STAMINA BAR'}
            </div>
          ))}
          <label className="kg-knobs__range">GLASS OPACITY<input type="range" min={0.3} max={0.95} step={0.01} value={theme.glassAlpha} onChange={e => setTheme({ ...theme, glassAlpha: Number(e.target.value) })} /></label>
          <label className="kg-knobs__range">FRAME LINE<input type="range" min={0.6} max={3} step={0.1} value={theme.line} onChange={e => setTheme({ ...theme, line: Number(e.target.value) })} /></label>
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

const KIT_ANIMATIONS = [
  ['ENTER', 'Born from a line → bar → panel → corners; content in reading order.'],
  ['EXIT', 'Glitch burst, content goes, collapse to a line that burns out.'],
  ['STATE CHANGE', 'Accordion to COMPACT, pin, hover light, dim; interruptible.'],
  ['REACTION', 'A new value jumps: pop-up white-hot → colour, glitch, hot bar head.'],
  ['PULSE', 'A replaced value (name, photo) glitches and decodes again.'],
  ['AMBIENT', 'Loop while visible: sheen, micro-glitch, text flicker.'],
];

/** MOTION: the kit's animations, tried live on a panel built only from kit parts, with the global knobs. */
export function KitMotionPage() {
  const { theme, motion, setMotion } = useKit();
  const { t, now } = useClock(true);
  const [input, setInput] = useState<SampleInput>({ ...SAMPLE, enterAt: 300 });
  const at = () => Math.round(now.current);
  const addKey = <V,>(track: Track<V>, v: V) => upsertKey(track, at(), v, keyId);
  const value = input.value.at(-1)?.v ?? 0;
  const stateNow = input.state.at(-1)?.v ?? 'Open';
  const items: HudItem[] = [{ key: 'motion-sample', kind: 'sample', t, input, x: 60, y: 70, scale: 1.4 }];
  return (
    <div className="kg-page">
      <p className="kg-page__intro">Layer 2 of the kit. The same animations drive every HUD element; the knobs retime all of them.</p>
      <div className="kg-page__row">
        <div className="kg-page__view" style={{ width: 600, height: 300 }} data-testid="kit-motion-view">
          <HudCanvas width={600} height={300} background={BACKGROUND} items={items} theme={theme} motion={motion} />
        </div>
        <div className="kg-knobs" data-testid="kit-motion-controls">
          {KNOBS.map(([name, text, min, max]) => (
            <label key={name} className="kg-knobs__range">
              <span>{text} <b>{motion[name].toFixed(2)}×</b></span>
              <input type="range" min={min} max={max} step={0.05} value={motion[name]} onChange={e => setMotion({ ...motion, [name]: Number(e.target.value) })} data-testid={`knob-${name}`} />
            </label>
          ))}
          <div className="kg-props__label">TRY IT</div>
          <div className="kg-props__seg">
            <button type="button" onClick={() => setInput(s => ({ ...s, enterAt: at(), exitAt: null }))} data-testid="kit-enter">ENTER</button>
            <button type="button" onClick={() => setInput(s => (s.exitAt === null ? { ...s, exitAt: at() } : s))} data-testid="kit-exit">EXIT</button>
          </div>
          <div className="kg-props__seg">
            <button type="button" onClick={() => setInput(s => ({ ...s, value: addKey(s.value, Math.min(100, value + 15)) }))} data-testid="kit-plus">VALUE +15</button>
            <button type="button" onClick={() => setInput(s => ({ ...s, value: addKey(s.value, Math.max(0, value - 25)) }))}>VALUE −25</button>
          </div>
          <div className="kg-props__states">
            {MODULE_STATES.map(state => (
              <button type="button" key={state} className={stateNow === state ? 'is-on' : ''} onClick={() => setInput(s => ({ ...s, state: addKey(s.state, state) }))}>{STATE_LABEL[state]}</button>
            ))}
            <button type="button" onClick={() => setInput(s => ({ ...s, pulses: [...s.pulses, { at: at() }] }))}>PULSE</button>
          </div>
        </div>
      </div>
      <ul className="kg-kitlist">
        {KIT_ANIMATIONS.map(([name, text]) => <li key={name}><b>{name}</b>{text}</li>)}
      </ul>
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
      <p className="kg-page__intro">Layer 3 of the kit. Components are assembled from these pieces; restyle a piece and every component using it changes.</p>
      <div className="kg-page__view" style={{ width: 960, height: 310 }} data-testid="kit-pieces-view">
        <HudCanvas width={960} height={310} background={BACKGROUND} items={items} theme={theme} motion={motion} />
        <div className="kg-page__labels">
          {BOARD_LAYOUT.map(piece => <span key={piece.id} style={{ left: offset.x + piece.x, top: offset.y + piece.y - 22 }}>{piece.label}</span>)}
        </div>
      </div>
    </div>
  );
}
