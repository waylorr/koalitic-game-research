function notify(message) { const node = get('status'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 3000); }
function currentTemplate() { return templates.find(item => item.id === templateId); }
function currentHud() { return current === 'episode_editor' ? episode.hud : working; }
function recordById(id) { return records.find(item => item.id === id); }
function mediaById(id) { return media.find(item => item.id === id); }
function recordOptions(type, selectedId) {
  return '<option value="">Choose from Data Library…</option>' + records.filter(item => item.type === type && (!item.archived || item.id === selectedId)).map(item =>
    `<option value="${escapeHtml(item.id)}" ${selectedId === item.id ? 'selected' : ''}>${escapeHtml(item.name)}${item.archived ? ' (archived)' : ''}</option>`
  ).join('');
}
function playerForEpisode() { return episode?.bindings.player || null; }
function gearForEpisode(slot) { return episode?.bindings.gear[slot] || null; }
function newEpisodeModel(name, mediaItem, template, example = false) {
  const player = example ? records.find(item => item.type === 'Player' && !item.archived) : null;
  const gear = example ? records.find(item => item.type === 'Gear' && !item.archived) : null;
  return {
    id: 'episode_' + Date.now() + '_' + Math.random().toString(36).slice(2), name,
    mediaId: mediaItem?.id || null, mediaUrl: mediaItem?.url || null, mediaKind: mediaItem?.kind || null,
    sourceTemplate: template.name, sourceTemplateId: template.id, hud: clone(template),
    bindings: { player: player ? clone(player) : null, gear: [gear ? clone(gear) : null, null, null, null, null], location: null },
    tracks: { xp: [{t:0,v:player?.defaultXp ?? 0}], stamina: example ? [{t:0,v:100},{t:90,v:80}] : [{t:0,v:100}], leftRail: [{t:0,v:'Open'}], gearSelection: [{t:0,v:1}], location: [] },
    overlays: [], duration: 120
  };
}
episodes.push(newEpisodeModel('GIRONA', null, templates[0], true));
function openEpisode(id) { const stored = episodes.find(item => item.id === id); if (!stored) return; episode = clone(stored); previousEpisodeHud = null; pendingEpisodeHudId = null; playhead = 0; lastEpisodeRail = null; selectedModule = 'Player Profile'; selectedOverlayId = null; openScreen('episode_editor'); }
function applyHudTemplate(template) {
  if (!episode || !template || episode.sourceTemplateId === template.id && JSON.stringify(episode.hud) === JSON.stringify(template)) return false;
  previousEpisodeHud = {hud:clone(episode.hud), sourceTemplate:episode.sourceTemplate, sourceTemplateId:episode.sourceTemplateId};
  episode.hud = clone(template);
  episode.sourceTemplate = template.name;
  episode.sourceTemplateId = template.id;
  pendingEpisodeHudId = null;
  selectedModule = episode.hud.modules[selectedModule] ? selectedModule : 'Player Profile';
  return true;
}
function restorePreviousHud() {
  if (!episode || !previousEpisodeHud) return false;
  const previous = previousEpisodeHud;
  previousEpisodeHud = {hud:clone(episode.hud),sourceTemplate:episode.sourceTemplate,sourceTemplateId:episode.sourceTemplateId};
  episode.hud = clone(previous.hud); episode.sourceTemplate = previous.sourceTemplate; episode.sourceTemplateId = previous.sourceTemplateId;
  return true;
}
function setView(next) {
  view = next;
  document.querySelectorAll('.view').forEach(node => node.classList.toggle('active', node.id === next));
  document.querySelectorAll('[data-view]').forEach(node => node.classList.toggle('active', node.dataset.view === next));
  if (next === 'prototype') renderPrototype();
}
function openScreen(id) { if (id === 'episode_editor' && !episode) episode = clone(episodes[0]); current = id; setView('prototype'); }
function control(id) { return screens[current].controls.find(item => item.id === id); }
function importFile(file, sourceNote = '') {
  if (!/^(image|video)\//.test(file.type)) return null;
  const item = { id: 'media_' + Date.now() + '_' + Math.random().toString(36).slice(2), name: file.name,
    kind: file.type.startsWith('image/') ? 'image' : 'video', size: file.size, url: URL.createObjectURL(file), blob: file, sourceNote };
  media.push(item); return item;
}
function projectSnapshot() {
  return {templates:clone(templates),records:clone(records),episodes:clone(episodes),
    media:media.map(({url, ...item}) => item)};
}
async function persistProject(label) {
  const stored = await ProjectStore.save(projectSnapshot());
  notify(stored ? label + ' saved on this device' : label + ' saved for this session only; browser storage unavailable');
  return stored;
}
function hydrateProject(snapshot) {
  if (!Array.isArray(snapshot?.templates) || !Array.isArray(snapshot?.episodes) || !Array.isArray(snapshot?.records) || !Array.isArray(snapshot?.media)) return false;
  for (const item of media) if (item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
  templates.splice(0,templates.length,...snapshot.templates);
  if (!templates.length) templates.push(baseTemplate());
  records.splice(0,records.length,...snapshot.records);
  media.splice(0,media.length,...snapshot.media.map(item => ({...item,url:item.blob ? URL.createObjectURL(item.blob) : null})));
  const urls = new Map(media.map(item => [item.id,item.url]));
  episodes.splice(0,episodes.length,...snapshot.episodes.map(item => ({...item,sourceTemplateId:item.sourceTemplateId || templates.find(template => template.name === item.sourceTemplate)?.id || templates[0]?.id,mediaUrl:urls.get(item.mediaId) || null})));
  templateId = templates[0].id; working = clone(templates[0]);
  episode = null; previousEpisodeHud = null; pendingEpisodeHudId = null;
  return true;
}
function saveEpisode() {
  const index = episodes.findIndex(item => item.id === episode.id);
  if (index >= 0) episodes[index] = clone(episode); else episodes.push(clone(episode));
  persistProject('Episode');
}
function saveTemplate() {
  const index = templates.findIndex(item => item.id === templateId);
  if (index >= 0) templates[index] = clone(working); else templates.push(clone(working));
  dirty = false; renderPrototype(); persistProject(working.name);
}
function duplicateTemplate(fromBase = false) {
  const number = templates.length + 1;
  working = fromBase ? baseTemplate('HUD V' + number) : clone(working);
  working.id = 'hud_' + Date.now() + '_' + number; working.name = 'HUD V' + number;
  templateId = working.id; dirty = true; renderPrototype();
}
function runControl(id) {
  const item = control(id); if (!item) return;
  if (id === 'create_episode') {
    const name = get('episode-name')?.value.trim();
    const file = get('media-input')?.files?.[0];
    let mediaItem = mediaById(get('existing-media')?.value);
    if (!name || (!file && !mediaItem)) { notify('Enter a name and choose a video or image.'); return; }
    if (file) mediaItem = importFile(file, 'Imported with episode ' + name);
    const template = templates.find(preset => preset.id === get('hud-select')?.value) || templates[0];
    episode = newEpisodeModel(name, mediaItem, template); episodes.push(clone(episode));
    selectedModule = 'Player Profile'; playhead = 0; openScreen('episode_editor'); return;
  }
  if (id === 'girona') { openEpisode(episodes[0].id); return; }
  if (id === 'import') { get('asset-files')?.click(); return; }
  if (id === 'save_episode') { saveEpisode(); return; }
  if (id === 'save') { saveTemplate(); return; }
  if (id === 'new_preset') { duplicateTemplate(true); return; }
  if (id === 'duplicate') { duplicateTemplate(); return; }
  if (item.target) { openScreen(item.target); return; }
  notify((item.command || item.label) + ' · prototype action');
}
function moveModule(name, direction) {
  const order = currentHud().order[components[name].zone], index = order.indexOf(name), next = index + direction;
  if (next < 0 || next >= order.length) return;
  [order[index], order[next]] = [order[next], order[index]];
  if (current === 'configure_hud') dirty = true;
  renderPrototype();
}
function createOverlay(name, x = 50, y = 50) {
  if (!episode || !overlayNames.includes(name)) return;
  const overlay = { id: 'overlay_' + Date.now(), component: name, positions: [{t:playhead,x,y}], start: playhead, end: Math.min(episode.duration, playhead + 5), text: components[name].label };
  episode.overlays.push(overlay); selectedOverlayId = overlay.id; renderPrototype();
}
