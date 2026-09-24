const DATA = __WORKFLOW_JSON__;
const screens = DATA.screens;
const components = DATA.ui_components;
const componentNames = Object.keys(components);
const zones = {};
for (const name of componentNames) (zones[components[name].zone] ??= []).push(name);
const shellZones = ['LEFT RAIL', 'TOP BAR', 'RIGHT RAIL'];
const overlayNames = zones['POV OVERLAYS'] || [];
const clone = value => JSON.parse(JSON.stringify(value));
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const get = id => document.getElementById(id);
const initialModules = Object.fromEntries(componentNames.filter(name => components[name].zone !== 'POV OVERLAYS').map(name => [
  name, { enabled: !['Time Left', 'Codex Compact'].includes(name), variant: components[name].variants[0], motion: components[name].motions[0] }
]));
function baseTemplate(name = 'HUD V1') {
  return { id: 'hud_' + Date.now(), name, modules: clone(initialModules), order: clone(Object.fromEntries(shellZones.map(zone => [zone, zones[zone]]))), zoneEnabled: Object.fromEntries(shellZones.map(zone => [zone, true])), zoneMotion: {'LEFT RAIL':'Smooth Reveal'} };
}
const templates = [baseTemplate()];
const records = clone(DATA.content_records).map(record => ({ ...record, archived: false }));
const media = [];
const episodes = [];
let current = 'main_menu', view = 'flow', templateId = templates[0].id, working = clone(templates[0]), dirty = false;
let episode = null, selectedModule = 'Player Profile', selectedOverlayId = null, selectedComponent = 'Player Profile';
let previousEpisodeHud = null;
let pendingEpisodeHudId = null;
let componentPreviewState = null, templatePreviewState = 'Open', previewHidden = new Set();
let assetsTab = 'media', assetSearch = '', selectedRecordId = records[0]?.id, selectedMediaId = null, dataFilter = 'all';
let playhead = 0;
const timelineOpen = new Set(['zone:LEFT RAIL','module:Player Profile','module:Stamina']);
let timelineScrollTop = 0;
let lastEpisodeRail = null;
const positions = { main_menu: [590,45], episodes: [100,330], configure_hud: [1000,330], new_episode: [100,690], assets: [1000,690], episode_editor: [590,850] };
