/* Local prototype storage. Media blobs are written once, separately from small project snapshots. */
const ProjectStore = (() => {
  const databaseName = 'koalitic-workflow-prototype';
  let connection;
  let writes = Promise.resolve();
  let storedMediaIds = new Set();

  function open() {
    if (connection) return connection;
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    connection = new Promise(resolve => {
      try {
        const request = indexedDB.open(databaseName, 2);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects');
          if (!db.objectStoreNames.contains('media')) db.createObjectStore('media');
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch { resolve(null); }
    });
    return connection;
  }

  function read(db, store, key) {
    return new Promise(resolve => {
      try {
        const request = db.transaction(store, 'readonly').objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  }

  async function load() {
    const db = await open();
    if (!db) return null;
    const snapshot = await read(db, 'projects', 'current');
    if (!snapshot || ![1,2].includes(snapshot.formatVersion) || !Array.isArray(snapshot.media)) return null;
    if (snapshot.formatVersion === 1) return snapshot; // Previous prototype format included blobs inline.
    const blobs = await Promise.all(snapshot.media.map(item => read(db, 'media', item.id)));
    storedMediaIds = new Set(snapshot.media.filter((_,i) => blobs[i]).map(item => item.id));
    return { ...snapshot, media: snapshot.media.map((item,i) => ({...item,blob:blobs[i]})) };
  }

  async function writeSnapshot(snapshot) {
    const db = await open();
    if (!db) return false;
    const newMedia = snapshot.media.filter(item => item.blob && !storedMediaIds.has(item.id));
    const metadata = { ...snapshot, formatVersion: 2, media:snapshot.media.map(({blob,...item}) => item) };
    return new Promise(resolve => {
      try {
        const transaction = db.transaction(['projects','media'], 'readwrite');
        const mediaStore = transaction.objectStore('media');
        for (const item of newMedia) mediaStore.put(item.blob,item.id);
        transaction.objectStore('projects').put(metadata,'current');
        transaction.oncomplete = () => { for (const item of newMedia) storedMediaIds.add(item.id); resolve(true); };
        transaction.onerror = () => resolve(false);
        transaction.onabort = () => resolve(false);
      } catch { resolve(false); }
    });
  }

  function save(snapshot) {
    writes = writes.then(() => writeSnapshot(snapshot), () => writeSnapshot(snapshot));
    return writes;
  }

  return Object.freeze({ load, save });
})();
