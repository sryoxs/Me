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
    if (!['/sync', '/engine/pending', '/engine/vault', '/ai/chat', '/ai/stt', '/ai/tts', '/ai/debug', '/tools/youtube', '/tools/search', '/tools/wiki', '/ai/gateway'].includes(url.pathname)) return json({ error: 'No encontrado' }, 404);
    if (!(await authorized(request, env))) return json({ error: 'Frase secreta incorrecta' }, 401);

    const now = Date.now();
    // --- Sentidos hacia fuera: videos, fuentes y Wikipedia (sin claves) ---
    if (url.pathname.startsWith('/tools/')) {
      const q = (url.searchParams.get('q') || '').trim().slice(0, 200);
      if (!q) return json({ error: 'Falta q' }, 400);
      try {
        if (url.pathname === '/tools/youtube') return json({ q, videos: await youtubeSearch(q) });
        if (url.pathname === '/tools/search') return json({ q, results: await webSearch(q) });
        if (url.pathname === '/tools/wiki') return json({ q, ...(await wikiSummary(q)) });
      } catch (err) { return json({ error: 'Herramienta no disponible: ' + (err && err.message ? err.message : String(err)) }, 502); }
    }
    // --- IA en tu Cloudflare (Workers AI) ---
    if (url.pathname.startsWith('/ai/')) {
      if (!env.AI) return json({ error: 'Workers AI no está activado en este Worker' }, 503);
      try {
        if (url.pathname === '/ai/chat') return await aiChat(request, env);
        if (url.pathname === '/ai/gateway') return json({ connected: !!env.LLM_BASE_URL, model: env.LLM_MODEL || 'auto', codeModel: env.LLM_CODE_MODEL || env.LLM_MODEL || 'auto' });
        if (url.pathname === '/ai/stt') return await aiStt(request, env);
        if (url.pathname === '/ai/tts') return await aiTts(request, env);
        if (url.pathname === '/ai/debug') return await aiDebug(env);
      } catch (err) {
        return json({ error: 'IA no disponible: ' + (err && err.message ? err.message : String(err)) }, 502);
      }
    }
    // --- Motor (Claude Code): peticiones pendientes y contenido de la bóveda ---
    if (url.pathname === '/engine/pending') {
      const { results } = await env.DB.prepare("SELECT id, data, updated FROM items WHERE kind = 'request' AND deleted = 0 ORDER BY updated ASC").all();
      const pending = results.map(r => ({ id: r.id, ...safeParse(r.data), updated: r.updated })).filter(r => r.status === 'pendiente');
      return json({ pending, now });
    }
    if (url.pathname === '/engine/vault') {
      const { results } = await env.DB.prepare("SELECT id, kind, data, updated FROM items WHERE kind IN ('note','reminder','card') AND deleted = 0 ORDER BY updated DESC LIMIT 2000").all();
      const items = results.map(r => ({ id: r.id, kind: r.kind, updated: r.updated, ...safeParse(r.data) }));
      const kv = await env.DB.prepare("SELECT id, data FROM items WHERE kind = 'kv' AND deleted = 0").all();
      const meta = Object.fromEntries(kv.results.map(r => [r.id.replace(/^kv:/, ''), safeParse(r.data)]));
      if (meta.settings) delete meta.settings.apiKey;
      return json({ notes: items.filter(i => i.kind === 'note'), reminders: items.filter(i => i.kind === 'reminder'), cards: items.filter(i => i.kind === 'card').length, profile: meta.profile || {}, memory: meta.memory || {}, now });
    }
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
// Los modelos de chat devuelven { response } o formato OpenAI { choices:[{message:{content}}] }.
function extractText(r) {
  if (!r) return '';
  if (typeof r === 'string') return r.trim();
  // Si el modelo respondió JSON, Workers AI ya lo entrega como objeto: lo devolvemos como texto JSON
  const asText = v => typeof v === 'string' ? v.trim() : JSON.stringify(v);
  if (r.response) return asText(r.response);
  const c = r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content;
  if (c) return asText(c);
  if (r.result) return extractText(r.result);
  return '';
}
function safeParse(s) { try { return JSON.parse(s); } catch (_) { return {}; } }


