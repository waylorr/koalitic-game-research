import { useCallback, useEffect, useRef, useState } from 'react';
import { TokensProvider } from '../design/TokensProvider';
import { EpisodeEditor } from '../editor/EpisodeEditor';
import { MainMenu } from '../screens/MainMenu';
import { ScreenStub } from '../screens/ScreenStub';
import { SystemOffline } from '../screens/SystemOffline';
import { Backdrop, Stage } from '../ui/Stage';
import { sfx } from '../ui/sfx';
import { hashForScreen, screenFromHash, type Screen } from './screens';
import './app.css';

const LEAVE_MS = 260;
const BACKGROUNDS = {
  menu: `${import.meta.env.BASE_URL}backgrounds/main-menu.jpg`,
  screen: `${import.meta.env.BASE_URL}backgrounds/screen.jpg`,
};

/** Authoring app shell: fixed 16:9 stage, background art per screen, screens swapped on top. */
export function App() {
  const [screen, setScreen] = useState<Screen>(() => screenFromHash(window.location.hash));
  const [shown, setShown] = useState<Screen>(screen);
  const [leaving, setLeaving] = useState(false);
  const [offline, setOffline] = useState(false);
  const booted = useRef(false);

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (screen === shown) return;
    setLeaving(true);
    const id = window.setTimeout(() => {
      setShown(screen);
      setLeaving(false);
    }, LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [screen, shown]);

  const open = useCallback((next: Screen) => {
    const hash = hashForScreen(next);
    try {
      window.history.pushState(null, '', hash || window.location.pathname + window.location.search);
    } catch {
      window.location.hash = hash;
    }
    setScreen(next);
  }, []);

  const quit = useCallback(() => {
    sfx.shutdown();
    setOffline(true);
  }, []);
  const reboot = useCallback(() => {
    sfx.unlock();
    sfx.boot();
    setOffline(false);
  }, []);

  const firstVisit = !booted.current && shown === 'menu';
  useEffect(() => {
    booted.current = true;
  }, []);

  const background = screen === 'menu' ? 'menu' : 'screen';
  return (
    <TokensProvider>
    <Stage background={BACKGROUNDS[background]}>
      <Backdrop images={BACKGROUNDS} active={background} dimmed={offline} />
      <div key={shown} className={`kg-layer${leaving ? ' is-leaving' : ''}${offline ? ' is-hidden' : ''}`}>
        {shown === 'menu' ? (
          <MainMenu firstVisit={firstVisit} onOpen={open} onQuit={quit} />
        ) : shown === 'episodes' ? (
          <EpisodeEditor onBack={() => open('menu')} />
        ) : (
          <ScreenStub screen={shown} onBack={() => open('menu')} />
        )}
      </div>
      {offline && <SystemOffline onReboot={reboot} />}
      <div className="kg-app__boot" />
    </Stage>
    </TokensProvider>
  );
}
