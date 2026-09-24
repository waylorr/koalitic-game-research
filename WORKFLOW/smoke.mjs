import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(root, 'workflow.html'), 'utf8');
const js = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!js) throw Error('Missing viewer script');
new Function(js);

const elements = {};
const element = id => elements[id] ??= {
  innerHTML: '', textContent: '', checked: false, className: '',
  classList: { toggle() {}, add() {}, remove() {} }
};
const listeners = {};
const document = { getElementById: element, querySelectorAll: () => [], addEventListener(type, handler) { listeners[type] = handler; }, querySelector: () => null };
const context = vm.createContext({ document, setTimeout() {}, console: {log:console.log,error(){}}, URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} } });
vm.runInContext(js, context);

const click = dataset => listeners.click({target:{closest(){return {dataset};}}});
const change = (id,value,extra={}) => listeners.change({target:{id,value,dataset:{},...extra}});
for (const [screen, token] of [
  ['main_menu','EPISODES'], ['episodes','episode-cards'], ['new_episode','HUD TEMPLATE'],
  ['configure_hud','FIXED HUD ZONES'], ['episode_editor','TIMELINE'], ['assets','ASSETS']
]) {
  vm.runInContext(`openScreen(${JSON.stringify(screen)})`,context);
  if (!element('stage').innerHTML.includes(token)) throw Error(`${screen} failed to render`);
}
vm.runInContext("openScreen('main_menu'); runControl('episodes'); runControl('new_episode'); runControl('cancel')",context);
if (vm.runInContext('current',context)!=='episodes') throw Error('Episode navigation failed');

vm.runInContext("openScreen('assets'); assetsTab='media'; renderPrototype()",context);
change('asset-files',undefined,{files:[{name:'sample.png',type:'image/png',size:1024}]});
if (!element('stage').innerHTML.includes('sample.png')) throw Error('Media import failed');
vm.runInContext("openScreen('new_episode')",context);
element('episode-name').value='Test Episode';
element('media-input').files=[];
element('existing-media').value=vm.runInContext('media[0].id',context);
element('hud-select').value=vm.runInContext('templates[0].id',context);
vm.runInContext("runControl('create_episode')",context);
if (vm.runInContext('current',context)!=='episode_editor' || vm.runInContext('episode.mediaKind',context)!=='image') throw Error('Episode creation failed');
const episodeId=vm.runInContext('episode.id',context);

vm.runInContext("selectedModule='Player Profile'; renderPrototype()",context);
if (!element('stage').innerHTML.includes('HUD HIERARCHY') || !element('stage').innerHTML.includes('data-timeline-toggle="zone:LEFT RAIL"') || !element('stage').innerHTML.includes('data-timeline-value="leftRail"')) throw Error('Hierarchical timeline did not render');
change(undefined,vm.runInContext("records.find(item=>item.name==='Arnau').id",context),{dataset:{timelineBinding:'player'}});
if (vm.runInContext('episode.bindings.player.name',context)!=='Arnau') throw Error('Timeline player binding failed');
change('episode-player',vm.runInContext("records.find(item=>item.name==='Arnau').id",context));
if (!element('stage').innerHTML.includes('Arnau')) throw Error('Player binding did not reach HUD');
vm.runInContext('playhead=30',context);
change('episode-xp','2200');
vm.runInContext("selectedModule='Stamina'; renderPrototype()",context);
change('episode-stamina','70');
click({setRail:'Folded'});
vm.runInContext('playhead=40',context);
change(undefined,'Pinned',{dataset:{timelineValue:'leftRail'}});
if (vm.runInContext("trackValue(episode.tracks.leftRail,39,'Open')",context)!=='Folded' || vm.runInContext("trackValue(episode.tracks.leftRail,41,'Open')",context)!=='Pinned') throw Error('Discrete rail keyframes failed');
click({gotoKeyframe:'30'});
if (vm.runInContext('playhead',context)!==30) throw Error('Keyframe navigation failed');
if (vm.runInContext("trackValue(episode.tracks.stamina,30,100)",context)!==70) throw Error('Hidden Stamina stopped evaluating');
vm.runInContext("selectedModule='Location Header'; playhead=0; renderPrototype()",context);
change('episode-location',vm.runInContext("records.find(item=>item.name==='Barcelona').id",context));
vm.runInContext('playhead=60; renderPrototype()',context);
change('episode-location',vm.runInContext("records.find(item=>item.name==='Girona').id",context));
vm.runInContext("selectedModule='Stamina'; renderPrototype()",context);
change(undefined,'80',{dataset:{timelineValue:'stamina'}});
click({deleteKeyframe:'stamina'});
if (vm.runInContext('episode.tracks.stamina.some(point=>point.t===60)',context)) throw Error('Timeline keyframe deletion failed');
change(undefined,'80',{dataset:{timelineValue:'stamina'}});
if (vm.runInContext("trackValue(episode.tracks.location,30,null).name",context)!=='Barcelona' || vm.runInContext("trackValue(episode.tracks.location,75,null).name",context)!=='Girona') throw Error('Location binding track failed');
vm.runInContext("playhead=45; renderPrototype()",context);
if (vm.runInContext("trackValue(episode.tracks.leftRail,45,'Open')",context)!=='Pinned' || vm.runInContext("trackValue(episode.tracks.stamina,45,100)",context)!==75) throw Error('Parent state and child value diverged');
click({overlayPalette:'Weather / Location'});
if (vm.runInContext('episode.overlays.length',context)!==1) throw Error('Overlay was not added');
if (!element('stage').innerHTML.includes('PERSON IDENTIFICATION')) throw Error('New code-authored overlay did not populate palette');
click({timelineToggle:'zone:POV OVERLAYS'});
click({timelineToggle:'overlay:'+vm.runInContext('episode.overlays[0].id',context)});
if (!element('stage').innerHTML.includes('Position X (%)')) throw Error('Overlay timeline properties did not expand');
vm.runInContext("playhead=48; setOverlayPosition(episode.overlays[0],80,20)",context);
if (vm.runInContext('episode.overlays[0].positions.length',context)!==2 || vm.runInContext('overlayPosition(episode.overlays[0],46.5).x',context)!==65) throw Error('Manual overlay position track failed');
vm.runInContext("saveEpisode(); openEpisode("+JSON.stringify(episodeId)+")",context);
if (vm.runInContext('episode.bindings.player.name',context)!=='Arnau' || vm.runInContext('episode.overlays.length',context)!==1) throw Error('Episode did not reopen with its data');

