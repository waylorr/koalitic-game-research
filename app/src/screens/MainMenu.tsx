import { useEffect, useRef, useState } from 'react';
import { BrandLogo } from '../ui/BrandLogo';
import { Icons, NeonButton } from '../ui/NeonButton';
import { sfx } from '../ui/sfx';
import type { Screen } from '../app/screens';

const ENTRIES: { screen: Exclude<Screen, 'menu'>; label: string; icon: keyof typeof Icons }[] = [
  { screen: 'episodes', label: 'EPISODES', icon: 'episodes' },
  { screen: 'configure-hud', label: 'CONFIGURE HUD', icon: 'configure' },
  { screen: 'assets', label: 'ASSETS', icon: 'assets' },
];

/** Main menu: one highlighted entry at a time, driven by mouse or arrow keys. */
export function MainMenu({ onOpen, onQuit, firstVisit }: { onOpen: (screen: Screen) => void; onQuit: () => void; firstVisit: boolean }) {
  const [selected, setSelected] = useState(0);
  const [pressed, setPressed] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(sfx.isEnabled());
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const select = (index: number) => {
    if (index === selectedRef.current) return;
    setSelected(index);
    sfx.select();
  };
  const activate = (index: number) => {
    sfx.unlock();
    setSelected(index);
    setPressed(index);
    if (index === ENTRIES.length) {
      onQuit();
      return;
    }
    sfx.confirm();
    window.setTimeout(() => onOpen(ENTRIES[index]!.screen), 140);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      sfx.unlock();
      const last = ENTRIES.length; // QUIT GAME
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) { event.preventDefault(); select((selectedRef.current + 1) % (last + 1)); }
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); select((selectedRef.current + last) % (last + 1)); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(selectedRef.current); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={`kg-menu${firstVisit ? ' is-booting' : ''}`} data-testid="main-menu">
      <BrandLogo className="kg-menu__brand" />
      <nav className="kg-menu__buttons" aria-label="Main menu">
        {ENTRIES.map((entry, index) => (
          <NeonButton
            key={entry.screen}
            label={entry.label}
            icon={Icons[entry.icon]}
            size="menu"
            selected={selected === index}
            entering
            delay={(firstVisit ? 1.1 : 0.15) + index * 0.12}
            onSelect={() => select(index)}
            onActivate={() => activate(index)}
            testId={`menu-${entry.screen}`}
          />
        ))}
      </nav>
      <button
        type="button"
        className={`kg-menu__quit${selected === ENTRIES.length ? ' is-selected' : ''}${pressed === ENTRIES.length ? ' is-pressed' : ''}`}
        onPointerEnter={() => select(ENTRIES.length)}
        onFocus={() => select(ENTRIES.length)}
        onClick={() => activate(ENTRIES.length)}
        data-testid="menu-quit"
      >
        QUIT GAME
      </button>
      <div className="kg-menu__status">
        <span className="kg-dot" /> SYSTEM ONLINE
        <button type="button" className="kg-menu__sfx" onClick={() => { const next = !soundOn; sfx.setEnabled(next); setSoundOn(next); if (next) { sfx.unlock(); sfx.select(); } }}>
          SFX {soundOn ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
