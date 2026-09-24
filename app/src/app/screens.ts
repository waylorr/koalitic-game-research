export type Screen = 'menu' | 'episodes' | 'configure-hud' | 'assets';

const SCREENS: readonly Screen[] = ['menu', 'episodes', 'configure-hud', 'assets'];

/** Screens map to plain hash anchors (#episodes…) so a link or the browser back button lands on them. */
export function screenFromHash(hash: string): Screen {
  const id = hash.replace(/^#/, '');
  return (SCREENS as readonly string[]).includes(id) && id !== 'menu' ? (id as Screen) : 'menu';
}

export function hashForScreen(screen: Screen): string {
  return screen === 'menu' ? '' : `#${screen}`;
}
