function zoneTree(mode) {
  const hud = mode === 'template' ? working : episode.hud;
  return shellZones.map(zone => `<div class="zone-label">${escapeHtml(zone)} ${mode === 'template' ? `<label class="zone-toggle"><input type="checkbox" data-zone-enabled="${zone}" ${hud.zoneEnabled[zone] ? 'checked' : ''}> INCLUDE</label>` : ''}</div>${hud.order[zone].map(name => {
    const enabled = hud.modules[name].enabled;
    return `<div class="module-row ${selectedModule === name && !selectedOverlayId ? 'selected' : ''}"><button data-select-module="${escapeHtml(name)}">${escapeHtml(components[name].label)}</button>${mode === 'template' ? `<button class="small-icon" data-move-module="${escapeHtml(name)}" data-direction="-1" title="Move up">↑</button><button class="small-icon" data-move-module="${escapeHtml(name)}" data-direction="1" title="Move down">↓</button><input aria-label="Include ${escapeHtml(name)}" type="checkbox" data-toggle-module="${escapeHtml(name)}" ${enabled ? 'checked' : ''}>` : `<small>${enabled ? 'ON' : 'OFF'}</small>`}</div>`;
  }).join('')}`).join('');
}
function sampleData(mode) {
  if (mode === 'template') return { player: {name:'DEMO PLAYER',defaultLevel:12,defaultXp:3250,xpGoal:5000}, xp:3250, stamina:72, rail:'Open', gear:[], selectedGear:1, location:{name:'DEMO LOCATION'} };
  const player = playerForEpisode();
  return { player, xp: Math.round(trackValue(episode.tracks.xp,playhead,player?.defaultXp ?? 0)),
    stamina: Math.round(trackValue(episode.tracks.stamina,playhead,100)), rail: trackValue(episode.tracks.leftRail,playhead,'Open'),
    gear: episode.bindings.gear, selectedGear: trackValue(episode.tracks.gearSelection,playhead,1),
    location: trackValue(episode.tracks.location,playhead,episode.bindings.location) };
}
function moduleMarkup(name, mode, state) {
  const label = escapeHtml(components[name].label);
  return componentRenderers[name]?.(state,label) ?? label;
}
function safeModuleMarkup(name, mode, state) {
  try { return moduleMarkup(name, mode, state); }
  catch (error) { console.error('HUD component failed: ' + name, error); return `${escapeHtml(components[name]?.label || name)} · unavailable`; }
}
function hudCanvas(mode) {
  const hud = mode === 'template' ? working : episode.hud, data = sampleData(mode);
  const rail = mode === 'template' ? templatePreviewState : data.rail;
  const railChanged = mode === 'episode' && lastEpisodeRail !== null && lastEpisodeRail !== rail;
  if (mode === 'episode') lastEpisodeRail = rail;
  const railAnimation = railChanged && hud.zoneMotion?.['LEFT RAIL'] === 'Smooth Reveal' ? (rail === 'Folded' ? ' rail-collapse' : ' rail-expand') : '';
  const zoneActive = zone => hud.zoneEnabled[zone] && (mode !== 'template' || !previewHidden.has(zone));
  const renderZone = zone => {
    if (!zoneActive(zone)) return '';
    if (zone === 'LEFT RAIL' && rail === 'Folded') return `<button class="hud-item" data-rail-open="true">▶</button>`;
    return hud.order[zone].filter(name => hud.modules[name].enabled && (mode !== 'template' || !previewHidden.has(name))).map(name => {
      const cfg = hud.modules[name], selected = selectedModule === name && !selectedOverlayId;
      const previewState = mode === 'template' && selected && components[name].states.includes(componentPreviewState) ? componentPreviewState.toLowerCase() : '';
      return `<button class="hud-item ${selected ? 'highlight' : ''} ${cfg.motion === 'Pulse' ? 'pulse' : ''} ${previewState}" data-select-module="${escapeHtml(name)}">${safeModuleMarkup(name,mode,data)}</button>`;
    }).join('');
  };
  const overlays = mode === 'episode' ? episode.overlays.filter(item => playhead >= item.start && playhead <= item.end).map(item => {
    const position = overlayPosition(item,playhead);
    return `<button class="pov-item ${selectedOverlayId === item.id ? 'highlight' : ''}" style="left:${position.x}%;top:${position.y}%;bottom:auto" data-overlay-id="${escapeHtml(item.id)}" draggable="true">⌖ ${escapeHtml(item.text)}</button>`;
  }).join('') : '';
  const top = renderZone('TOP BAR');
  return `<div class="hud-demo" id="hud-canvas" data-hud-drop="true"><div class="hud-core"></div>${zoneActive('TOP BAR') ? `<div class="hud-bar">${top || 'THE SYSTEM'}</div>` : ''}${zoneActive('LEFT RAIL') ? `<div class="hud-left ${rail === 'Folded' ? 'folded' : ''}${railAnimation} ${rail === 'Pinned' ? 'pinned' : ''}">${renderZone('LEFT RAIL')}</div>` : ''}${zoneActive('RIGHT RAIL') ? `<div class="hud-right">${renderZone('RIGHT RAIL')}</div>` : ''}${overlays}</div>`;
}
function safeHudCanvas(mode) {
  try { return hudCanvas(mode); }
  catch (error) { console.error('HUD preview failed', error); return '<div class="hud-demo component-failure">HUD preview unavailable · episode data remains editable</div>'; }
}
function templateInspector() {
  const name = selectedModule, def = components[name], cfg = working.modules[name];
  const state = componentPreviewState && def.states.includes(componentPreviewState) ? componentPreviewState : def.states[0];
  return `<h2>COMPONENT · ${escapeHtml(def.label)}</h2><p>${escapeHtml(def.zone)} · reusable visual settings</p>
    <label>INCLUDED <input type="checkbox" data-toggle-module="${escapeHtml(name)}" ${cfg.enabled ? 'checked' : ''}></label>
    <label>VISUAL VARIANT<select data-template-setting="variant">${def.variants.map(value => `<option ${cfg.variant === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
    <label>MOTION PRESET<select data-template-setting="motion">${def.motions.map(value => `<option ${cfg.motion === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
    <label>PREVIEW STATE</label><div>${def.states.map(value => `<button class="state-btn ${state === value ? 'active' : ''}" data-component-state="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join('')}</div>
    <button class="ui-btn" data-preview-hide="${escapeHtml(name)}">${previewHidden.has(name) ? 'SHOW IN PREVIEW' : 'HIDE IN PREVIEW'}</button>
    <p>Children: ${def.children.map(escapeHtml).join(' · ')}</p><button class="ui-btn" data-open-component="${escapeHtml(name)}">VIEW IN UI CATALOG →</button>
    <p>Episode player, gear and numeric values are assigned in the Episode Editor.</p>`;
}
function overlayInspector() {
  const item = episode.overlays.find(entry => entry.id === selectedOverlayId);
  if (!item) return '';
  const position = overlayPosition(item,playhead);
  return `<h2>POV OVERLAY</h2><p>${escapeHtml(components[item.component].label)} · manual placement</p>
    <label>TEXT<input id="overlay-text" value="${escapeHtml(item.text)}"></label>
    <label>START (SECONDS)<input id="overlay-start" type="number" min="0" max="${episode.duration}" value="${item.start}"></label>
    <label>END (SECONDS)<input id="overlay-end" type="number" min="0" max="${episode.duration}" value="${item.end}"></label>
    <label>X AT ${timeLabel(playhead)} (%)<input id="overlay-x" type="number" min="0" max="100" value="${Math.round(position.x)}"></label>
    <label>Y AT ${timeLabel(playhead)} (%)<input id="overlay-y" type="number" min="0" max="100" value="${Math.round(position.y)}"></label>
    <p>Drag the overlay at different playhead times to create manual position points. ${item.positions.length} point(s). No AI detection.</p>
    <button class="ui-btn" data-remove-overlay="${escapeHtml(item.id)}">REMOVE INSTANCE</button>`;
}
function episodeInspector() {
  if (selectedOverlayId) return overlayInspector();
  const name = selectedModule, def = components[name], cfg = episode.hud.modules[name];
  let data = '<p>This component has no episode data in the first vertical slice.</p>';
  let time = '<p>No animated property for this component yet.</p>';
  if (name === 'Player Profile') {
    const player = playerForEpisode(), xp = Math.round(trackValue(episode.tracks.xp,playhead,0));
    data = `<label>PLAYER<select id="episode-player">${recordOptions('Player',player?.id)}</select></label><p>Portrait and name come from one reusable player record. This episode keeps its own snapshot.</p>`;
    time = `<label>XP AT ${timeLabel(playhead)}<input id="episode-xp" type="number" min="0" value="${xp}"></label><p>One XP track drives the number and progress bar. Level defaults to the selected player.</p>`;
  } else if (name === 'Stamina') {
    const value = Math.round(trackValue(episode.tracks.stamina,playhead,100));
    data = '<p>No Data Library record: stamina is an episode value.</p>';
    time = `<label>STAMINA AT ${timeLabel(playhead)}<input id="episode-stamina" type="number" min="0" max="100" value="${value}"></label><p>The number and bar read the same track.</p>`;
  } else if (name === 'Gear Radial') {
    data = `<p>Choose five equipment records for this episode.</p>${Array.from({length:5},(_,i) => `<label>SECTOR ${i+1}<select data-gear-slot="${i}">${recordOptions('Gear',gearForEpisode(i)?.id)}</select></label>`).join('')}`;
    time = `<label>SELECTED SECTOR AT ${timeLabel(playhead)}<select id="gear-selection">${[1,2,3,4,5].map(value => `<option value="${value}" ${trackValue(episode.tracks.gearSelection,playhead,1) === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>`;
  } else if (name === 'Location Header' || name === 'Location / Mini Map') {
    const location = trackValue(episode.tracks.location,playhead,episode.bindings.location);
    data = `<label>LOCATION AT ${timeLabel(playhead)}<select id="episode-location">${recordOptions('Location',location?.id)}</select></label>`;
    time = `<p>Changing this selection creates a discrete location point at the playhead. Current: ${escapeHtml(location?.name || 'none')}.</p>`;
  }
  return `<h2>${escapeHtml(def.label)}</h2><p>${escapeHtml(def.zone)} · episode instance</p>
    <div class="inspector-section"><h3>DATA</h3>${data}</div>
    <div class="inspector-section"><h3>TIME</h3>${time}</div>
    <details><summary>LOOK · LOCAL OVERRIDE</summary><p>The episode has a visual snapshot of ${escapeHtml(episode.sourceTemplate)}. Change only this episode.</p>
    <label>INCLUDED IN THIS EPISODE <input id="episode-module-enabled" type="checkbox" ${cfg.enabled ? 'checked' : ''}></label>
    <label>VARIANT<select data-episode-setting="variant">${def.variants.map(value => `<option ${cfg.variant === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
    <label>MOTION<select data-episode-setting="motion">${def.motions.map(value => `<option ${cfg.motion === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
    <button class="ui-btn" data-save-look="true">SAVE EPISODE LOOK AS TEMPLATE</button></details>`;
}
function workspaceInspector(mode) {
  try { return `<div class="work-panel inspector">${mode === 'template' ? templateInspector() : episodeInspector()}</div>`; }
  catch (error) { console.error('Inspector failed', error); return '<div class="work-panel inspector component-failure">Inspector unavailable · timeline and saved data remain available</div>'; }
}
function configScreen() {
  return `<div class="config-screen"><div class="work-head"><h1>HUD TEMPLATES</h1><span class="mini-note">VISUAL ONLY</span>
    <select id="preset-select">${[...templates.map(item => item.id === working.id ? working : item),...(templates.some(item => item.id === working.id) ? [] : [working])].map(item => `<option value="${escapeHtml(item.id)}" ${item.id === templateId ? 'selected' : ''}>${escapeHtml(item.name)}${item.id === working.id && dirty ? ' · UNSAVED' : ''}</option>`).join('')}</select>
    <button class="ui-btn" data-control="new_preset">NEW FROM BASE</button><button class="ui-btn" data-control="duplicate">DUPLICATE</button><button class="ui-btn primary" data-control="save">SAVE TEMPLATE</button></div>
    <div class="work-grid"><div class="work-panel"><h2>FIXED HUD ZONES</h2><small>Include zones and modules. Reorder modules within their zone.</small><label class="mini-note">TEMPLATE NAME<input id="template-name" value="${escapeHtml(working.name)}"></label><div class="module-list">${zoneTree('template')}</div></div>
    <div class="work-panel demo-wrap"><h2>SHARED HUD PREVIEW · DEMO DATA</h2>${safeHudCanvas('template')}
      <div><span class="mini-note">LEFT RAIL STATE </span>${['Folded','Open','Pinned'].map(value => `<button class="state-btn ${templatePreviewState === value ? 'active' : ''}" data-preview-rail="${value}">${value}</button>`).join('')}</div>
      <label class="mini-note">LEFT RAIL TRANSITION <select id="rail-motion"><option ${working.zoneMotion?.['LEFT RAIL'] === 'Smooth Reveal' ? 'selected' : ''}>Smooth Reveal</option><option ${working.zoneMotion?.['LEFT RAIL'] === 'Snap' ? 'selected' : ''}>Snap</option></select></label>
      <p>${dirty ? 'Unsaved visual changes' : 'Template ready'}. Save Template stores it locally when browser storage is available. Demo values never enter an episode.</p></div>
    ${workspaceInspector('template')}</div><button class="ui-btn" style="align-self:flex-start" data-control="back">← MAIN MENU</button></div>`;
}
