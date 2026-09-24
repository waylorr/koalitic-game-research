/** KOALITIC GAME wordmark: red slash (split on the main menu, double on other screens), wide lettering and THE SYSTEM. */
export function BrandLogo({ small, className = '' }: { small?: boolean; className?: string }) {
  return (
    <div className={`kg-brand${small ? ' kg-brand--small' : ''} ${className}`} aria-label="KOALITIC GAME, THE SYSTEM">
      {small ? (
        <svg className="kg-brand__mark" viewBox="0 0 100 86" aria-hidden="true">
          <path d="M38 0h26L26 86H0Z" />
          <path d="M74 0h26L62 86H36Z" />
        </svg>
      ) : (
        <svg className="kg-brand__mark" viewBox="0 0 100 86" aria-hidden="true">
          <path d="M58 0h42L68 47H26Z" />
          <path d="M23 53h40L41 86H0Z" />
        </svg>
      )}
      <div className="kg-brand__words">
        <div className="kg-brand__name">KOALITIC <span className="kg-brand__game">GAME</span></div>
        <div className="kg-brand__tag"><i />THE SYSTEM<i /></div>
      </div>
    </div>
  );
}
