import { useEffect, useState } from 'react';
import { BrandLogo } from '../ui/BrandLogo';
import { Icons, NeonButton } from '../ui/NeonButton';
import { sfx } from '../ui/sfx';
import type { Screen } from '../app/screens';
import { ComponentCatalog } from './ComponentCatalog';

const COPY: Record<Exclude<Screen, 'menu'>, { title: string; subtitle: string; next: string }> = {
  episodes: {
    title: 'EPISODES',
    subtitle: 'CONTINUE AN EPISODE OR CREATE A NEW ONE',
    next: 'Episode cards and NEW EPISODE arrive in the next milestone.',
  },
  'configure-hud': {
    title: 'CONFIGURE HUD',
    subtitle: 'MODULES, VARIANTS AND LIVE PREVIEW',
    next: 'Fixed zones, visual variants and motion presets, previewed with demo data.',
  },
  assets: {
    title: 'ASSETS',
    subtitle: 'MEDIA, DATA LIBRARY AND UI COMPONENTS',
    next: '',
  },
};

/** Destination screens in the final layout. Their content is built in later milestones. */
export function ScreenStub({ screen, onBack }: { screen: Exclude<Screen, 'menu'>; onBack: () => void }) {
  const copy = COPY[screen];
  const [backSelected, setBackSelected] = useState(false);
  const back = () => {
    sfx.unlock();
    sfx.back();
    onBack();
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <div className="kg-screen" data-testid={`screen-${screen}`}>
      <BrandLogo small className="kg-screen__brand" />
      <h1 className="kg-title">{copy.title}</h1>
      <p className="kg-subtitle">{copy.subtitle}</p>
      {screen === 'assets' ? (
        <ComponentCatalog />
      ) : (
        <section className="kg-panel">
          <span className="kg-panel__tag">UNDER CONSTRUCTION</span>
          <p>{copy.next}</p>
        </section>
      )}
      <div className="kg-screen__back" onPointerLeave={() => setBackSelected(false)} onBlur={() => setBackSelected(false)}>
        <NeonButton size="back" label="BACK" icon={Icons.back} selected={backSelected} entering delay={0.25} onSelect={() => { if (!backSelected) sfx.select(); setBackSelected(true); }} onActivate={back} testId="screen-back" />
      </div>
    </div>
  );
}
