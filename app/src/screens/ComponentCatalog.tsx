import { useState } from 'react';
import { Icons, NeonButton, type NeonState } from '../ui/NeonButton';

const STATES: readonly NeonState[] = ['idle', 'selected', 'pressed', 'disabled'];

/** ASSETS → UI COMPONENTS: each approved component shown in all of its states. */
export function ComponentCatalog() {
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
            <div className="kg-catalog__heading">COMPONENTS · 1</div>
            <button type="button" className="kg-catalog__item" aria-current="true">
              NEON BUTTON
              <small>Menu and navigation actions. Cyan when idle, red when selected.</small>
            </button>
          </div>
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
        </div>
      </section>
    </>
  );
}
