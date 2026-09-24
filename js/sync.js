// Sincronización entre dispositivos a través de Brainer Sync (Cloudflare Worker + D1).
// Local primero: la app funciona igual sin conexión; cuando hay red, empuja los cambios
// pendientes y trae los de otros dispositivos. Gana el cambio más reciente.
// Los adjuntos (archivos) no se sincronizan en esta versión; el texto de la nota sí.

import { notes, reminders, cards, requests, kv, rawPut, rawDelete } from './store.js';

const SYNC_KINDS = { note: 'notes', reminder: 'reminders', card: 'cards', request: 'requests' };
let syncing = false;
let listeners = [];
export const onSync = fn => listeners.push(fn);
const emit = evt => listeners.forEach(fn => fn(evt));

export async function getSyncConfig() {
  return { url: '', secret: '', enabled: false, ...(await kv.get('sync', {})) };
}
export const saveSyncConfig = c => kv.set('sync', c);

// Cola de cambios pendientes: { id, kind, deleted }
export async function enqueue(kind, id, deleted = false) {
  const q = await kv.get('syncQueue', {});
  q[`${kind}:${id}`] = { kind, id, deleted, at: Date.now() };
  await kv.set('syncQueue', q);
}

async function collectPending() {
  const q = await kv.get('syncQueue', {});
  const items = [];
  for (const p of Object.values(q)) {
    if (p.kind === 'kv') {
      const value = await kv.get(p.id, null);
      const data = p.id === 'settings' ? { ...(value || {}), apiKey: undefined } : value;
      items.push({ id: `kv:${p.id}`, kind: 'kv', data: data ?? {}, updated: p.at, deleted: false });
      continue;
    }
    const store = SYNC_KINDS[p.kind];
    if (!store) continue;
    if (p.deleted) { items.push({ id: p.id, kind: p.kind, data: {}, updated: p.at, deleted: true }); continue; }
    const row = await ({ notes, reminders, cards, requests })[store].get(p.id);
    if (row) items.push({ id: p.id, kind: p.kind, data: stripFiles(row), updated: row.updated || p.at, deleted: false });
  }
  return { items, keys: Object.keys(q) };
}

// Los adjuntos viven solo en el dispositivo donde se importaron.
function stripFiles(row) { const { files, ...rest } = row; return rest; }

async function applyRemote(items) {
  let changed = 0;
  for (const it of items) {
    if (it.kind === 'kv') {
      const key = it.id.replace(/^kv:/, '');
      const local = await kv.get(key, null);
      const localAt = (await kv.get('kvUpdated', {}))[key] || 0;
      if (it.updated > localAt) {
        const merged = key === 'settings' ? { ...(local || {}), ...it.data, apiKey: (local && local.apiKey) || '' } : it.data;
        await rawPut('kv', { key, value: merged });
        const stamps = await kv.get('kvUpdated', {}); stamps[key] = it.updated; await rawPut('kv', { key: 'kvUpdated', value: stamps });
        changed++;
      }
      continue;
    }
    const store = SYNC_KINDS[it.kind]; if (!store) continue;
    const local = await ({ notes, reminders, cards, requests })[store].get(it.id);
    if (it.deleted) { if (local) { await rawDelete(store, it.id); changed++; } continue; }
    if (!local || (it.updated || 0) > (local.updated || 0)) {
      // Conservamos los adjuntos locales si la nota ya existía aquí.
      await rawPut(store, { ...it.data, id: it.id, files: (local && local.files) || it.data.files || [] });
      changed++;
    }
  }
  return changed;
}

export async function syncNow({ silent = false } = {}) {
  const cfg = await getSyncConfig();
  if (!cfg.enabled || !cfg.url || !cfg.secret) return { skipped: true };
  if (syncing) return { busy: true };
  syncing = true;
  emit({ state: 'syncing' });
  try {
    const since = await kv.get('syncSince', 0);
    const { items, keys } = await collectPending();
    const res = await fetch(cfg.url.replace(/\/$/, '') + '/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.secret}` },
      body: JSON.stringify({ items, since }),
    });
    if (res.status === 401) throw new Error('La frase secreta no coincide con la del servidor.');
    if (!res.ok) throw new Error(`Error de sincronización (${res.status})`);
    const data = await res.json();
    // Ignoramos el eco de lo que acabamos de enviar (mismo id y misma marca de tiempo).
    const sent = new Map(items.map(i => [i.id, i.updated]));
    const incoming = (data.items || []).filter(i => sent.get(i.id) !== i.updated);
    const changed = await applyRemote(incoming);
    // Vaciamos de la cola solo lo que enviamos (pueden haber entrado cambios nuevos mientras tanto).
    const q = await kv.get('syncQueue', {});
    for (const k of keys) delete q[k];
    await rawPut('kv', { key: 'syncQueue', value: q });
    await rawPut('kv', { key: 'syncSince', value: data.now || Date.now() });
    await rawPut('kv', { key: 'syncLast', value: { at: Date.now(), pushed: items.length, pulled: changed } });
    emit({ state: 'ok', pushed: items.length, pulled: changed });
    return { pushed: items.length, pulled: changed };
  } catch (err) {
    emit({ state: 'error', message: err.message, silent });
    return { error: err.message };
  } finally { syncing = false; }
}

// Primera conexión desde un dispositivo: sube TODO lo local y baja todo lo remoto.
export async function fullSync() {
  const [n, r, c] = await Promise.all([notes.all(), reminders.all(), cards.all()]);
  for (const x of n) await enqueue('note', x.id);
  for (const x of r) await enqueue('reminder', x.id);
  for (const x of c) await enqueue('card', x.id);
  for (const x of await requests.all()) await enqueue('request', x.id);
  for (const key of ['profile', 'memory', 'settings']) await enqueue('kv', key);
  await rawPut('kv', { key: 'syncSince', value: 0 });
  return syncNow();
}

export async function testConnection(url, secret) {
  const res = await fetch(url.replace(/\/$/, '') + '/sync?since=' + Date.now(), { headers: { authorization: `Bearer ${secret}` } });
  if (res.status === 401) throw new Error('Frase secreta incorrecta.');
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}.`);
  return true;
}

let timer = null;
export function startAutoSync(intervalMs = 60000) {
  clearInterval(timer);
  timer = setInterval(() => syncNow({ silent: true }), intervalMs);
  window.addEventListener('online', () => syncNow({ silent: true }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow({ silent: true }); });
}