// ---------- Workers AI ----------
const CHAT_MODELS = ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/zai-org/glm-4.7-flash', '@cf/meta/llama-3.1-8b-instruct-fast'];
// Nivel «rápido»: charla corta, primero el modelo pequeño (más barato y veloz).
const FAST_MODELS = ['@cf/meta/llama-3.1-8b-instruct-fast', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'];

const gwModel = (env, purpose) => (purpose === 'code' && env.LLM_CODE_MODEL) || env.LLM_MODEL || 'auto';
// Pasarela opcional compatible con OpenAI (por ejemplo OmniRoute con modelos gratuitos).
// Se activa solo si existen LLM_BASE_URL (y opcionalmente LLM_API_KEY, LLM_MODEL) como secretos del Worker.
async function gatewayChat(env, messages, maxTokens, purpose) {
  if (!env.LLM_BASE_URL) return null;
  const url = env.LLM_BASE_URL.replace(/\/$/, '') + '/chat/completions';
  const headers = { 'content-type': 'application/json' };
  if (env.LLM_API_KEY) headers.authorization = 'Bearer ' + env.LLM_API_KEY;
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(url, { method: 'POST', headers, signal: ctrl.signal, body: JSON.stringify({ model: gwModel(env, purpose), messages, max_tokens: maxTokens, temperature: purpose === 'code' ? 0.2 : 0.6 }) });
    if (!res.ok) return null;
    const text = extractText(await res.json());
    return text ? { text, model: 'omniroute/' + gwModel(env, purpose) } : null;
  } catch (_) { return null; } finally { clearTimeout(t); }
}
const STT_MODEL = '@cf/openai/whisper-large-v3-turbo';
const TTS_MODELS = ['@cf/deepgram/aura-2-es', '@cf/myshell-ai/melotts'];

// Conversación: { system, messages:[{role,content}], max_tokens } → { text }
async function aiChat(request, env) {
  const body = await request.json();
  const messages = [];
  if (body.system) messages.push({ role: 'system', content: String(body.system).slice(0, 12000) });
  for (const m of (body.messages || []).slice(-16)) {
    if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') messages.push({ role: m.role, content: m.content.slice(0, 4000) });
  }
  if (!messages.some(m => m.role === 'user')) return json({ error: 'Falta el mensaje del usuario' }, 400);
  const maxTokens = Math.min(3000, body.max_tokens || 400);
  const fast = body.tier === 'rapido';
  const purpose = body.purpose === 'code' ? 'code' : 'chat';
  if (!fast) { const g = await gatewayChat(env, messages, maxTokens, purpose); if (g) return json(g); }
  if (body.gateway === 'required') return json({ error: env.LLM_BASE_URL ? 'OmniRoute no respondió. ¿Está encendido en tu computadora y el túnel abierto?' : 'OmniRoute aún no está conectado a tu nube.' }, 503);
  let lastErr = null;
  for (const model of fast ? FAST_MODELS : CHAT_MODELS) {
    try {
      const r = await env.AI.run(model, { messages, max_tokens: maxTokens, temperature: 0.6 });
      const text = extractText(r);
      if (text) return json({ text, model });
    } catch (err) { lastErr = err; }
  }
  throw lastErr || new Error('Sin respuesta del modelo');
}

