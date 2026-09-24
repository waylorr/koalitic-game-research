import { useState } from 'react';
import { Icons, NeonButton, type NeonState } from '../ui/NeonButton';
import { PlayerPreview } from './PlayerPreview';

const STATES: readonly NeonState[] = ['idle', 'selected', 'pressed', 'disabled'];
const COMPONENTS = [
  { id: 'player', name: 'PLAYER · LEFT RAIL', note: 'Drawn with PixiJS: glitch, artifacts and bloom. Edit its values; each change becomes a keyframe.' },
  { id: 'button', name: 'NEON BUTTON', note: 'Menu and navigation actions. Cyan when idle, red when selected.' },
] as const;
type ComponentId = (typeof COMPONENTS)[number]['id'];

/** ASSETS → UI COMPONENTS: each component shown in all of its states before it is used. */
export function ComponentCatalog() {
  const [current, setCurrent] = useState<ComponentId>('player');
  const [replay, setReplay] = useState(0);
  return (
    <>
      <div className="kg-tabs" role="tablist" aria-label="Asset views">
        <button type="button" className="kg-tab" role="tab" disabled>MEDIA<small>SOON</small></button>
        <button type="button" className="kg-tab" role="tab" disabled>DATA LIBRARY<small>SOON</small></button>
        <button type="button" className="kg-tab is-active" role="tab" aria-selected="true">UI COMPONENTS</button>
      </div>
      <section className="kg-catalog" data-testid="catalog">
        <div className="kg-catalog__inner">
          <div className="kg-catalog__list">
            <div className="kg-catalog__heading">COMPONENTS · {COMPONENTS.length}</div>
            {COMPONENTS.map(item => (
              <button type="button" key={item.id} className={`kg-catalog__item${current === item.id ? ' is-current' : ''}`} aria-current={current === item.id} onClick={() => setCurrent(item.id)} data-testid={`catalog-item-${item.id}`}>
                {item.name}
                <small>{item.note}</small>
              </button>
            ))}
          </div>
          {current === 'player' ? (
            <div className="kg-catalog__stage">
              <div className="kg-catalog__heading">PLAYER · LEFT RAIL</div>
              <PlayerPreview />
            </div>
          ) : (
            <div className="kg-catalog__stage">
              <div className="kg-catalog__heading">STATES</div>
              <div className="kg-catalog__actions">
                <button type="button" className="kg-chip" onClick={() => setReplay(r => r + 1)} data-testid="catalog-replay">REPLAY ENTRANCE</button>
              </div>
              <div className="kg-catalog__states" key={replay}>
                {STATES.map((state, index) => (
                  <div className="kg-specimen" key={state}>
                    <NeonButton size="catalog" label="EPISODES" icon={Icons.episodes} state={state} entering delay={0.1 + index * 0.12} testId={`specimen-${state}`} />
                    <span className="kg-specimen__caption">{state.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
