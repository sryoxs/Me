// Conexión con Claude. Solo se usa cuando el usuario lo pide explícitamente.
// Brainer es una página estática sin bundler, por eso llama a la API por HTTP directo
// (con la cabecera de acceso desde navegador) en lugar de usar el SDK.
// La clave vive solo en este dispositivo (IndexedDB) y nunca se exporta.

import { kv, getSettings } from './store.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

// Precio aproximado por millón de tokens (entrada / salida), para mostrar el gasto estimado.
const PRICES = {
  'claude-haiku-4-5': [1, 5],
  'claude-sonnet-5': [2, 10],
  'claude-opus-5': [5, 25],
};

export function systemPrompt(profile, memory) {
  const who = profile && profile.name ? `El usuario se llama ${profile.name}.` : '';
  const what = profile && profile.title ? `Se dedica a: ${profile.title}.` : '';
  const goals = profile && profile.goals && profile.goals.length ? `Sus metas actuales: ${profile.goals.join(', ')}.` : '';
  const mem = memory && Object.keys(memory).length ? `Lo que Brainer ha aprendido del usuario: ${JSON.stringify(memory)}.` : '';
  return [
    'Eres Brainer, el cerebro virtual personal del usuario. Hablas en español, de forma cercana, directa y breve.',
    'Te adaptas a cómo el usuario escribe y a sus hábitos. Ayudas con estudios, tareas del día a día y organización.',
    'Cuando te pasan notas del usuario, respóndete apoyándote en ellas y cita el título de la nota que usaste.',
    'Si generas tarjetas de estudio, responde SOLO con JSON: [{"q":"pregunta","a":"respuesta"}] sin texto adicional.',
    who, what, goals, mem,
  ].filter(Boolean).join(' ');
}

// tier: 'light' | 'heavy'. Devuelve { text, usage, model }.
export async function ask({ tier = 'light', prompt, context = '', system = '', maxTokens = 4000 }) {
  const s = await getSettings();
  if (!s.apiKey) throw new Error('Configura tu clave de Claude en Ajustes para usar tareas con IA.');
  const model = tier === 'heavy' ? s.modelHeavy : s.modelLight;
  const isOpus = /opus/.test(model);

  const body = {
    model,
    max_tokens: maxTokens,
    system: system || systemPrompt(await kv.get('profile', {}), await kv.get('memory', {})),
    messages: [{ role: 'user', content: context ? `${context}\n\n---\n\n${prompt}` : prompt }],
  };
  // Opus 5 razona por defecto; en modo exigente pedimos esfuerzo medio para equilibrar calidad y créditos.
  if (isOpus) body.output_config = { effort: tier === 'heavy' ? 'medium' : 'low' };
  // Haiku 4.5 no acepta output_config.effort; Sonnet 5 sí.
  if (/sonnet-5/.test(model)) body.output_config = { effort: 'low' };

  const headers = {
    'content-type': 'application/json',
    'x-api-key': s.apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  // Con Opus 5, si el clasificador de seguridad rechaza la petición, el servidor la reintenta con otro modelo.
  if (isOpus) { headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; body.fallbacks = 'default'; }

  const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const j = await res.json(); msg = j.error && j.error.message ? j.error.message : msg; } catch (_) { /* sin cuerpo */ }
    if (res.status === 401) msg = 'La clave de Claude no es válida.';
    if (res.status === 429) msg = 'Has llegado al límite de peticiones. Espera un momento.';
    throw new Error(msg);
  }
  const data = await res.json();
  if (data.stop_reason === 'refusal') {
    throw new Error('Claude no pudo responder a esa petición' + (data.stop_details && data.stop_details.explanation ? `: ${data.stop_details.explanation}` : '.'));
  }
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  await recordUsage(data.model || model, data.usage || {});
  return { text, usage: data.usage || {}, model: data.model || model };
}

async function recordUsage(model, usage) {
  const u = await kv.get('usage', {});
  const day = new Date().toISOString().slice(0, 10);
  const inTok = (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0);
  const outTok = usage.output_tokens || 0;
  const [pi, po] = PRICES[model] || PRICES[Object.keys(PRICES).find(k => model.startsWith(k))] || [5, 25];
  const cost = (inTok * pi + outTok * po) / 1e6;
  u[day] = u[day] || { input: 0, output: 0, cost: 0, calls: 0 };
  u[day].input += inTok; u[day].output += outTok; u[day].cost += cost; u[day].calls += 1;
  u.total = u.total || { input: 0, output: 0, cost: 0, calls: 0 };
  u.total.input += inTok; u.total.output += outTok; u.total.cost += cost; u.total.calls += 1;
  await kv.set('usage', u);
}

export async function usageToday() {
  const u = await kv.get('usage', {});
  const day = new Date().toISOString().slice(0, 10);
  return { today: u[day] || { input: 0, output: 0, cost: 0, calls: 0 }, total: u.total || { input: 0, output: 0, cost: 0, calls: 0 } };
}

// Extrae JSON de tarjetas aunque venga rodeado de texto.
export function parseCards(text) {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]);
    return arr.filter(c => c && c.q && c.a).map(c => ({ q: String(c.q), a: String(c.a) }));
  } catch (_) { return []; }
}
