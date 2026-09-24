function renderPlayerProfile(state, label) {
  const player = state.player;
  const image = player?.mediaId && mediaById(player.mediaId)?.kind === 'image' ? mediaById(player.mediaId) : null;
  const portrait = image ? `<img class="profile-image" src="${image.url}" alt="">` : '<span class="profile-image">◉</span>';
  const xpGoal = player?.xpGoal || 5000;
  const width = Math.max(0,Math.min(100,100*state.xp/xpGoal));
  return `<span class="profile-line">${portrait}<span>${label}<br><strong>${escapeHtml(player?.name || 'CHOOSE PLAYER')}</strong> · LV ${escapeHtml(player?.defaultLevel ?? '—')}</span></span><span class="hud-valuebar"><i style="width:${width}%"></i></span><small>${state.xp.toLocaleString()} / ${xpGoal.toLocaleString()} XP</small>`;
}
