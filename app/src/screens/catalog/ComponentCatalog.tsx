import { useState, type ReactNode } from 'react';
import { Icons, NeonButton, type NeonState } from '../../ui/NeonButton';
import { KitMotionPage, KitPiecesPage, KitThemePage } from './KitPages';
import { KitProvider } from './kitState';
import { PlayerPage } from './PlayerPage';

const STATES: readonly NeonState[] = ['idle', 'selected', 'pressed', 'disabled'];

type PageId = 'button' | 'theme' | 'motion' | 'pieces' | 'player';

/** HUD elements by zone (WORKFLOW/catalog/components.json); built ones are selectable. */
const ZONES: readonly { zone: string; items: readonly { name: string; page?: PageId }[] }[] = [
  { zone: 'LEFT RAIL', items: [{ name: 'PLAYER PROFILE', page: 'player' }, { name: 'INVENTORY / LOADOUT' }, { name: 'GEAR RADIAL' }, { name: 'STAMINA' }, { name: 'TIME LEFT' }] },
  { zone: 'TOP BAR', items: [{ name: 'SYSTEM ONLINE' }, { name: 'NAVIGATION TABS' }, { name: 'LOCATION HEADER' }] },
  { zone: 'RIGHT RAIL', items: [{ name: 'ACTIVE MISSION' }, { name: 'PHOTO OPPORTUNITIES' }, { name: 'LOCATION / MINI MAP' }, { name: 'CODEX COMPACT' }] },
  { zone: 'POV OVERLAYS', items: [{ name: 'WEATHER / LOCATION' }, { name: 'PERSON IDENTIFICATION' }, { name: 'SYSTEM NOTIFICATION' }, { name: 'PHOTO RESULT' }, { name: 'QUEST REVEAL' }, { name: 'LEVEL UP' }] },
];

const TITLES: Record<PageId, string> = {
  button: 'SYSTEM UI · NEON BUTTON',
  theme: 'HUD KIT · THEME',
  motion: 'HUD KIT · MOTION',
  pieces: 'HUD KIT · PIECES',
  player: 'HUD ELEMENT · LEFT RAIL · PLAYER PROFILE',
};

/**
 * ASSETS → UI COMPONENTS. SYSTEM UI is the app's own interface (never exported);
 * HUD KIT is the shared theme, motion and pieces; HUD ELEMENTS are what goes on
 * the video, by zone. Each element is approved here before it is used.
 */
export function ComponentCatalog() {
  const [page, setPage] = useState<PageId>('player');
  const item = (id: PageId, text: string, testId: string) => (
    <button type="button" className={`kg-nav__item${page === id ? ' is-current' : ''}`} aria-current={page === id} onClick={() => setPage(id)} data-testid={testId}>{text}</button>
  );
  return (
    <KitProvider>
      <div className="kg-tabs" role="tablist" aria-label="Asset views">
        <button type="button" className="kg-tab" role="tab" disabled>MEDIA<small>SOON</small></button>
        <button type="button" className="kg-tab" role="tab" disabled>DATA LIBRARY<small>SOON</small></button>
        <button type="button" className="kg-tab is-active" role="tab" aria-selected="true">UI COMPONENTS</button>
      </div>
      <section className="kg-catalog" data-testid="catalog">
        <div className="kg-catalog__inner">
          <nav className="kg-nav" aria-label="Components">
            <div className="kg-nav__group">SYSTEM UI</div>
            {item('button', 'NEON BUTTON', 'catalog-item-button')}
            <div className="kg-nav__group">HUD KIT</div>
            {item('theme', 'THEME', 'catalog-item-theme')}
            {item('motion', 'MOTION', 'catalog-item-motion')}
            {item('pieces', 'PIECES', 'catalog-item-pieces')}
            <div className="kg-nav__group">HUD ELEMENTS</div>
            {ZONES.map(zone => (
              <div key={zone.zone} className="kg-nav__zone">
                <div className="kg-nav__zone-name">{zone.zone}<small>{zone.items.filter(i => i.page).length}/{zone.items.length}</small></div>
                {zone.items.map(entry => entry.page
                  ? <div key={entry.name}>{item(entry.page, entry.name, `catalog-item-${entry.page}`)}</div>
                  : null)}
              </div>
            ))}
          </nav>
          <div className="kg-catalog__stage">
            <div className="kg-catalog__heading">{TITLES[page]}</div>
            <Page id={page} />
          </div>
        </div>
      </section>
    </KitProvider>
  );
}

function Page({ id }: { id: PageId }): ReactNode {
  if (id === 'theme') return <KitThemePage />;
  if (id === 'motion') return <KitMotionPage />;
  if (id === 'pieces') return <KitPiecesPage />;
  if (id === 'player') return <PlayerPage />;
  return <ButtonPage />;
}

function ButtonPage() {
  const [replay, setReplay] = useState(0);
  return (
    <>
      <div className="kg-catalog__actions">
        <button type="button" className="kg-chip" onClick={() => setReplay(r => r + 1)} data-testid="catalog-replay">REPLAY ENTRANCE</button>
      </div>
      <p className="kg-page__intro">Menu and navigation actions of the app itself. Cyan when idle, red when selected. Not part of the HUD.</p>
      <div className="kg-catalog__states" key={replay}>
        {STATES.map((state, index) => (
          <div className="kg-specimen" key={state}>
            <NeonButton size="catalog" label="EPISODES" icon={Icons.episodes} state={state} entering delay={0.1 + index * 0.12} testId={`specimen-${state}`} />
            <span className="kg-specimen__caption">{state.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </>
  );
}
