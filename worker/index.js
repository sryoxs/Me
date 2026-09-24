// Brainer Sync: Worker de Cloudflare que guarda tu cerebro en D1 y lo sincroniza entre dispositivos.
// Es personal: solo entra quien conozca la frase secreta (BRAINER_SECRET).
//
// API:
//   GET  /sync?since=<ms>            → { items: [...], now }  cambios desde ese momento
//   POST /sync  { items: [...] }     → aplica cambios (gana el más reciente) y devuelve { items, now }
//   GET  /health                     → { ok: true }
// Cada item: { id, kind, data, updated, deleted }

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-max-age': '86400',
};

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...CORS } });

// Comparación en tiempo constante para no filtrar la frase secreta.
async function authorized(request, env) {
  const auth = request.headers.get('authorization') || '';
  const given = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!given || !env.BRAINER_SECRET) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(given)), crypto.subtle.digest('SHA-256', enc.encode(env.BRAINER_SECRET))]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true });
    if (url.pathname !== '/sync') return json({ error: 'No encontrado' }, 404);
    if (!(await authorized(request, env))) return json({ error: 'Frase secreta incorrecta' }, 401);

    const now = Date.now();
    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (_) { return json({ error: 'JSON inválido' }, 400); }
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length > 2000) return json({ error: 'Demasiados cambios en una sola petición' }, 413);
      const stmts = [];
      for (const it of items) {
        if (!it || typeof it.id !== 'string' || typeof it.kind !== 'string' || typeof it.updated !== 'number') continue;
        // Gana el más reciente: solo se sobrescribe si el cambio entrante es más nuevo.
        stmts.push(env.DB.prepare(
          `INSERT INTO items (id, kind, data, updated, deleted) VALUES (?1, ?2, ?3, ?4, ?5)
           ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, data = excluded.data, updated = excluded.updated, deleted = excluded.deleted
           WHERE excluded.updated > items.updated`,
        ).bind(it.id, it.kind, JSON.stringify(it.data ?? {}), it.updated, it.deleted ? 1 : 0));
      }
      if (stmts.length) await env.DB.batch(stmts);
      const since = Number(body.since || 0);
      return json({ items: await changesSince(env, since), now });
    }
    if (request.method === 'GET') {
      const since = Number(url.searchParams.get('since') || 0);
      return json({ items: await changesSince(env, since), now });
    }
    return json({ error: 'Método no permitido' }, 405);
  },
};

async function changesSince(env, since) {
  const { results } = await env.DB.prepare('SELECT id, kind, data, updated, deleted FROM items WHERE updated > ?1 ORDER BY updated ASC LIMIT 5000').bind(since).all();
  return results.map(r => ({ id: r.id, kind: r.kind, data: safeParse(r.data), updated: r.updated, deleted: !!r.deleted }));
}
function safeParse(s) { try { return JSON.parse(s); } catch (_) { return {}; } }