// Oído: cuerpo binario de audio (webm/mp4/wav) → { text }
async function aiStt(request, env) {
  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length) return json({ error: 'Audio vacío' }, 400);
  if (buf.length > 8 * 1024 * 1024) return json({ error: 'Audio demasiado largo' }, 413);
  // Pista de vocabulario (nombres, temas que estudia) para que Whisper entienda mejor a Smith
  const hint = (new URL(request.url).searchParams.get('prompt') || '').slice(0, 400);
  const input = { audio: toBase64(buf), language: 'es', task: 'transcribe', vad_filter: true };
  if (hint) input.initial_prompt = hint;
  let r;
  try { r = await env.AI.run(STT_MODEL, input); } catch (_) { r = await env.AI.run(STT_MODEL, { audio: toBase64(buf), language: 'es', task: 'transcribe' }); }
  return json({ text: String((r && r.text) || '').trim(), model: STT_MODEL });
}

// Voz: { text } → audio/mpeg
async function aiTts(request, env) {
  const body = await request.json();
  const text = String(body.text || '').replace(/[*_#`>\[\]]/g, '').slice(0, 900);
  if (!text) return json({ error: 'Texto vacío' }, 400);
  const url = new URL(request.url);
  const only = url.searchParams.get('model');
  let lastErr = null;
  for (const model of TTS_MODELS) {
    if (only && !model.includes(only)) continue;
    try {
      const input = model.includes('aura') ? { text, speaker: body.speaker || 'carina' } : { prompt: text, lang: 'es' };
      const r = await env.AI.run(model, input);
      // Respuesta: flujo binario, o { audio: base64 }
      if (r && typeof r === 'object' && r.audio) {
        const bin = Uint8Array.from(atob(r.audio), c => c.charCodeAt(0));
        return new Response(bin, { headers: { 'content-type': 'audio/mpeg', 'x-tts-model': model, ...CORS } });
      }
      return new Response(r, { headers: { 'content-type': 'audio/mpeg', 'x-tts-model': model, ...CORS } });
    } catch (err) { lastErr = err; }
  }
  throw lastErr || new Error('Sin voz disponible');
}

function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

// Diagnóstico: prueba cada modelo y devuelve el error exacto.
async function aiDebug(env) {
  const out = {};
  for (const m of CHAT_MODELS) { try { const r = await env.AI.run(m, { messages: [{ role: 'user', content: 'Di hola en español.' }], max_tokens: 20 }); out[m] = { ok: true, sample: JSON.stringify(r).slice(0, 200) }; } catch (e) { out[m] = { ok: false, error: String(e && e.message || e) }; } }
  for (const [m, input] of [['@cf/deepgram/aura-2-es', { text: 'Hola Smith.' }], ['@cf/deepgram/aura-2-es', { text: 'Hola Smith.', speaker: 'celeste' }], ['@cf/myshell-ai/melotts', { prompt: 'Hola Smith.', lang: 'es' }], ['@cf/myshell-ai/melotts', { prompt: 'Hola Smith.' }]]) {
    try { const r = await env.AI.run(m, input); out[m + ' ' + JSON.stringify(input)] = { ok: true, type: r && r.constructor && r.constructor.name, keys: r && typeof r === 'object' && !(r instanceof ReadableStream) ? Object.keys(r) : null }; } catch (e) { out[m + ' ' + JSON.stringify(input)] = { ok: false, error: String(e && e.message || e) }; }
  }
  return json(out);
}


// ---------- Herramientas hacia fuera ----------
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

// Videos de YouTube: leemos la página de resultados y sacamos los videoRenderer del JSON inicial.
async function youtubeSearch(q) {
  const res = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '&hl=es&gl=ES', { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' } });
  const html = await res.text();
  const out = []; const seen = new Set();
  const re = /"videoRenderer":\{"videoId":"([\w-]{11})".*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(html)) && out.length < 8) {
    if (seen.has(m[1])) continue; seen.add(m[1]);
    const seg = html.slice(m.index, m.index + 6000);
    const ch = /"ownerText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/.exec(seg);
    const len = /"lengthText":\{[^}]*"simpleText":"([^"]+)"/.exec(seg);
    const views = /"viewCountText":\{"simpleText":"([^"]+)"/.exec(seg);
    out.push({ id: m[1], title: JSON.parse('"' + m[2] + '"'), channel: ch ? JSON.parse('"' + ch[1] + '"') : '', length: len ? len[1] : '', views: views ? views[1] : '', url: 'https://www.youtube.com/watch?v=' + m[1], thumb: 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg' });
  }
  return out;
}

// Fuentes web sin clave: DuckDuckGo (html y lite), Bing RSS y, si todo falla, Wikipedia.
const strip = t => String(t || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
function unDdg(href) { const u = /uddg=([^&]+)/.exec(href); return u ? decodeURIComponent(u[1]) : href; }
async function searchDdgHtml(q) {
  const res = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q) + '&kl=es-es', { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' } });
  const html = await res.text(); const out = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m; while ((m = re.exec(html)) && out.length < 8) out.push({ title: strip(m[2]), url: unDdg(m[1]), snippet: strip(m[3]) });
  return out;
}
async function searchDdgLite(q) {
  const res = await fetch('https://lite.duckduckgo.com/lite/', { method: 'POST', headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded' }, body: 'q=' + encodeURIComponent(q) + '&kl=es-es' });
  const html = await res.text(); const out = [];
  const re = /<a[^>]+class="result-link"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/g;
  let m; while ((m = re.exec(html)) && out.length < 8) out.push({ title: strip(m[2]), url: unDdg(m[1]), snippet: strip(m[3]) });
  return out;
}
async function searchBingRss(q) {
  const res = await fetch('https://www.bing.com/search?format=rss&setlang=es&q=' + encodeURIComponent(q), { headers: { 'user-agent': UA, 'accept-language': 'es-ES,es;q=0.9' } });
  const xml = await res.text(); const out = [];
  const re = /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>/g;
  let m; while ((m = re.exec(xml)) && out.length < 8) out.push({ title: strip(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')), url: strip(m[2]), snippet: strip(m[3].replace(/<!\[CDATA\[|\]\]>/g, '')) });
  return out;
}
async function searchWikiList(q) {
  const s = await fetch('https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(q) + '&format=json&srlimit=5&utf8=1', { headers: { 'user-agent': 'Brainer/1.0' } }).then(r => r.json());
  return ((s && s.query && s.query.search) || []).map(h => ({ title: h.title, url: 'https://es.wikipedia.org/wiki/' + encodeURIComponent(h.title.replace(/ /g, '_')), snippet: strip(h.snippet) }));
}
// Prueba proveedores en orden y devuelve el primero que traiga algo pertinente (que mencione la consulta).
async function webSearch(q) {
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const relevant = r => !words.length || words.some(w => (r.title + ' ' + r.snippet).toLowerCase().includes(w));
  for (const fn of [searchDdgHtml, searchDdgLite, searchBingRss]) {
    try { const r = (await fn(q)).filter(x => x.url && x.title); if (r.length && r.filter(relevant).length >= Math.min(2, r.length)) return r.map(x => ({ ...x, source: fn.name.replace('search', '').toLowerCase() })); } catch (_) { /* siguiente */ }
  }
  try { return (await searchWikiList(q)).map(x => ({ ...x, source: 'wikipedia' })); } catch (_) { return []; }
}

// Wikipedia en español: resumen y enlace.
async function wikiSummary(q) {
  const s = await fetch('https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(q) + '&format=json&srlimit=1&utf8=1', { headers: { 'user-agent': 'Brainer/1.0' } }).then(r => r.json());
  const hit = s && s.query && s.query.search && s.query.search[0];
  if (!hit) return { found: false };
  const title = hit.title;
  const sum = await fetch('https://es.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title), { headers: { 'user-agent': 'Brainer/1.0' } }).then(r => r.json());
  return { found: true, title, extract: sum.extract || '', url: (sum.content_urls && sum.content_urls.desktop && sum.content_urls.desktop.page) || ('https://es.wikipedia.org/wiki/' + encodeURIComponent(title)), thumb: sum.thumbnail ? sum.thumbnail.source : null };
}
