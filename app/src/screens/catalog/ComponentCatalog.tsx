import { useState, type ReactNode } from 'react';
import { Icons, NeonButton, type NeonState } from '../../ui/NeonButton';
import { KitMotionPage, KitPiecesPage, KitThemePage } from './KitPages';
import { KitProvider } from './kitState';
import { GearPage } from './GearPage';
import { PlayerPage } from './PlayerPage';

const STATES: readonly NeonState[] = ['idle', 'selected', 'pressed', 'disabled'];

type PageId = 'button' | 'theme' | 'motion' | 'pieces' | 'player' | 'gear';
type SectionId = 'system' | 'kit' | 'hud';

interface Entry { readonly name: string; readonly page?: PageId }

/** HUD elements by zone (WORKFLOW/catalog/components.json); built ones open, the rest show as pending. */
const ZONES: readonly { id: string; zone: string; items: readonly Entry[] }[] = [
  { id: 'left', zone: 'LEFT RAIL', items: [{ name: 'PLAYER PROFILE', page: 'player' }, { name: 'INVENTORY / LOADOUT' }, { name: 'GEAR RADIAL', page: 'gear' }, { name: 'STAMINA' }, { name: 'TIME LEFT' }] },
  { id: 'top', zone: 'TOP BAR', items: [{ name: 'SYSTEM ONLINE' }, { name: 'NAVIGATION TABS' }, { name: 'LOCATION HEADER' }] },
  { id: 'right', zone: 'RIGHT RAIL', items: [{ name: 'ACTIVE MISSION' }, { name: 'PHOTO OPPORTUNITIES' }, { name: 'LOCATION / MINI MAP' }, { name: 'CODEX COMPACT' }] },
  { id: 'pov', zone: 'POV OVERLAYS', items: [{ name: 'WEATHER / LOCATION' }, { name: 'PERSON IDENTIFICATION' }, { name: 'SYSTEM NOTIFICATION' }, { name: 'PHOTO RESULT' }, { name: 'QUEST REVEAL' }, { name: 'LEVEL UP' }] },
];

const SECTIONS: readonly { id: SectionId; title: string; hint: string; first: PageId }[] = [
  { id: 'system', title: 'SYSTEM UI', hint: 'The app’s own interface', first: 'button' },
  { id: 'kit', title: 'HUD KIT', hint: 'Theme, motion and pieces shared by the HUD', first: 'theme' },
  { id: 'hud', title: 'HUD ELEMENTS', hint: 'What goes on the video, by zone', first: 'player' },
];

const SECTION_OF: Record<PageId, SectionId> = { button: 'system', theme: 'kit', motion: 'kit', pieces: 'kit', player: 'hud', gear: 'hud' };
const TITLES: Record<PageId, string> = {
  button: 'SYSTEM UI · NEON BUTTON',
  theme: 'HUD KIT · THEME',
  motion: 'HUD KIT · MOTION',
  pieces: 'HUD KIT · PIECES',
  player: 'HUD ELEMENTS · LEFT RAIL · PLAYER PROFILE',
  gear: 'HUD ELEMENTS · LEFT RAIL · GEAR RADIAL',
};

/**
 * ASSETS → UI COMPONENTS, navigated like a game menu: three sections, only the
 * open one unfolds; inside HUD ELEMENTS each zone unfolds to list all of its
 * elements (pending ones greyed). The page on the right uses the full width.
 */
export function ComponentCatalog() {
  const [page, setPage] = useState<PageId>('player');
  const [zone, setZone] = useState('left');
  const section = SECTION_OF[page];
  const sub = (id: PageId, text: string) => (
    <button type="button" className={`kg-menu2__item${page === id ? ' is-current' : ''}`} aria-current={page === id} onClick={() => setPage(id)} data-testid={`catalog-item-${id}`}>{text}</button>
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
          <nav className="kg-menu2" aria-label="Components">
            {SECTIONS.map(s => (
              <div key={s.id} className={`kg-menu2__section${section === s.id ? ' is-open' : ''}`}>
                <button type="button" className="kg-menu2__head" onClick={() => setPage(s.first)} data-testid={`catalog-section-${s.id}`}>
                  <span className="kg-menu2__title">{s.title}</span>
                  <small>{s.hint}</small>
                </button>
                {section === s.id && s.id === 'system' && <div className="kg-menu2__list">{sub('button', 'NEON BUTTON')}</div>}
                {section === s.id && s.id === 'kit' && <div className="kg-menu2__list">{sub('theme', 'THEME')}{sub('motion', 'MOTION')}{sub('pieces', 'PIECES')}</div>}
                {section === s.id && s.id === 'hud' && (
                  <div className="kg-menu2__list">
                    {ZONES.map(z => (
                      <div key={z.id}>
                        <button type="button" className={`kg-menu2__zone${zone === z.id ? ' is-open' : ''}`} onClick={() => setZone(zone === z.id ? '' : z.id)} data-testid={`catalog-zone-${z.id}`}>
                          <span>{zone === z.id ? '▾' : '▸'} {z.zone}</span>
                          <small>{z.items.filter(i => i.page).length}/{z.items.length}</small>
                        </button>
                        {zone === z.id && z.items.map(entry => entry.page
                          ? <div key={entry.name}>{sub(entry.page, entry.name)}</div>
                          : <div key={entry.name} className="kg-menu2__item is-pending">{entry.name}<small>SOON</small></div>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="kg-catalog__stage">
            <div className="kg-catalog__heading">{TITLES[page]}</div>
            <Page key={page} id={page} />
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
  if (id === 'gear') return <GearPage key="gear" />;
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
