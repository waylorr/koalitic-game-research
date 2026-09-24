import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('./runtime/project-store.js', import.meta.url), 'utf8');
const stores = {projects:new Map(),media:new Map()};
let mediaWrites = 0;
const indexedDB = {
  open() {
    const request = {};
    queueMicrotask(() => {
      const db = {
        objectStoreNames: {contains(name) { return name in stores; }},
        createObjectStore(name) { stores[name] = new Map(); },
        transaction() {
          const transaction = {
            objectStore(name) {
              return {
                put(value,key) { if (name === 'media') mediaWrites++; stores[name].set(key,value); setTimeout(() => transaction.oncomplete?.(),0); },
                get(key) { const result = {}; queueMicrotask(() => { result.result = stores[name].get(key); result.onsuccess?.(); }); return result; }
              };
            }
          };
          return transaction;
        }
      };
      request.result = db;
      request.onupgradeneeded?.();
      request.onsuccess?.();
    });
    return request;
  }
};
const context = vm.createContext({ indexedDB });
vm.runInContext(source, context);
const store = vm.runInContext('ProjectStore', context);
const first = { templates: [{name:'HUD V1'}], episodes: [{name:'Girona'}], records: [], media: [{id:'video_1',name:'girona.mp4',blob:{bytes:'video'}}] };
const second = { ...first, templates: [{name:'HUD V2'}] };
const results = await Promise.all([store.save(first), store.save(second)]);
if (results.some(result => !result)) throw Error('Project save failed');
const loaded = await store.load();
if (loaded.templates[0].name !== 'HUD V2' || loaded.episodes[0].name !== 'Girona' || loaded.media[0].blob.bytes !== 'video') throw Error('Project save order or reload failed');
if (mediaWrites !== 1) throw Error('Unchanged video blob was rewritten with project metadata');
console.log('Local project store: queued writes, media reuse and reload OK');
