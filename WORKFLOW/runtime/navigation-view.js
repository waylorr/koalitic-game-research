function renderFlow() {
  const canvas = get('flow-canvas');
  let svg = '<svg viewBox="0 0 1440 1100"><defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0 0L0 6L9 3Z" fill="#68dcfb"/></marker></defs>';
  for (const [id, screen] of Object.entries(screens)) {
    const a = positions[id];
    for (const item of screen.controls) {
      if (!item.target || item.target === 'main_menu' || item.target === id) continue;
      const b = positions[item.target];
      svg += `<path class="${item.status === 'pending' ? 'pending' : ''}" d="M${a[0]+130} ${a[1]+155} C${a[0]+130} ${a[1]+210},${b[0]+130} ${b[1]-55},${b[0]+130} ${b[1]-6}"/>`;
    }
  }
  canvas.innerHTML = svg + '</svg>' + Object.entries(screens).map(([id, screen]) => {
    const [x,y] = positions[id];
    return `<button class="node" data-open="${id}" style="left:${x}px;top:${y}px"><strong>${escapeHtml(screen.title)}</strong><span class="badge ${screen.status}">${screen.status.toUpperCase()}</span><small>${escapeHtml(screen.visual_note)}</small></button>`;
  }).join('');
}
function renderSpec() {
  get('spec-content').innerHTML = '<h1>WORKFLOW SPEC</h1><p>Generated from workflow.json. The live prototype covers the first vertical slice.</p>' +
    Object.entries(screens).map(([id, screen]) => `<article><h2>${escapeHtml(screen.title)} · ${escapeHtml(screen.status.toUpperCase())}</h2><p>${escapeHtml(screen.visual_note)}</p><table><thead><tr><th>CONTROL</th><th>COMPONENT</th><th>ACTION</th><th>COMMAND / TARGET</th><th>STATUS</th></tr></thead><tbody>${screen.controls.map(item => `<tr><td>${escapeHtml(item.label)}<br><small>${escapeHtml(id+'.'+item.id)}</small></td><td>${escapeHtml(item.component)}</td><td>${escapeHtml(item.action_type)}</td><td>${escapeHtml(item.command || item.target || '')}</td><td>${escapeHtml(item.status)}</td></tr>`).join('')}</tbody></table></article>`).join('') +
    `<article><h2>HUD COMPONENT CONTRACT · ${componentNames.length} TYPES</h2><p>Code-authored registry. Template controls only look and inclusion; episode bindings and tracks own content and time. “Catalog only” means no complete episode control yet.</p><table><thead><tr><th>ZONE / COMPONENT</th><th>CHILDREN</th><th>EPISODE CONSTANTS</th><th>TIME TRACKS</th><th>VARIANTS / MOTION</th></tr></thead><tbody>${componentNames.map(name => { const def = components[name]; return `<tr><td>${escapeHtml(def.zone)}<br><strong>${escapeHtml(def.label)}</strong></td><td>${def.children.map(escapeHtml).join(' · ')}</td><td>${(def.episode_bindings || []).map(item => escapeHtml(item.child + ': ' + item.kind)).join('<br>') || '—'}</td><td>${(def.timeline_properties || []).map(item => escapeHtml(item.child + ': ' + item.label + ' [' + item.interpolation + ']')).join('<br>') || 'Catalog only / overlay instance'}</td><td>${def.variants.map(escapeHtml).join(' / ')}<br>${def.motions.map(escapeHtml).join(' / ')}</td></tr>`; }).join('')}</tbody></table></article>` +
    `<article><h2>ZONE TIMELINE CONTRACT</h2><table><thead><tr><th>ZONE</th><th>PROPERTY</th><th>STATES</th><th>EVALUATION</th></tr></thead><tbody>${Object.entries(DATA.timeline_zone_properties).flatMap(([zone,props]) => props.map(property => `<tr><td>${escapeHtml(zone)}</td><td>${escapeHtml(property.label)}</td><td>${property.states.map(escapeHtml).join(' / ')}</td><td>${escapeHtml(property.interpolation)} · motion belongs to HUD template</td></tr>`)).join('')}</tbody></table><p>Child values continue evaluating while a parent rail is folded.</p></article>`;
}
function menuScreen() {
  return `<div class="menu-scene"><div class="menu-brand"><b>╱╱</b> KOALITIC <span>GAME</span><span class="menu-tag">THE SYSTEM</span></div><div class="menu-buttons">${screens.main_menu.controls.filter(item => item.target).map(item => `<button data-control="${item.id}">${escapeHtml(item.label)} →</button>`).join('')}</div><button class="menu-quit" data-control="quit_game">QUIT GAME</button></div>`;
}
function episodesScreen() {
  return `<div class="episodes-screen"><h1>EPISODES</h1><p>Continue an episode or create a new one.</p><div class="episode-cards">${episodes.map(item => `<button class="episode-card" data-episode-id="${escapeHtml(item.id)}"><span class="thumb">${item.mediaKind === 'image' ? `<img src="${item.mediaUrl}" alt="">` : '▶'}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.sourceTemplate)} · episode-specific data and timeline</small></span><span style="margin-left:auto">→</span></button>`).join('')}<button class="episode-card new" data-control="new_episode"><span class="thumb">＋</span><span><strong>NEW EPISODE</strong><small>Video or image + optional HUD template</small></span></button></div><div class="episode-actions"><button class="ui-btn" data-control="back">← BACK</button></div></div>`;
}
function newEpisodeScreen() {
  return `<div class="form"><h1>NEW EPISODE</h1><p>Choose media and start editing. HUD V1 is selected by default.</p><div class="field"><label>01 · EPISODE NAME</label><input id="episode-name" placeholder="Episode name"></div><div class="field"><label>02 · VIDEO / IMAGE</label><select id="existing-media"><option value="">Choose from Media Library…</option>${media.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select><input id="media-input" type="file" accept="image/*,video/*"><small>A new file is added to Media Library and takes priority.</small></div><div class="field"><label>03 · HUD TEMPLATE (OPTIONAL)</label><select id="hud-select">${templates.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></div><div class="actions"><button class="ui-btn" data-control="cancel">CANCEL</button><button class="ui-btn primary" data-control="create_episode">CREATE EPISODE →</button></div></div>`;
}