vm.runInContext("var hudV2 = baseTemplate('HUD V2'); hudV2.id='hud_v2_test'; hudV2.modules.Stamina.enabled=false; templates.push(hudV2); applyHudTemplate(hudV2)",context);
if (vm.runInContext("episode.sourceTemplateId==='hud_v2_test' && !episode.hud.modules.Stamina.enabled && episode.bindings.player.name==='Arnau' && episode.tracks.stamina.some(point=>point.t===60)",context)!==true) throw Error('Applying a HUD discarded episode content or tracks');
vm.runInContext('restorePreviousHud()',context);
if (vm.runInContext('episode.hud.modules.Stamina.enabled',context)!==true) throw Error('HUD change undo failed');
vm.runInContext('applyHudTemplate(hudV2); saveEpisode(); openEpisode('+JSON.stringify(episodeId)+')',context);
if (vm.runInContext("episode.sourceTemplateId==='hud_v2_test' && !episode.hud.modules.Stamina.enabled",context)!==true) throw Error('Applied HUD did not save with the episode');

vm.runInContext("openScreen('configure_hud'); working.modules.Stamina.enabled=false; saveTemplate(); working.modules.Stamina.enabled=true",context);
if (vm.runInContext('episode.hud.modules.Stamina.enabled',context)!==false) throw Error('Template changes modified an existing episode');
vm.runInContext('duplicateTemplate()',context);
const draftHudId = vm.runInContext('working.id',context);
if (vm.runInContext('templates.some(item=>item.id==='+JSON.stringify(draftHudId)+')',context)) throw Error('Unsaved HUD draft entered the template library');
vm.runInContext('saveTemplate()',context);
if (!vm.runInContext('templates.some(item=>item.id==='+JSON.stringify(draftHudId)+')',context)) throw Error('Saved HUD draft missing from template library');
vm.runInContext("openScreen('assets'); assetsTab='data'; renderPrototype()",context);
click({addRecord:'true'});
const recordId=vm.runInContext('selectedRecordId',context);
click({recordAction:'delete'});
if (vm.runInContext('records.some(item=>item.id==='+JSON.stringify(recordId)+')',context)) throw Error('Unused data record could not be deleted');
vm.runInContext("assetsTab='components'; selectedComponent='Player Profile'; renderPrototype()",context);
if (!element('stage').innerHTML.includes('XP Bar') || element('stage').innerHTML.includes('component-label')) throw Error('Component catalog is not read-only');
vm.runInContext("openEpisode("+JSON.stringify(episodeId)+"); var oldMarkup=moduleMarkup; moduleMarkup=(name,mode,state)=>{if(name==='Player Profile')throw Error('isolated test failure');return oldMarkup(name,mode,state)};renderPrototype()",context);
if (!element('stage').innerHTML.includes('PLAYER PROFILE · unavailable') || !element('stage').innerHTML.includes('TIMELINE · HUD HIERARCHY')) throw Error('HUD component failure affected the episode editor');
vm.runInContext('moduleMarkup=oldMarkup',context);
vm.runInContext("var oldConfig=configScreen; configScreen=()=>{throw Error('isolated screen failure')}; openScreen('configure_hud')",context);
if (!element('stage').innerHTML.includes('CONFIGURE HUD UNAVAILABLE')) throw Error('Screen failure was not contained');
vm.runInContext("configScreen=oldConfig; openScreen('episode_editor')",context);
if (!element('stage').innerHTML.includes('TIMELINE · HUD HIERARCHY')) throw Error('Episode editor failed after HUD template screen failure');
console.log('Six screens, HUD switching and undo, media, tracks, overlays, save/reopen, template isolation, component/screen fault boundaries and record deletion OK');
