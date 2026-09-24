// Almacenamiento local de Brainer (IndexedDB). Todo vive en tu dispositivo.
// Colecciones: notes, reminders, cards (flashcards), files (adjuntos), kv (ajustes, perfil, uso).

const DB_NAME = 'brainer';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('notes')) {
        const s = db.createObjectStore('notes', { keyPath: 'id' });
        s.createIndex('updated', 'updated');
        s.createIndex('type', 'type');
      }
      if (!db.objectStoreNames.contains('reminders')) db.createObjectStore('reminders', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('cards')) {
        const s = db.createObjectStore('cards', { keyPath: 'id' });
        s.createIndex('due', 'due');
        s.createIndex('noteId', 'noteId');
      }
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const out = fn(s);
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

function getAll(store) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function getOne(store, key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

// Extrae #etiquetas y [[enlaces]] del texto de una nota.
export function parseNote(text) {
  const tags = new Set();
  const links = new Set();
  for (const m of (text || '').matchAll(/(^|\s)#([\p{L}\p{N}_-]+)/gu)) tags.add(m[2].toLowerCase());
  for (const m of (text || '').matchAll(/\[\[([^\]]+)\]\]/g)) links.add(m[1].trim().toLowerCase());
  return { tags: [...tags], links: [...links] };
}

// ---- Notas ----
export const notes = {
  all: () => getAll('notes'),
  get: id => getOne('notes', id),
  async save(note) {
    const now = Date.now();
    const parsed = parseNote(`${note.title || ''} ${note.body || ''} ${(note.tagText || '')}`);
    const n = {
      id: note.id || uid(),
      title: (note.title || '').trim() || 'Sin título',
      body: note.body || '',
      type: note.type || 'nota',
      tags: parsed.tags,
      links: parsed.links,
      files: note.files || [],
      created: note.created || now,
      updated: now,
    };
    await tx('notes', 'readwrite', s => s.put(n));
    return n;
  },
  remove: id => tx('notes', 'readwrite', s => s.delete(id)),
};

// ---- Recordatorios ----
export const reminders = {
  all: () => getAll('reminders'),
  async save(r) {
    const item = { id: r.id || uid(), text: r.text, when: r.when, done: !!r.done, suggested: !!r.suggested, created: r.created || Date.now(), notified: !!r.notified, sourceKey: r.sourceKey || null, noteId: r.noteId || null };
    await tx('reminders', 'readwrite', s => s.put(item));
    return item;
  },
  remove: id => tx('reminders', 'readwrite', s => s.delete(id)),
};

// ---- Flashcards ----
export const cards = {
  all: () => getAll('cards'),
  async save(c) {
    const item = {
      id: c.id || uid(), noteId: c.noteId || null, q: c.q, a: c.a,
      due: c.due || Date.now(), interval: c.interval || 0, ease: c.ease || 2.5, reps: c.reps || 0, created: c.created || Date.now(),
    };
    await tx('cards', 'readwrite', s => s.put(item));
    return item;
  },
  remove: id => tx('cards', 'readwrite', s => s.delete(id)),
};

// ---- Archivos adjuntos ----
export const files = {
  get: id => getOne('files', id),
  async save(file, text) {
    const item = { id: uid(), name: file.name, type: file.type, size: file.size, blob: file, text: text || '', created: Date.now() };
    await tx('files', 'readwrite', s => s.put(item));
    return item;
  },
  remove: id => tx('files', 'readwrite', s => s.delete(id)),
};

// ---- Clave/valor (ajustes, perfil, uso) ----
export const kv = {
  async get(key, fallback = null) {
    const r = await getOne('kv', key);
    return r ? r.value : fallback;
  },
  set: (key, value) => tx('kv', 'readwrite', s => s.put({ key, value })),
};

export const DEFAULT_SETTINGS = {
  apiKey: '',
  modelLight: 'claude-haiku-4-5',
  modelHeavy: 'claude-opus-5',
  askBeforeAI: true,
  proactive: true,
  checkinHour: '19:00',
  voiceReply: true,
};

export async function getSettings() {
  return { ...DEFAULT_SETTINGS, ...(await kv.get('settings', {})) };
}
export const saveSettings = s => kv.set('settings', s);

// ---- Respaldo completo ----
export async function exportAll() {
  const [n, r, c, f, s, p, u, m] = await Promise.all([
    notes.all(), reminders.all(), cards.all(), getAll('files'), kv.get('settings', {}), kv.get('profile', {}), kv.get('usage', {}), kv.get('memory', {}),
  ]);
  // Los adjuntos se exportan como base64 para que viajen en el JSON.
  const filesOut = await Promise.all(f.map(async x => ({ ...x, blob: await blobToBase64(x.blob) })));
  const settings = { ...s, apiKey: '' }; // nunca exportamos la clave
  return { app: 'brainer', version: 1, exported: Date.now(), notes: n, reminders: r, cards: c, files: filesOut, settings, profile: p, usage: u, memory: m };
}

export async function importAll(data, { merge = true } = {}) {
  if (!data || data.app !== 'brainer') throw new Error('Este archivo no es un respaldo de Brainer.');
  if (!merge) await wipeAll();
  for (const n of data.notes || []) await tx('notes', 'readwrite', s => s.put(n));
  for (const r of data.reminders || []) await tx('reminders', 'readwrite', s => s.put(r));
  for (const c of data.cards || []) await tx('cards', 'readwrite', s => s.put(c));
  for (const f of data.files || []) await tx('files', 'readwrite', s => s.put({ ...f, blob: base64ToBlob(f.blob, f.type) }));
  if (data.profile) await kv.set('profile', data.profile);
  if (data.memory) await kv.set('memory', data.memory);
  if (data.settings) {
    const current = await getSettings();
    await kv.set('settings', { ...current, ...data.settings, apiKey: current.apiKey });
  }
}

export async function wipeAll() {
  const db = await openDB();
  await Promise.all([...db.objectStoreNames].map(name => tx(name, 'readwrite', s => s.clear())));
}

function blobToBase64(blob) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.readAsDataURL(blob);
  });
}
function base64ToBlob(b64, type) {
  const bin = atob(b64 || '');
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: type || 'application/octet-stream' });
}
