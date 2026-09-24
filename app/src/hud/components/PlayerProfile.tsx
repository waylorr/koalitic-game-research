import { memo } from 'react';
import { Panel } from './Panel';

/** Player Profile. Number and bar are two views of the same XP value. */
export const PlayerProfile = memo(function PlayerProfile({ name, level, xp, xpGoal }: {
  name: string | null;
  level: number | null;
  xp: number;
  xpGoal: number;
}) {
  const shownXp = Math.round(xp);
  const ratio = xpGoal > 0 ? Math.min(1, Math.max(0, shownXp / xpGoal)) : 0;
  return (
    <Panel w={430} h={176} title="PLAYER">
      <div className="k-portrait">
        <svg viewBox="0 0 108 108">
          <path className="k-silhouette" d="M54 22a18 18 0 1 1 0 36a18 18 0 1 1 0-36z M20 100c2-22 16-34 34-34s32 12 34 34z" />
          <path className="k-bracket" d="M0 18V0h18 M90 0h18v18 M108 90v18H90 M18 108H0V90" />
        </svg>
      </div>
      <svg className="k-rank-glyph" viewBox="0 0 30 30">
        <path d="M15 3 28 27H2z M15 11l7 12H8z" />
      </svg>
      <div className="k-player__info">
        <div className="k-player__name" data-testid="player-name">{name ?? 'CHOOSE PLAYER'}</div>
        <div className="k-player__level">LEVEL<b>{level ?? '—'}</b></div>
        <div className="k-bar"><div className="k-bar__fill" style={{ width: `${ratio * 100}%` }} /></div>
        <div className="k-player__xp" data-testid="player-xp">{shownXp.toLocaleString('en-US')} / {xpGoal.toLocaleString('en-US')} XP</div>
      </div>
    </Panel>
  );
});
