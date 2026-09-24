function renderPrototype() {
  const screen = screens[current], stage = get('stage');
  if (current === 'episode_editor') timelineScrollTop = stage.querySelector?.('.timeline-scroll')?.scrollTop ?? timelineScrollTop;
  get('screen-title').textContent = screen.title + ' · ' + screen.status.toUpperCase();
  get('screen-note').textContent = screen.visual_note;
  get('routes').innerHTML = screen.controls.filter(item => item.target).map(item =>
    `<button class="ui-btn" data-control="${item.id}">${escapeHtml(item.label)} → ${escapeHtml(item.target)}</button>`).join('');
  stage.className = 'stage' + (['configure_hud','episode_editor','assets'].includes(current) ? ' wide' : '');
  const renderers = { main_menu: menuScreen, episodes: episodesScreen, new_episode: newEpisodeScreen,
    configure_hud: configScreen, episode_editor: editorScreen, assets: assetsScreen };
  try { stage.innerHTML = renderers[current]?.() || ''; }
  catch (error) {
    console.error('Screen failed: ' + current, error);
    stage.innerHTML = `<div class="screen-failure"><h2>${escapeHtml(screen.title)} UNAVAILABLE</h2><p>This screen failed to render. Other screens and saved work are still accessible.</p><button class="ui-btn" data-open="main_menu">← MAIN MENU</button></div>`;
    return;
  }
  if (current === 'episode_editor') { const scroll = stage.querySelector?.('.timeline-scroll'); if (scroll) scroll.scrollTop = timelineScrollTop; }
  if (current === 'episode_editor' && episode.mediaKind === 'video') {
    const video = stage.querySelector('video.episode-media');
    if (video) video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(playhead, Math.max(0,video.duration-0.04));
      const duration = Math.ceil(video.duration);
      if (Number.isFinite(duration) && duration > 0 && episode.duration !== duration) {
        episode.duration = duration;
        const slider = get('playhead'); if (slider) slider.max = String(duration);
      }
    });
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const data = button.dataset;
  for (const handler of [handleTimelineClick,handleNavigationClick,handleHudClick,handleAssetsClick,handleEpisodeClick]) {
    try { if (handler(data)) return; }
    catch (error) { console.error('Interaction failed',error); notify('This action failed; other screens remain available'); return; }
  }
});
document.addEventListener('change', event => {
  const field = event.target, id = field.id;
  if (id === 'episode-hud-select') { pendingEpisodeHudId = field.value; return; }
  if (field.dataset.timelineBinding) { setEpisodeBinding(field.dataset.timelineBinding,field.value); renderPrototype(); return; }
  if (field.dataset.timelineOverlayId) {
    const item = episode.overlays.find(entry => entry.id === field.dataset.timelineOverlayId), key = field.dataset.timelineOverlayField;
    if (item) {
      if (key === 'x' || key === 'y') { const position = overlayPosition(item,playhead); setOverlayPosition(item,key === 'x' ? Number(field.value) : position.x,key === 'y' ? Number(field.value) : position.y); }
      else item[key] = key === 'text' ? field.value : Math.max(0,Math.min(episode.duration,Number(field.value)));
      item.end = Math.max(item.start,item.end);
    }
    renderPrototype(); return;
  }
  if (field.dataset.timelineValue) { const property = timelineProperty(field.dataset.timelineValue); if (property) setTimelineValue(property,field.value); renderPrototype(); return; }
  if (id === 'asset-files') {
    for (const file of field.files) { const item = importFile(file); if (item) selectedMediaId = item.id; }
    renderPrototype(); persistProject('Media library'); return;
  }
  if (id === 'media-source-note') { const item = mediaById(selectedMediaId); if (item) item.sourceNote = field.value; persistProject('Media library'); return; }
  if (id === 'preset-select') { templateId = field.value; working = clone(currentTemplate()); dirty = false; renderPrototype(); return; }
  if (id === 'rail-motion') { working.zoneMotion ??= {}; working.zoneMotion['LEFT RAIL'] = field.value; dirty = true; renderPrototype(); return; }
  if (id === 'template-name') { working.name = field.value.trim() || working.name; dirty = true; renderPrototype(); return; }
  if (field.dataset.zoneEnabled) { working.zoneEnabled[field.dataset.zoneEnabled] = field.checked; dirty = true; renderPrototype(); return; }
  if (field.dataset.toggleModule) { working.modules[field.dataset.toggleModule].enabled = field.checked; dirty = true; selectedModule = field.dataset.toggleModule; renderPrototype(); return; }
  if (field.dataset.templateSetting) { working.modules[selectedModule][field.dataset.templateSetting] = field.value; dirty = true; renderPrototype(); return; }
  if (field.dataset.episodeSetting) { episode.hud.modules[selectedModule][field.dataset.episodeSetting] = field.value; renderPrototype(); return; }
  if (id === 'episode-module-enabled') { episode.hud.modules[selectedModule].enabled = field.checked; renderPrototype(); return; }
  if (id === 'playhead') { playhead = Number(field.value); renderPrototype(); return; }
  if (id === 'episode-player') {
    setEpisodeBinding('player',field.value);
    renderPrototype(); return;
  }
  if (id === 'episode-location') {
    const chosen = recordById(field.value), snapshot = chosen ? clone(chosen) : null;
    if (playhead === 0) episode.bindings.location = snapshot;
    setPoint('location',snapshot); renderPrototype(); return;
  }
  if (field.dataset.gearSlot !== undefined) {
    setEpisodeBinding('gear:'+field.dataset.gearSlot,field.value);
    renderPrototype(); return;
  }
  if (id === 'episode-xp' || id === 'episode-stamina') {
    const value = Math.max(0, Number(field.value)); setPoint(id === 'episode-xp' ? 'xp' : 'stamina', id === 'episode-stamina' ? Math.min(100,value) : value);
    renderPrototype(); return;
  }
  if (id === 'gear-selection') { setPoint('gearSelection',Number(field.value)); renderPrototype(); return; }
  const overlay = episode?.overlays.find(item => item.id === selectedOverlayId);
  const overlayField = {'overlay-text':'text','overlay-start':'start','overlay-end':'end','overlay-x':'x','overlay-y':'y'}[id];
  if (overlay && overlayField) {
    if (overlayField === 'x' || overlayField === 'y') {
      const position = overlayPosition(overlay,playhead);
      setOverlayPosition(overlay,overlayField === 'x' ? Number(field.value) : position.x,overlayField === 'y' ? Number(field.value) : position.y);
    } else overlay[overlayField] = overlayField === 'text' ? field.value : Number(field.value);
    overlay.start = Math.max(0,Math.min(episode.duration,overlay.start));
    overlay.end = Math.max(overlay.start,Math.min(episode.duration,overlay.end));
    renderPrototype(); return;
  }
  const record = recordById(selectedRecordId);
  const recordField = {'record-type':'type','record-name':'name','record-note':'note','record-media':'mediaId','record-level':'defaultLevel','record-xp':'defaultXp','record-goal':'xpGoal'}[id];
  if (record && recordField) {
    record[recordField] = ['defaultLevel','defaultXp','xpGoal'].includes(recordField) ? Math.max(0,Number(field.value)) : field.value;
    renderPrototype(); persistProject('Data library');
  }
});
document.addEventListener('input', event => {
  if (event.target.id !== 'asset-search') return;
  assetSearch = event.target.value.toLowerCase();
  document.querySelectorAll('.asset-list .asset-row').forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(assetSearch); });
});
document.addEventListener('dragstart', event => {
  const palette = event.target.closest('[data-overlay-palette]');
  const instance = event.target.closest('[data-overlay-id]');
  if (palette) event.dataTransfer.setData('text/plain','new:'+palette.dataset.overlayPalette);
  else if (instance) event.dataTransfer.setData('text/plain','move:'+instance.dataset.overlayId);
});
document.addEventListener('dragover', event => { if (event.target.closest('#hud-canvas') && current === 'episode_editor') event.preventDefault(); });
document.addEventListener('drop', event => {
  const canvas = event.target.closest('#hud-canvas'); if (!canvas || current !== 'episode_editor') return;
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0,Math.min(100,100*(event.clientX-rect.left)/rect.width));
  const y = Math.max(0,Math.min(100,100*(event.clientY-rect.top)/rect.height));
  const data = event.dataTransfer.getData('text/plain');
  if (data.startsWith('new:')) createOverlay(data.slice(4),x,y);
  else if (data.startsWith('move:')) {
    const item = episode.overlays.find(overlay => overlay.id === data.slice(5));
    if (item) { setOverlayPosition(item,x,y); selectedOverlayId = item.id; renderPrototype(); }
  }
});
renderFlow();
renderSpec();
renderPrototype();
ProjectStore.load().then(snapshot => {
  if (hydrateProject(snapshot)) { renderPrototype(); notify('Saved project loaded from this device'); }
});
