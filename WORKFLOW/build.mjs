import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const data = {
  ...JSON.parse(fs.readFileSync(path.join(root, 'workflow.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'components.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'sample-records.json'), 'utf8'))
};
const screens = data.screens;
for (const [name, component] of Object.entries(data.ui_components)) {
  if (!component.zone || !component.states.length || !component.variants.length || !component.motions.length) {
    throw Error(`Invalid component definition: ${name}`);
  }
  for (const property of component.timeline_properties || []) {
    if (!property.key || !component.children.includes(property.child) || !['number','sector','location'].includes(property.kind)) {
      throw Error(`Invalid timeline property in ${name}`);
    }
  }
  for (const binding of component.episode_bindings || []) {
    if (!binding.key || !component.children.includes(binding.child) || !['Player','Gear'].includes(binding.kind)) throw Error(`Invalid episode binding in ${name}`);
  }
}
for (const properties of Object.values(data.timeline_zone_properties || {})) {
  for (const property of properties) if (!property.key || !property.states?.length || property.interpolation !== 'hold') throw Error('Invalid zone timeline property');
}
const actions = new Set(['navigate', 'command', 'command_then_navigate', 'set_state', 'open_modal', 'close_modal', 'select', 'input']);
for (const [screenId, screen] of Object.entries(screens)) {
  for (const control of screen.controls) {
    if (!actions.has(control.action_type)) throw Error(`${screenId}.${control.id}: invalid action`);
    if (control.target && !screens[control.target]) throw Error(`${screenId}.${control.id}: invalid target`);
  }
}
for (const scenario of data.scenarios) {
  if (!screens[scenario.expected_screen]) throw Error(`${scenario.id}: invalid expected screen`);
  for (const step of scenario.steps) {
    const [screenId, controlId] = step.split('.');
    if (!screens[screenId]?.controls.some(c => c.id === controlId)) throw Error(`${scenario.id}: invalid step ${step}`);
  }
}
const template = fs.readFileSync(path.join(root, 'workflow.template.html'), 'utf8');
const styleFiles = ['shell.css','navigation.css','hud.css','assets.css','spec.css','hud-details.css','timeline.css'];
const styles = styleFiles.map(file => fs.readFileSync(path.join(root, 'styles', file), 'utf8')).join('\n');
const sources = [
  'project-store.js', 'state.js', 'domain.js', 'timeline-model.js', 'navigation-view.js',
  'components/player-profile.js', 'components/stamina.js', 'components/gear-radial.js',
  'components/location.js', 'components/index.js',
  'hud-view.js', 'episode-view.js', 'assets-view.js',
  'events/timeline-click.js', 'events/navigation-click.js', 'events/hud-click.js',
  'events/assets-click.js', 'events/episode-click.js', 'controller.js'
];
const runtime = sources.map(file => fs.readFileSync(path.join(root, 'runtime', file), 'utf8')).join('\n');
if (template.split('__WORKFLOW_RUNTIME__').length !== 2) throw Error('Missing or duplicated runtime placeholder');
if (template.split('__WORKFLOW_STYLES__').length !== 2) throw Error('Missing or duplicated style placeholder');
if (runtime.split('__WORKFLOW_JSON__').length !== 2) throw Error('Missing or duplicated data placeholder');
const payload = JSON.stringify(data).replaceAll('<', '\\u003c');
const compiled = runtime.replace('__WORKFLOW_JSON__', payload);
new Function(compiled);
fs.writeFileSync(path.join(root, 'workflow.html'), template.replace('__WORKFLOW_STYLES__', styles).replace('__WORKFLOW_RUNTIME__', compiled));
console.log(`Built workflow.html: ${Object.keys(screens).length} screens, ${Object.values(screens).reduce((n,s)=>n+s.controls.length,0)} controls`);
