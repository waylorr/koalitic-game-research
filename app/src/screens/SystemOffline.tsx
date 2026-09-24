import { useEffect, useRef } from 'react';

/** QUIT GAME in a browser: a page cannot close its own tab, so THE SYSTEM powers down instead. */
export function SystemOffline({ onReboot }: { onReboot: () => void }) {
  const armed = useRef(false);
  useEffect(() => {
    const arm = window.setTimeout(() => (armed.current = true), 900);
    const reboot = () => armed.current && onReboot();
    window.addEventListener('keydown', reboot);
    window.addEventListener('pointerdown', reboot);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener('keydown', reboot);
      window.removeEventListener('pointerdown', reboot);
    };
  }, [onReboot]);
  return (
    <div className="kg-offline" role="dialog" aria-label="System offline" data-testid="system-offline">
      <div className="kg-offline__title" data-text="SYSTEM OFFLINE">SYSTEM OFFLINE</div>
      <div className="kg-offline__hint">PRESS ANY KEY TO REBOOT</div>
    </div>
  );
}
