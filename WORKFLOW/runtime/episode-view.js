function episodeMedia() {
  if (!episode.mediaUrl) return '';
  return episode.mediaKind === 'image'
    ? `<img class="episode-media" src="${episode.mediaUrl}" alt="Episode footage">`
    : `<video class="episode-media" src="${episode.mediaUrl}" muted playsinline preload="metadata"></video>`;
}
function timelineRows() {
  const group = (id,label,depth,select) => `<div class="tl-group depth-${depth}"><button data-timeline-toggle="${escapeHtml(id)}" aria-expanded="${timelineOpen.has(id)}">${timelineOpen.has(id) ? '▾' : '▸'} ${escapeHtml(label)}</button>${select ? `<button class="tl-select" data-select-module="${escapeHtml(select)}">◎</button>` : ''}</div>`;
  const propertyRow = property => {
    const value = timelineValue(property), points = episode.tracks[property.key] || [];
    const options = property.kind === 'rail_state' ? property.states.map(state => `<option ${value === state ? 'selected' : ''}>${state}</option>`).join('')
      : property.kind === 'sector' ? [1,2,3,4,5].map(n => `<option value="${n}" ${value === n ? 'selected' : ''}>${n}</option>`).join('')
      : property.kind === 'location' ? recordOptions('Location',value?.id) : '';
    const input = property.kind === 'number' ? `<input data-timeline-value="${property.key}" aria-label="${escapeHtml(property.label)}" type="number" min="${property.min ?? 0}" ${property.max !== undefined ? `max="${property.max}"` : ''} value="${Math.round(value)}">`
      : `<select data-timeline-value="${property.key}" aria-label="${escapeHtml(property.label)}">${options}</select>`;
    const markers = points.map(point => `<button class="tl-keyframe ${point.t === playhead ? 'active' : ''}" style="left:${100*point.t/episode.duration}%" data-goto-keyframe="${point.t}" title="${timeLabel(point.t)} · ${escapeHtml(point.v?.name ?? point.v)}">◆</button>`).join('');
    return `<div class="tl-property"><span class="tl-prop-label">↳ ${escapeHtml(property.label)}</span><span class="tl-edit">${input}<button data-add-keyframe="${property.key}" title="Add keyframe at playhead">◆+</button><button data-delete-keyframe="${property.key}" title="Delete keyframe at playhead" ${points.length <= 1 || !points.some(point => point.t === playhead) ? 'disabled' : ''}>×</button></span><span class="tl-lane">${markers}<i style="left:${100*playhead/episode.duration}%"></i></span></div>`;
  };
  const bindingRow = binding => {
    const selected = binding.key === 'player' ? episode.bindings.player?.id : episode.bindings.gear[Number(binding.key.split(':')[1])]?.id;
    return `<div class="tl-property tl-binding"><span class="tl-prop-label">↳ ${escapeHtml(binding.label)}</span><span class="tl-edit"><select data-timeline-binding="${escapeHtml(binding.key)}" aria-label="${escapeHtml(binding.label)}">${recordOptions(binding.kind,selected)}</select></span><span class="tl-constant">EPISODE CONSTANT · ${escapeHtml(recordById(selected)?.name || 'unassigned')}</span></div>`;
  };
  let html = '';
  for (const zone of shellZones) {
    const zid = 'zone:' + zone;
    html += group(zid,zone,0);
    if (!timelineOpen.has(zid)) continue;
    for (const property of DATA.timeline_zone_properties[zone] || []) html += propertyRow(property);
    if (!episode.hud.zoneEnabled[zone]) continue;
    for (const name of episode.hud.order[zone]) {
      if (!episode.hud.modules[name]?.enabled) continue;
      const mid = 'module:' + name, def = components[name];
      html += group(mid,def.label,1,name);
      if (!timelineOpen.has(mid)) continue;
      for (const child of def.children) {
        const props = (def.timeline_properties || []).filter(property => property.child === child);
        const bindings = (def.episode_bindings || []).filter(binding => binding.child === child);
        html += `<div class="tl-child">${escapeHtml(child)}${props.length || bindings.length ? '' : ' · display only'}</div>`;
        for (const binding of bindings) html += bindingRow(binding);
        for (const property of props) html += propertyRow(property);
      }
    }
  }
  if (episode.overlays.length) {
    html += group('zone:POV OVERLAYS','POV OVERLAYS',0);
    if (timelineOpen.has('zone:POV OVERLAYS')) for (const item of episode.overlays) {
      const oid = 'overlay:' + item.id, position = overlayPosition(item,playhead);
      html += `<div class="tl-group depth-1"><button data-timeline-toggle="${escapeHtml(oid)}" aria-expanded="${timelineOpen.has(oid)}">${timelineOpen.has(oid) ? '▾' : '▸'} ${escapeHtml(item.text)}</button><button class="tl-select" data-overlay-id="${escapeHtml(item.id)}">◎</button></div>`;
      if (!timelineOpen.has(oid)) continue;
      for (const [key,label,value,type] of [['text','Message',item.text,'text'],['start','Start (s)',item.start,'number'],['end','End (s)',item.end,'number'],['x','Position X (%)',Math.round(position.x),'number'],['y','Position Y (%)',Math.round(position.y),'number']]) {
        html += `<div class="tl-property tl-binding"><span class="tl-prop-label">↳ ${label}</span><span class="tl-edit"><input type="${type}" data-timeline-overlay-id="${escapeHtml(item.id)}" data-timeline-overlay-field="${key}" value="${escapeHtml(value)}" ${type === 'number' ? 'min="0"' : ''}></span><span class="tl-constant">${key === 'x' || key === 'y' ? item.positions.length + ' POSITION POINT(S)' : key === 'text' ? 'EPISODE TEXT' : 'VISIBILITY RANGE'}</span></div>`;
      }
    }
  }
  return html;
}
function editorScreen() {
  const rail = trackValue(episode.tracks.leftRail,playhead,'Open');
  return `<div class="editor-screen"><div class="work-head"><h1>${escapeHtml(episode.name)} · EPISODE EDITOR</h1><label class="mini-note">HUD TEMPLATE <select id="episode-hud-select">${templates.map(item => `<option value="${escapeHtml(item.id)}" ${(pendingEpisodeHudId || episode.sourceTemplateId) === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select></label><button class="ui-btn" data-apply-episode-hud="true">APPLY HUD</button>${previousEpisodeHud ? '<button class="ui-btn" data-restore-hud="true">UNDO HUD CHANGE</button>' : ''}<span class="mini-note">${timeLabel(playhead)}</span><button class="ui-btn primary" data-control="save_episode">SAVE EPISODE</button><button class="ui-btn" data-control="exit_editor">EPISODES →</button></div>
    <div class="work-grid"><div class="work-panel"><h2>HUD TREE</h2><small>Episode instance of the selected template.</small><div class="module-list">${zoneTree('episode')}</div>
      <h2>POV OVERLAYS</h2><small>Drag onto the video, or click to add at centre.</small><div class="overlay-palette">${overlayNames.map(name => `<button draggable="true" data-overlay-palette="${escapeHtml(name)}">${escapeHtml(components[name].label)}</button>`).join('')}</div></div>
    <div class="work-panel demo-wrap"><h2>VIDEO + SHARED HUD PREVIEW</h2><div class="preview-stack">${episodeMedia()}${safeHudCanvas('episode')}</div>
      <div><span class="mini-note">LEFT RAIL AT ${timeLabel(playhead)} </span>${['Folded','Open','Pinned'].map(value => `<button class="state-btn ${rail === value ? 'active' : ''}" data-set-rail="${value}">${value}</button>`).join('')}</div>
      <small>Panel state is a parent track. Its children keep evaluating while folded.</small></div>${workspaceInspector('episode')}</div>
    <div class="timeline"><h2>TIMELINE · HUD HIERARCHY</h2><div class="track"><span>PLAYHEAD</span><input id="playhead" type="range" min="0" max="${episode.duration}" value="${playhead}"><strong>${timeLabel(playhead)}</strong></div><div class="timeline-scroll">${timelineRows()}</div>
    <small>Expand zone → component → child. Edit values at the playhead to create keyframes. Panel states and records hold; numbers interpolate. Motion is inherited from the HUD component.</small></div></div>`;
}
