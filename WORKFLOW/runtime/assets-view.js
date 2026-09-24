function mediaThumb(item) { return item.kind === 'image' ? `<img src="${item.url}" alt="">` : '<span>▶</span>'; }
function mediaAssets() {
  const items = media.filter(item => item.name.toLowerCase().includes(assetSearch));
  const selected = mediaById(selectedMediaId);
  return `<div class="asset-grid"><div class="work-panel"><h2>MEDIA LIBRARY</h2><button class="ui-btn" data-control="import">+ IMPORT IMAGES / VIDEOS</button><input id="asset-files" type="file" accept="image/*,video/*" multiple hidden>
    <p class="asset-note">An imported file can be selected in New Episode or linked to a Data Library record.</p><div class="asset-list">${items.length ? items.map(item => `<button class="asset-row ${item.id === selectedMediaId ? 'selected' : ''}" data-media-id="${escapeHtml(item.id)}"><span class="asset-mini">${mediaThumb(item)}</span><span>${escapeHtml(item.name)}<small>${escapeHtml(item.kind.toUpperCase())} · ${(item.size/1048576).toFixed(1)} MB</small></span></button>`).join('') : '<div class="asset-empty">No imported files yet.</div>'}</div></div>
    <div class="work-panel asset-detail"><h2>MEDIA DETAIL</h2>${selected ? `<h3>${escapeHtml(selected.name)}</h3>${selected.kind === 'image' ? `<img class="media-preview" src="${selected.url}" alt="">` : `<video class="media-preview" src="${selected.url}" controls></video>`}<p class="asset-note">Imported media is stored locally with the project when browser storage is available. A browser cannot reveal its full PC path.</p><label>OPTIONAL SOURCE NOTE</label><input id="media-source-note" value="${escapeHtml(selected.sourceNote)}" placeholder="Folder or project reference">` : '<div class="asset-empty">Select a file to inspect it.</div>'}</div></div>`;
}
function recordUsage(id) {
  return episodes.filter(item => Object.values(item.bindings).some(binding =>
    Array.isArray(binding) ? binding.some(record => record?.id === id) : binding?.id === id
  ) || item.tracks.location?.some(point => point.v?.id === id)).map(item => item.name);
}
function dataAssets() {
  const items = records.filter(item => (item.name + ' ' + item.type).toLowerCase().includes(assetSearch))
    .filter(item => dataFilter === 'all' || (dataFilter === 'used' ? recordUsage(item.id).length : !item.archived));
  const selected = recordById(selectedRecordId), usage = selected ? recordUsage(selected.id) : [];
  return `<div class="asset-grid"><div class="work-panel"><h2>DATA LIBRARY</h2><button class="ui-btn" data-add-record="true">+ NEW RECORD</button>
    <div class="asset-filters">${[['all','ALL'],['used','USED IN EPISODES'],['active','ACTIVE']].map(([id,label]) => `<button class="state-btn ${dataFilter === id ? 'active' : ''}" data-data-filter="${id}">${label}</button>`).join('')}</div>
    <p class="asset-note">One reusable record per player, gear item or place. Episode bindings keep their own snapshots.</p>
    <div class="asset-list">${items.map(item => `<button class="asset-row ${item.id === selectedRecordId ? 'selected' : ''}" data-record-id="${escapeHtml(item.id)}"><span class="asset-mini">◇</span><span>${escapeHtml(item.name)}<small>${escapeHtml(item.type)}${item.archived ? ' · ARCHIVED' : ''}</small></span></button>`).join('')}</div></div>
    <div class="work-panel asset-detail"><h2>RECORD DETAIL</h2>${selected ? `<p class="asset-note">Stable ID: ${escapeHtml(selected.id)} · Used in: ${escapeHtml(usage.join(', ') || 'none')}</p>
      <label>TYPE</label><select id="record-type">${['Player','Gear','Location','Mission','Photo','Codex','Person'].map(type => `<option ${selected.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select>
      <label>NAME</label><input id="record-name" value="${escapeHtml(selected.name)}">
      <label>NOTES</label><textarea id="record-note">${escapeHtml(selected.note || '')}</textarea>
      <label>IMAGE / VIDEO</label><select id="record-media"><option value="">None</option>${media.map(item => `<option value="${escapeHtml(item.id)}" ${selected.mediaId === item.id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select>
      ${selected.type === 'Player' ? `<label>DEFAULT LEVEL</label><input id="record-level" type="number" min="1" value="${selected.defaultLevel ?? 1}"><label>DEFAULT XP</label><input id="record-xp" type="number" min="0" value="${selected.defaultXp ?? 0}"><label>XP GOAL</label><input id="record-goal" type="number" min="1" value="${selected.xpGoal ?? 5000}">` : ''}
      <p class="asset-note">Changes here do not rewrite existing episode snapshots.</p>
      <button class="ui-btn" data-record-action="${usage.length ? (selected.archived ? 'restore' : 'archive') : 'delete'}">${usage.length ? (selected.archived ? 'RESTORE' : 'ARCHIVE') : 'DELETE'} RECORD</button>`
      : '<div class="asset-empty">Select or create a record.</div>'}</div></div>`;
}
function componentSpecimen(name) {
  const def = components[name], state = componentPreviewState && def.states.includes(componentPreviewState) ? componentPreviewState : def.states[0];
  const demo = sampleData('template');
  return `<div class="component-sheet ${escapeHtml(state.toLowerCase())}"><div class="specimen-card">${safeModuleMarkup(name,'template',demo)}</div>
    <div>${def.children.map(child => `<span class="child-chip">${escapeHtml(child)}</span>`).join('')}</div></div>`;
}
function componentAssets() {
  const names = componentNames.filter(name => (name + ' ' + components[name].label + ' ' + components[name].zone).toLowerCase().includes(assetSearch));
  const def = components[selectedComponent], state = componentPreviewState && def.states.includes(componentPreviewState) ? componentPreviewState : def.states[0];
  return `<div class="asset-grid"><div class="work-panel"><h2>UI COMPONENT CATALOG</h2><p class="asset-note">Closed components authored in code. Browse their anatomy, variants and states; episode values live in the editor.</p>
    <div class="asset-list">${names.map(name => `<button class="asset-row ${name === selectedComponent ? 'selected' : ''}" data-component-id="${escapeHtml(name)}"><span class="asset-mini">▧</span><span>${escapeHtml(components[name].label)}<small>${escapeHtml(components[name].zone)} · ${components[name].children.length} children</small></span></button>`).join('')}</div></div>
    <div class="work-panel asset-detail"><h2>${escapeHtml(def.label)}</h2><p class="asset-note">${escapeHtml(def.description)} · ${escapeHtml(def.zone)}</p>${componentSpecimen(selectedComponent)}
    <label>PREVIEW STATE</label><div>${def.states.map(value => `<button class="state-btn ${state === value ? 'active' : ''}" data-component-state="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join('')}</div>
    <p class="asset-note">Variants: ${def.variants.map(escapeHtml).join(' · ')}<br>Motion: ${def.motions.map(escapeHtml).join(' · ')}</p>
    ${def.zone !== 'POV OVERLAYS' ? `<button class="ui-btn" data-configure-component="${escapeHtml(selectedComponent)}">OPEN IN HUD TEMPLATES →</button>` : '<p class="asset-note">Add an instance of this overlay directly in an Episode Editor.</p>'}</div></div>`;
}
function assetsScreen() {
  return `<div class="asset-screen"><div class="work-head"><h1>ASSETS</h1><span class="mini-note">ONE LIBRARY · THREE VIEWS</span><button class="ui-btn" data-control="back">← MAIN MENU</button></div>
    <div class="asset-tabs">${[['media','MEDIA'],['data','DATA LIBRARY'],['components','UI COMPONENTS']].map(([id,label]) => `<button class="${assetsTab === id ? 'active' : ''}" data-assets-tab="${id}">${label}</button>`).join('')}</div>
    <input id="asset-search" class="asset-search" value="${escapeHtml(assetSearch)}" placeholder="Search ${escapeHtml(assetsTab)}...">
    <div style="flex:1">${assetsTab === 'media' ? mediaAssets() : assetsTab === 'data' ? dataAssets() : componentAssets()}</div></div>`;
}
