function handleEpisodeClick(data) {
  if (data.applyEpisodeHud) { const chosen = templates.find(item => item.id === (pendingEpisodeHudId || get('episode-hud-select')?.value)); if (applyHudTemplate(chosen)) { renderPrototype(); notify(chosen.name + ' applied. Episode data and timeline kept.'); } return true; }
  if (data.restoreHud) { if (restorePreviousHud()) renderPrototype(); return true; }
  if (data.saveLook) {
    const number = templates.length + 1, copy = clone(episode.hud);
    copy.id = 'hud_' + Date.now() + '_' + number; copy.name = 'HUD V' + number;
    templates.push(copy); persistProject(copy.name); return true;
  }
  return false;
}
