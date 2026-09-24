function handleNavigationClick(data) {
  if (data.view) { setView(data.view); return true; }
  if (data.open) { openScreen(data.open); return true; }
  if (data.episodeId) { openEpisode(data.episodeId); return true; }
  if (data.control) { runControl(data.control); return true; }
  return false;
}
