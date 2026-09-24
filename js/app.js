// Brainer: lógica principal de la interfaz.
import { notes, reminders, cards, files, requests, kv, getSettings, saveSettings, exportAll, importAll, wipeAll, uid } from './store.js';
import { route, TIER_LABEL } from './neuro.js';
import { loadDemo, removeDemo } from './demo.js';
const STATE_LABEL = { inactivo: 'Listo', escuchando: 'Escuchando', pensando: 'Procesando', hablando: 'Hablando', error: 'Error' };
import { loadWhisper, recordUntilSilence, transcribe, embed, indexNotes, semanticSearch, extractiveSummary, onProgress, embeddingsReady, whisperReady } from './local-ai.js';
import { search, parseIntent, normalize } from './search.js';
import { Brain3D } from './brain3d.js';
import { listen, voiceSupported } from './voice.js';
import { converse, welcomeLine, idleThought, listVoices, speak as personaSpeak, tone } from './persona.js';
import { chat as cloudChat, transcribe as cloudTranscribe, speakCloud, stopSpeaking, recordClip, cloudReady, inAppBrowser } from './cloud-ai.js';
import { ask, parseCards, usageToday } from './ai.js';
import { cardsFromNote, schedule, dueCards, stats as studyStats } from './study.js';
import { requestNotifPermission, startTicker, suggestFromNotes, dailyBrief } from './reminders.js';
import { getSyncConfig, saveSyncConfig, syncNow, fullSync, testConnection, startAutoSync, onSync } from './sync.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmtDate = ts => new Date(ts).toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
// Texto plano para vistas previas: sin etiquetas, marcas de markdown ni casillas.
const stripTags = s => String(s ?? '').replace(/(^|\s)#[\p{L}\p{N}_-]+/gu, '$1').replace(/^#{1,6}\s+/gm, '').replace(/\*\*|__|`/g, '').replace(/^\s*[-*]\s*\[[ x]\]\s*/gmi, '· ').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\n{2,}/g, ' · ').replace(/\n/g, ' ').trim();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  plan: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  cards: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="13" height="15" rx="2"/><path d="M8 3h12v14"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  news: '<svg viewBox="0 0 24 24"><path d="M4 4h13v16H4zM17 8h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4"/></svg>',
  research: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5M11 8v6M8 11h6"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3M20 16V6"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>',
  check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24"><path d="M3 11v2a2 2 0 0 0 2 2h2l6 4V5L7 9H5a2 2 0 0 0-2 2zM17 9a4 4 0 0 1 0 6"/></svg>',
};
const TYPE_LABEL = { nota: 'nota', captura: 'captura', informe: 'informe', tarea: 'tarea', idea: 'idea', proyecto: 'proyecto', conexion: 'conexión', flashcard: 'tarjeta' };

const state = { view: 'inicio', notes: [], activeTag: null, currentNote: null, graph: null, studyQueue: [], studyCard: null, showAnswer: false, settings: null };

// ---------- Utilidades UI ----------
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}
function setStatus(text, cls = '') { const el = $('#brand-status'); el.textContent = text; el.className = 'brand-status ' + cls; }

function showView(name) {
  state.view = name;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  $$('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.view === name));
  $('#sidenav').classList.remove('open'); $('#scrim').classList.remove('show');
  if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  document.body.classList.toggle('dim', !['inicio', 'grafo'].includes(name));
  if (name === 'grafo') refreshGraph();
  if (name === 'boveda') renderVault();
  if (name === 'estudio') renderStudy();
  if (name === 'recordatorios') renderReminders();
  if (name === 'perfil') renderProfile();
  if (name === 'ajustes') renderSettings();
  if (name === 'inicio') renderHome();
}

// ---------- Chat con Brainer ----------
function addMsg(role, html, { speakText, always } = {}) {
  const el = document.createElement('div');
  el.className = 'msg ' + role;
  el.innerHTML = html;
  $('#chat').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  if (role === 'brainer' && speakText && state.settings.voiceReply && (state.lastInputWasVoice || (always && state.userGestured))) speakHud(speakText);
  return el;
}

function resultCard(note, snippet) {
  return `<span class="result" data-open="${note.id}"><b>${esc(note.title)}</b><span class="cite">${esc(TYPE_LABEL[note.type] || note.type)} · ${fmtDate(note.updated)}</span>${esc(stripTags(snippet || ''))}</span>`;
}

// ---------- HUD ----------
function hud(st, tierText) {
  if (st) { state.brain && state.brain.setState(st); const el = $('#hud-state'); if (el) el.textContent = STATE_LABEL[st] || st; }
  if (tierText !== undefined) { const t = $('#hud-tier'); if (t) t.textContent = tierText; }
}
function showTier(r) {
  const b = $('#tier-badge'); b.hidden = false; b.textContent = r.tier === 0 ? 'CONV' : `N${r.tier}`; b.title = `${TIER_LABEL[r.tier]} — ${r.reason}`;
  hud(undefined, `${TIER_LABEL[r.tier]} · ${r.reason}`);
  setTimeout(() => { b.hidden = true; }, 6000);
}
const tierNote = r => `<span class="tier">Neuro → <b>${TIER_LABEL[r.tier]}</b> · ${esc(r.reason)}</span>`;

// Identidad de Brainer para el modelo de lenguaje: quién es, a quién sirve, qué sabe ahora mismo.
async function brainSystemPrompt(context) {
  const p = await kv.get('profile', {});
  const name = p.name || 'Smith';
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'local';
  const now = new Date().toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const b = $('#daily-brief') ? $('#daily-brief').textContent : '';
  return [
    `Eres Brainer, la inteligencia personal de ${name}: un cerebro virtual al estilo de Jarvis (Iron Man). Sereno, preciso, cercano, con ingenio contenido. Le hablas de tú y lo llamas ${name} de vez en cuando, no en cada frase.`,
    `Hablas SIEMPRE en español. Respuestas cortas: 1 a 3 frases salvo que te pidan detalle. Sin emojis, sin listas con asteriscos, sin hashtags. Nunca llames "cerebro" a la app ni a la bóveda: di "Brainer" o "tu bóveda".`,
    `Hora local de ${name}: ${now} (zona ${tz}). Úsala si preguntan la hora o el día.`,
    p.title ? `${name} se dedica a: ${p.title}.` : '', p.bio ? `Sobre ${name}: ${p.bio}` : '',
    p.goals && p.goals.length ? `Metas actuales: ${p.goals.join('; ')}.` : '',
    p.voice ? `Cómo le gusta que suenes: ${p.voice}` : '', p.rules ? `Límites que nunca se tocan: ${p.rules}` : '',
    b ? `Estado de hoy: ${b}` : '',
    `Brainer también ayuda con proyectos, código, ideas de negocio y trabajo diario, no solo estudio. Tiene un equipo de agentes (Arquitecto, Programador, Tester, Marketing, Investigador, Archivista, Tejedor, Escriba) que trabajan con Claude Code cuando la tarea es grande.`,
    `Si ${name} pide algo que requiere trabajo real (investigar a fondo, construir una app, escribir un informe largo), dile que se lo pasas a Claude Code y que el resultado llegará a su bóveda; no lo hagas tú.`,
    context ? `Notas de la bóveda de ${name} relevantes ahora (cítalas por título si las usas; no inventes notas):\n${context}` : `No hay notas relevantes para esto en la bóveda.`,
  ].filter(Boolean).join('\n');
}

// Conversación con la IA de tu nube, con las notas relevantes como contexto.
async function cloudConverse(text, r) {
  const kw = search(state.notes, text, { limit: 4 });
  let ids = kw.map(x => x.note.id);
  try { if (await embeddingsReady()) for (const x of await semanticSearch(text, { limit: 4 })) if (!ids.includes(x.id)) ids.push(x.id); } catch (_) { /* sin semántica */ }
  const used = ids.map(id => state.notes.find(n => n.id === id)).filter(Boolean).slice(0, 4);
  const context = used.map(n => `— «${n.title}» (${TYPE_LABEL[n.type] || n.type}): ${stripTags(n.body).slice(0, 700)}`).join('\n');
  if (used.length) state.brain.activate(used.map((n, i) => ({ id: n.id, score: 1 - i * 0.2 })));
  state.history = (state.history || []).slice(-10);
  const system = await brainSystemPrompt(context);
  const res = await cloudChat({ system, messages: [...state.history, { role: 'user', content: text }] });
  state.history.push({ role: 'user', content: text }, { role: 'assistant', content: res.text });
  const cited = used.filter(n => res.text.toLowerCase().includes(n.title.toLowerCase().slice(0, 12)));
  let html = esc(res.text);
  for (const n of cited.slice(0, 2)) html += resultCard(n, '');
  html += `<span class="tier">Neuro → <b>${r ? TIER_LABEL[r.tier] : 'Conversación'}</b> · IA en tu nube · ${esc(res.model.split('/').pop())}</span>`;
  addMsg('brainer', html, { speakText: res.text, always: true });
}

// Punto de entrada: Neuro decide el nivel y Brainer actúa.
async function handleInput(text, { fromVoice = false } = {}) {
  text = (text || '').trim();
  if (!text) return;
  state.lastInputWasVoice = fromVoice;
  addMsg('user', esc(text));
  await learnFromInput(text);
  hud('pensando');
  try {
    // Respuestas a preguntas abiertas de Brainer (recordatorio sin hora, “¿qué estudiaste hoy?”)
    if (state.pendingReminder || state.pendingCheckin) return await handleTier1(text, parseIntent(text), fromVoice);
    const r = route(text, { hasSemantic: await embeddingsReady() });
    // Acciones concretas siempre locales: recordatorios, crear notas, repaso, red, resumen
    const action = r.tier === 1 && ['reminder', 'create', 'study', 'graph', 'brief'].includes(r.intent.intent);
    if (r.tier === 3) { showTier(r); return await handleTier3(r, text); }
    if (action) { showTier(r); return await handleTier1(text, r.intent, fromVoice); }
    // Conversación y preguntas: la IA de tu nube, con tus notas como contexto
    if (await cloudReady()) {
      const conv = { tier: 0, reason: 'IA en tu nube' }; showTier(conv);
      try { return await cloudConverse(text, r.intent.intent === 'search' && !r.intent.fallbackAI ? r : conv); }
      catch (err) { console.warn('IA en la nube no disponible', err); toast('IA en la nube no disponible: ' + err.message, 4000); }
    }
    // Sin nube: reglas de conversación y búsqueda local
    const profile = await kv.get('profile', {});
    const st = await studyStats();
    const conv = converse(text, { name: profile.name, notes: state.notes.length, due: st.due, brief: /^(hola|buen)/i.test(text) ? ($('#daily-brief').textContent || '') : '' });
    if (conv) { showTier({ tier: 0, reason: 'charla' }); addMsg('brainer', esc(conv.text), { speakText: conv.speak, always: true }); return; }
    showTier(r);
    if (r.tier === 2) return await handleTier2(r, text, fromVoice);
    return await handleTier1(text, r.intent, fromVoice);
  } finally { hud('inactivo'); }
}

// Nivel 3: la petición viaja a la bóveda y Claude Code la recoge.
async function handleTier3(r, text) {
  const req = await requests.save({ skill: r.skill, prompt: r.prompt || text });
  const sync = await syncNow({ silent: true });
  const where = sync && !sync.skipped && !sync.error ? 'Ya está en tu bóveda sincronizada; Claude Code la recoge en su próxima pasada (cada hora) y el informe aparecerá en la Cabina.' : 'Activa la sincronización en Ajustes para que Claude Code pueda recogerla.';
  addMsg('brainer', `Esto es trabajo de verdad, se lo paso a <b>Claude Code</b> con la habilidad <b>${esc(r.skill)}</b>. ${where}${tierNote(r)}`, { speakText: 'Se lo paso a Claude Code. Te avisaré cuando llegue el informe.' });
  renderCockpit();
  return req;
}

// Nivel 2: red neuronal local — búsqueda por significado + resumen extractivo.
async function handleTier2(r, text, fromVoice) {
  const sem = await semanticSearch(text, { limit: 6 });
  const kw = search(state.notes, r.intent.query, { type: r.intent.type, limit: 6 });
  // Fusión: semántico (0..1) pesa más; palabras clave normalizadas
  const maxKw = kw[0] ? kw[0].score : 1;
  const fused = new Map();
  for (const x of sem) fused.set(x.id, { id: x.id, score: x.score });
  for (const x of kw) { const f = fused.get(x.note.id) || { id: x.note.id, score: 0 }; f.score += 0.6 * (x.score / maxKw); fused.set(x.note.id, f); }
  const ranked = [...fused.values()].sort((a, b) => b.score - a.score).slice(0, 5).map(x => ({ ...x, note: state.notes.find(n => n.id === x.id) })).filter(x => x.note);
  state.brain.activate(ranked.map(x => ({ id: x.id, score: Math.min(1, x.score) })));
  if (!ranked.length) return handleTier1(text, r.intent, fromVoice);
  const top = ranked[0];
  let html = r.intent.question
    ? `Según lo que tienes guardado:<br>${esc(extractiveSummary(top.note.body, 3))}${resultCard(top.note, '')}`
    : `Esto es lo más parecido en tu bóveda:${resultCard(top.note, extractiveSummary(top.note.body, 2))}`;
  const others = ranked.slice(1);
  if (others.length) html += `<span class="cite">Relacionado: ${others.map(x => `<a href="#" data-open="${x.id}">${esc(x.note.title)}</a>`).join(' · ')}</span>`;
  html += `<br><button class="btn ghost small" data-req-skill="investigacion" data-req-prompt="${esc(text)}">Pedir a Claude Code un informe a fondo</button>${tierNote(r)}`;
  addMsg('brainer', html, { speakText: r.intent.question ? extractiveSummary(top.note.body, 2) : `Encontré ${top.note.title}` });
  if (fromVoice) openNote(top.note);
}

async function handleTier1(text, intent, fromVoice) {

  if (intent.intent === 'reminder') {
    if (!intent.when) {
      addMsg('brainer', `¿Para cuándo? Dime por ejemplo “mañana a las 8” o “el viernes a las 5 de la tarde”.`, { speakText: '¿Para cuándo?' });
      state.pendingReminder = intent.text;
      return;
    }
    await requestNotifPermission();
    await reminders.save({ text: intent.text, when: intent.when });
    addMsg('brainer', `Listo, te recuerdo <b>${esc(intent.text)}</b> el ${fmtDate(intent.when)}.`, { speakText: `Listo, te recuerdo ${intent.text}` });
    return;
  }
  if (state.pendingReminder) {
    const when = (await import('./search.js')).parseWhen(text);
    if (when) {
      await requestNotifPermission();
      await reminders.save({ text: state.pendingReminder, when });
      addMsg('brainer', `Hecho: <b>${esc(state.pendingReminder)}</b> el ${fmtDate(when)}.`, { speakText: 'Hecho' });
      state.pendingReminder = null; return;
    }
    state.pendingReminder = null;
  }
  if (state.pendingCheckin) {
    // Respuesta a "¿qué estudiaste hoy?"
    const n = await notes.save({ title: `Estudio ${new Date().toLocaleDateString('es')}`, body: text + '\n\n#estudio #diario', type: 'nota' });
    const mem = await kv.get('memory', {}); mem.lastCheckin = Date.now(); mem.studyLog = [...(mem.studyLog || []).slice(-30), { day: Date.now(), text: text.slice(0, 200) }];
    await kv.set('memory', mem);
    state.pendingCheckin = false;
    await loadNotes();
    const made = cardsFromNote(n);
    for (const c of made.slice(0, 4)) await cards.save(c);
    addMsg('brainer', `Guardado en tu bóveda. ${made.length ? `Creé ${Math.min(made.length, 4)} tarjetas para repasarlo después.` : 'Mañana te preguntaré sobre esto.'}`, { speakText: 'Guardado en tu bóveda.' });
    return;
  }
  if (intent.intent === 'create') {
    const body = intent.text || '';
    const title = body.split(/[.:\n]/)[0].slice(0, 60) || `Nueva ${intent.type}`;
    const n = await notes.save({ title, body, type: intent.type });
    await loadNotes();
    const suggested = await suggestFromNotes();
    const art = intent.type === 'informe' ? 'el informe' : `la ${intent.type}`;
    let html = `Creé ${art} <b>${esc(n.title)}</b>. ${intent.type === 'informe' ? 'Tócalo' : 'Tócala'} para editar.${resultCard(n, body)}`;
    if (suggested.length) html += `<span class="cite">Vi una fecha y te propuse un recordatorio: “${esc(suggested[0].text)}”. Acéptalo en Recordatorios.</span>`;
    addMsg('brainer', html, { speakText: `Creé ${art} ${n.title}${suggested.length ? '. Te propuse un recordatorio por la fecha que mencionas.' : ''}` });
    return;
  }
  if (intent.intent === 'study') { showView('estudio'); startStudy(); return; }
  if (intent.intent === 'graph') { showView('grafo'); return; }
  if (intent.intent === 'brief') { await renderBrief(true); return; }

  // Búsqueda en la bóveda
  const results = search(state.notes, intent.query, { type: intent.type, limit: 5 });
  if (results.length) {
    const top = results[0];
    const others = results.slice(1);
    let html = `Encontré esto en tu bóveda:${resultCard(top.note, top.snippet)}`;
    if (others.length) html += `<span class="cite">También: ${others.map(r => `<a href="#" data-open="${r.note.id}">${esc(r.note.title)}</a>`).join(' · ')}</span>`;
    if (state.settings.apiKey) html += `<br><button class="btn ghost small" data-ai-about="${top.note.id}" data-q="${esc(text)}">Pedir a Claude que responda con esta nota</button>`;
    else html += `<br><button class="btn ghost small" data-req-skill="investigacion" data-req-prompt="${esc(text)} (parte de la nota «${esc(top.note.title)}»)">Pedir a Claude Code un informe a fondo</button>`;
    state.brain.activate(results.map(r => ({ id: r.note.id, score: Math.min(1, r.score / (results[0].score || 1)) })));
    addMsg('brainer', html, { speakText: `Encontré ${top.note.title}. ${top.snippet.slice(0, 120)}` });
    if (fromVoice && results.length === 1) openNote(top.note);
    return;
  }
  if (intent.fallbackAI) {
    const btn = state.settings.apiKey
      ? `<button class="btn ghost small" data-ai-free="${esc(text)}">Preguntarle a Claude (gasta créditos)</button>`
      : `<button class="btn ghost small" data-req-skill="investigacion" data-req-prompt="${esc(text)}">Que Claude Code lo investigue</button>`;
    return addMsg('brainer', `No tengo nada guardado sobre eso. ${btn} <button class="btn ghost small" data-create="${esc(text)}">Guardarlo como nota</button>`);
  }
  addMsg('brainer', `No tengo nada guardado sobre “${esc(intent.query)}”. Puedo guardarlo como nota o pedir a Claude Code que lo investigue. <button class="btn ghost small" data-create="${esc(intent.query)}">Guardar como nota</button> <button class="btn ghost small" data-req-skill="investigacion" data-req-prompt="${esc(text)}">Que Claude Code lo investigue</button>`, { speakText: 'No tengo nada guardado sobre eso. ¿Lo guardo o lo investigo?' });
}

// Aprende hábitos simples del usuario: horas activas, temas frecuentes, forma de escribir.
async function learnFromInput(text) {
  const mem = await kv.get('memory', {});
  const h = new Date().getHours();
  mem.activeHours = mem.activeHours || {}; mem.activeHours[h] = (mem.activeHours[h] || 0) + 1;
  mem.inputs = (mem.inputs || 0) + 1;
  mem.avgLen = Math.round(((mem.avgLen || text.length) * 0.9) + text.length * 0.1);
  mem.usesVoice = state.lastInputWasVoice ? (mem.usesVoice || 0) + 1 : (mem.usesVoice || 0);
  await kv.set('memory', mem);
}

// ---------- IA ----------
async function askAI({ tier, prompt, context, title }) {
  setStatus('pensando', 'thinking');
  try {
    const r = await ask({ tier, prompt, context });
    await refreshUsage();
    return r;
  } finally { setStatus('local'); }
}

function aiDialog(title, defaultPrompt = '') {
  return new Promise(resolve => {
    const d = $('#ai-dialog');
    $('#ai-dialog-title').textContent = title;
    $('#ai-prompt').value = defaultPrompt;
    d.returnValue = 'cancel';
    d.onclose = () => {
      if (d.returnValue !== 'ok') return resolve(null);
      resolve({ tier: d.querySelector('input[name=tier]:checked').value, prompt: $('#ai-prompt').value.trim() });
    };
    d.showModal();
  });
}

async function aiAboutNote(noteId, question) {
  const n = await notes.get(noteId); if (!n) return;
  let tier = 'light', prompt = question;
  if (state.settings.askBeforeAI) {
    const r = await aiDialog(`Claude sobre “${n.title}”`, question); if (!r || !r.prompt) return;
    tier = r.tier; prompt = r.prompt;
  }
  const holder = addMsg('brainer', 'Pensando…');
  try {
    const context = `Nota del usuario titulada “${n.title}” (${n.type}):\n\n${n.body}`;
    const r = await askAI({ tier, prompt, context });
    holder.innerHTML = `${esc(r.text)}<span class="cite">Claude · ${esc(r.model)} · ${(r.usage.input_tokens || 0) + (r.usage.output_tokens || 0)} tokens</span>`;
    if (state.settings.voiceReply && state.lastInputWasVoice) speak(r.text);
  } catch (err) { holder.innerHTML = `<span style="color:var(--danger)">${esc(err.message)}</span>`; }
}

async function aiFree(question) {
  let tier = 'light', prompt = question;
  if (state.settings.askBeforeAI) { const r = await aiDialog('Preguntar a Claude', question); if (!r || !r.prompt) return; tier = r.tier; prompt = r.prompt; }
  const holder = addMsg('brainer', 'Pensando…');
  try {
    const r = await askAI({ tier, prompt });
    holder.innerHTML = `${esc(r.text)}<span class="cite">Claude · ${esc(r.model)}</span> <button class="btn ghost small" data-save-answer="1">Guardar en la bóveda</button>`;
    holder.querySelector('[data-save-answer]').onclick = async () => {
      await notes.save({ title: question.slice(0, 60), body: r.text + '\n\n#claude', type: 'nota' }); await loadNotes(); toast('Guardado en la bóveda');
    };
  } catch (err) { holder.innerHTML = `<span style="color:var(--danger)">${esc(err.message)}</span>`; }
}

// ---------- Cabina ----------
async function loadSkills() {
  if (state.skills) return state.skills;
  try { state.skills = (await (await fetch('skills/skills.json')).json()).habilidades; } catch (_) { state.skills = []; }
  return state.skills;
}
async function runSkill(id, { prompt } = {}) {
  const sk = (await loadSkills()).find(s => s.id === id); if (!sk) return;
  if (sk.nivel === 1) {
    if (id === 'planificar-hoy') { showView('inicio'); await renderBrief(true); return; }
    if (id === 'repaso') { showView('estudio'); startStudy(); return; }
  }
  let p = prompt;
  if (!p && id === 'investigacion') { p = window.prompt('¿Qué tema quieres que investigue Claude Code?'); if (!p) return; }
  if (!p && id === 'proyecto') { p = window.prompt('¿Qué quieres construir? Describe la app, web o herramienta en una o dos frases.'); if (!p) return; }
  showView('inicio');
  addMsg('user', `${esc(sk.nombre)}${p ? ': ' + esc(p) : ''}`);
  const r = { tier: 3, skill: id, prompt: p || sk.descripcion, reason: `botón “${sk.nombre}”` };
  showTier(r);
  await handleTier3(r, p || sk.nombre);
}
async function loadTeam() {
  if (state.team) return state.team;
  try { state.team = (await (await fetch('skills/equipo.json')).json()).agentes; } catch (_) { state.team = []; }
  return state.team;
}
async function renderCockpit() {
  const team = await loadTeam();
  const tm = $('#team'); if (tm) tm.innerHTML = team.map(a => `<div class="agent"><span class="ag-head">${ICONS[a.icono] || ICONS.spark}<b>${esc(a.nombre)}</b></span><small>${esc(a.rol)}</small></div>`).join('');
  const skills = await loadSkills();
  const sk = $('#skills'); if (sk) sk.innerHTML = skills.map(s => `
    <button class="skill" data-skill="${s.id}"><span class="sk-head">${ICONS[s.icono] || ICONS.spark}<b>${esc(s.nombre)}</b></span><small>${esc(s.descripcion)}</small><span class="lvl ${s.nivel === 3 ? 'l3' : ''}">${s.nivel === 3 ? 'Claude Code' : 'instantáneo'}</span></button>`).join('');
  const [rems, reqs, last] = await Promise.all([reminders.all(), requests.all(), kv.get('syncLast', null)]);
  const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
  const today = rems.filter(r => !r.done && !r.suggested && r.when >= start.getTime() && r.when < end.getTime()).sort((a, b) => a.when - b.when);
  const ag = $('#today-agenda'); if (ag) ag.innerHTML = today.length ? today.map(r => `<div class="item"><span class="time">${new Date(r.when).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span><span>${esc(r.text)}</span></div>`).join('') : '<p class="muted small">Nada programado para hoy. Di “recuérdame … a las 5”.</p>';
  const tasks = state.notes.filter(n => n.type === 'tarea' && !(n.tags || []).includes('hecha')).slice(0, 6);
  const tk = $('#today-tasks'); if (tk) tk.innerHTML = tasks.length ? tasks.map(t => `<div class="item"><input type="checkbox" data-task-done="${t.id}"><a href="#" data-open="${t.id}">${esc(t.title)}</a></div>`).join('') : '<p class="muted small">Sin tareas pendientes. Di “crea tarea …”.</p>';
  const reports = state.notes.filter(n => (n.tags || []).includes('informe') && (n.tags || []).includes('claude')).slice(0, 6);
  const rl = $('#reports-list'); if (rl) rl.innerHTML = reports.length ? reports.map(n => `<div class="report" data-open="${n.id}"><b>${esc(n.title)}</b><span class="muted small">${fmtDate(n.updated)}</span></div>`).join('') : '<p class="muted small">Todavía no hay informes. Pulsa una habilidad de Claude Code y aparecerán aquí.</p>';
  const pending = reqs.filter(r => r.status === 'pendiente').length, done = reqs.filter(r => r.status === 'hecho').length;
  const mr = $('#meter-requests'); if (mr) mr.textContent = `${pending} pendiente${pending === 1 ? '' : 's'} · ${done} hecha${done === 1 ? '' : 's'}`;
  const mb = $('#meter-bar'); if (mb) mb.style.width = reqs.length ? `${Math.round(done / reqs.length * 100)}%` : '0%';
  const ml = $('#meter-local'); if (ml) { const w = await whisperReady(), e = await embeddingsReady(); ml.textContent = w && e ? 'Whisper · semántica' : w ? 'Whisper' : e ? 'semántica' : 'apagadas'; }
  const ms = $('#meter-sync'); if (ms) ms.textContent = last ? `Sincronizado ${fmtDate(last.at)}` : 'Sin sincronizar';
}
async function renderRequests() {
  const el = $('#requests-list'); if (!el) return;
  const reqs = (await requests.all()).sort((a, b) => b.created - a.created).slice(0, 12);
  el.innerHTML = reqs.length ? reqs.map(r => `<div class="req"><span class="st ${r.status}">${esc(r.status)}</span><span class="grow">${esc(r.skill)} — ${esc((r.prompt || '').slice(0, 80))}</span>${r.reportId ? `<a href="#" data-open="${r.reportId}">ver informe</a>` : ''}<button class="icon-btn" data-req-del="${r.id}"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></div>`).join('') : '<p class="muted small">Sin peticiones todavía.</p>';
}

async function runDemo() {
  toast('Cargando bóveda de ejemplo…');
  await loadDemo(); await loadNotes(); await suggestFromNotes();
  await renderHome();
  addMsg('brainer', `Cargué una bóveda de ejemplo: 8 notas enlazadas, una tarea con fecha, 2 recordatorios, 6 tarjetas y un informe que dejó Claude Code. Prueba:<br>• “búscame el informe de termodinámica”<br>• “qué dice la segunda ley”<br>• “recuérdame estudiar cuántica mañana a las 8”<br>• “investiga a fondo la revolución francesa” (Nivel 3)<br>• Mira <a href="#" data-view-go="grafo">Cerebro</a> y <a href="#" data-view-go="estudio">Estudio</a>. Cuando termines: “Quitar demo”.`);
}

async function firstGesture() {
  if (!state.settings.voiceReply) return;
  const [profile, b] = await Promise.all([kv.get('profile', {}), dailyBrief()]);
  const reports = state.notes.filter(n => (n.tags || []).includes('claude') && Date.now() - n.updated < 86400000).length;
  speakHud(welcomeLine({ name: profile.name, today: b.today.length, due: b.study.due, reports }));
}
async function presence() {
  if (!state.settings.proactive || state.view !== 'inicio') return;
  if (Date.now() - state.lastActivity < 8 * 60000) return;
  const [profile, st] = await Promise.all([kv.get('profile', {}), studyStats()]);
  const stale = state.notes.find(n => Date.now() - n.updated > 10 * 86400000 && n.type !== 'informe');
  const line = await idleThought({ name: profile.name, due: st.due, staleTitle: stale && stale.title, minutesActive: (Date.now() - state.sessionStart) / 60000 });
  if (line) addMsg('brainer', esc(line), { speakText: line, always: true });
}

// ---------- Inicio ----------
async function renderHome() {
  const profile = await kv.get('profile', {});
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  $('#greeting').textContent = `${saludo}${profile.name ? ', ' + profile.name.split(' ')[0] : ''}.`;
  await renderBrief(false);
  await renderCockpit();
}

async function renderBrief(asMessage) {
  const b = await dailyBrief();
  $('#daily-brief').textContent = b.text;
  const sug = $('#suggestions'); sug.innerHTML = '';
  const chips = [];
  if (b.study.due) chips.push({ t: `Repasar ${b.study.due} tarjetas`, fn: () => { showView('estudio'); startStudy(); } });
  if (b.suggested.length) chips.push({ t: `${b.suggested.length} recordatorio${b.suggested.length > 1 ? 's' : ''} propuesto${b.suggested.length > 1 ? 's' : ''}`, fn: () => showView('recordatorios') });
  for (const s of b.subjects.slice(0, 2)) chips.push({ t: s.replace(/^#/, ''), fn: () => handleInput(`qué tengo sobre ${s.replace(/^#/, '')}`) });
  chips.push({ t: 'Ver la red', fn: () => showView('grafo') });
  chips.push({ t: 'Nueva captura', fn: () => openNote(null) });
  const hasDemo = state.notes.some(n => n.id === 'demo-termo');
  if (!hasDemo && state.notes.length <= 2) chips.unshift({ t: 'Cargar demo', fn: runDemo });
  if (hasDemo) chips.push({ t: 'Quitar demo', fn: async () => { await removeDemo(); await loadNotes(); renderHome(); toast('Demo eliminada'); } });
  for (const c of chips) { const bt = document.createElement('button'); bt.textContent = c.t; bt.onclick = c.fn; sug.appendChild(bt); }

  if (asMessage) {
    let html = esc(b.text);
    for (const r of b.today) html += `<br>• ${esc(r.text)} — ${fmtDate(r.when)}`;
    for (const t of b.tasks.slice(0, 5)) html += `<br>· <a href="#" data-open="${t.id}">${esc(t.title)}</a>`;
    addMsg('brainer', html, { speakText: b.text });
  }
  // Pregunta proactiva (una por sesión)
  if (b.questions.length && !state.askedToday) {
    state.askedToday = true;
    const q = b.questions[0];
    addMsg('brainer', esc(q), { speakText: q });
    if (/estudiaste hoy/.test(q)) state.pendingCheckin = true;
  }
}

// ---------- Bóveda ----------
async function loadNotes() {
  state.notes = (await notes.all()).sort((a, b) => b.updated - a.updated);
  if (state.settings && state.settings.localEmbeddings) indexNotes().catch(() => {});
  if (state.view === 'inicio') renderCockpit();
  if (state.view === 'boveda') renderVault();
  if (state.view === 'grafo') refreshGraph(); else state.brain.setNotes(state.notes);
  if (state.view === 'perfil') renderProfile();
}

function renderVault() {
  const q = $('#vault-search').value.trim();
  let list = state.notes;
  if (state.activeTag) list = list.filter(n => (n.tags || []).includes(state.activeTag));
  if (q) list = search(list, q, { limit: 100 }).map(r => r.note);
  const tags = {};
  for (const n of state.notes) for (const t of n.tags || []) tags[t] = (tags[t] || 0) + 1;
  $('#tag-chips').innerHTML = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 20)
    .map(([t, c]) => `<span class="chip ${state.activeTag === t ? 'active' : ''}" data-tag="${esc(t)}">${esc(t)} · ${c}</span>`).join('');
  const el = $('#note-list');
  if (!list.length) { el.innerHTML = `<div class="empty">${state.notes.length ? 'Nada coincide con tu búsqueda.' : 'Tu bóveda está vacía. Crea una nota, importa un archivo o díctale algo a Brainer.'}</div>`; return; }
  el.innerHTML = list.map(n => `
    <article class="note-card" data-type="${esc(n.type)}" data-open="${n.id}">
      <span class="kind">${esc(TYPE_LABEL[n.type] || n.type)} · ${fmtDate(n.updated)}</span>
      <h4>${esc(n.title)}</h4>
      <p>${esc(stripTags(n.body).slice(0, 220))}</p>
      <div class="tags">${(n.tags || []).slice(0, 5).map(t => `<span class="tag">${esc(t)}</span>`).join('')}${n.files && n.files.length ? `<span class="tag">${n.files.length} adjunto${n.files.length > 1 ? 's' : ''}</span>` : ''}</div>
    </article>`).join('');
}

// ---------- Editor de notas ----------
let saveTimer = null;
async function openNote(note) {
  if (note && note.tag) { state.activeTag = note.tag; showView('boveda'); return; }
  state.currentNote = note || { id: null, title: '', body: '', type: 'nota', files: [] };
  const p = $('#note-panel'); p.hidden = false;
  $('#note-type').value = state.currentNote.type || 'nota';
  $('#note-title').value = state.currentNote.title || '';
  $('#note-body').value = state.currentNote.body || '';
  $('#note-tags').value = (state.currentNote.tags || []).join(', ');
  $('#note-meta').textContent = state.currentNote.id ? `Editada ${fmtDate(state.currentNote.updated)}` : 'Nueva nota';
  renderAttachments();
  renderBacklinks();
  if (!state.currentNote.id) $('#note-title').focus();
}

async function renderAttachments() {
  const el = $('#note-attachments'); el.innerHTML = '';
  for (const fid of state.currentNote.files || []) {
    const f = await files.get(fid); if (!f) continue;
    const a = document.createElement('a'); a.textContent = f.name; a.href = '#';
    a.onclick = e => { e.preventDefault(); const url = URL.createObjectURL(f.blob); window.open(url, '_blank'); };
    el.appendChild(a);
  }
}
function renderBacklinks() {
  const n = state.currentNote; if (!n.id) { $('#note-backlinks').textContent = ''; return; }
  const title = (n.title || '').toLowerCase();
  const back = state.notes.filter(o => o.id !== n.id && (o.links || []).includes(title));
  $('#note-backlinks').innerHTML = back.length ? `← ${back.map(b => `<a href="#" data-open="${b.id}">${esc(b.title)}</a>`).join(', ')}` : '';
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrentNote, 500);
}
async function saveCurrentNote() {
  const n = state.currentNote; if (!n) return;
  const title = $('#note-title').value, body = $('#note-body').value;
  if (!title.trim() && !body.trim()) return;
  const saved = await notes.save({ ...n, title, body, type: $('#note-type').value, tagText: $('#note-tags').value });
  state.currentNote = saved;
  $('#note-meta').textContent = `Guardada ${fmtDate(saved.updated)}`;
  await loadNotes();
  await suggestFromNotes();
}
let markedPromise = null;
async function renderPreview() {
  const n = state.currentNote; if (!n) return;
  const box = $('#note-rendered'), ta = $('#note-body');
  const show = box.hidden; box.hidden = !show; ta.hidden = show;
  if (!show) return;
  if (!markedPromise) markedPromise = import('https://cdn.jsdelivr.net/npm/marked@18/+esm').then(m => m.marked);
  const marked = await markedPromise;
  const titles = new Map(state.notes.map(x => [x.title.toLowerCase(), x.id]));
  const src = (ta.value || '').replace(/\[\[([^\]]+)\]\]/g, (_, t) => { const id = titles.get(t.trim().toLowerCase()); return id ? `<a href="#" class="wikilink" data-open="${id}">${t}</a>` : `<a href="#" class="wikilink missing" data-create="${t.replace(/"/g, '&quot;')}">${t}</a>`; });
  box.innerHTML = marked.parse(src, { breaks: true });
}
function closeNote() { clearTimeout(saveTimer); saveCurrentNote(); $('#note-panel').hidden = true; state.currentNote = null; }

// ---------- Importar archivos ----------
async function importFiles(fileList) {
  let count = 0;
  for (const file of fileList) {
    let text = '';
    if (/^text\/|\.(md|markdown|txt|csv|json)$/i.test(file.type + file.name)) text = await file.text();
    else if (file.type === 'application/pdf') text = await pdfText(file);
    const stored = await files.save(file, text);
    const title = file.name.replace(/\.[^.]+$/, '');
    const type = /informe|reporte|report|ensayo|trabajo/i.test(title) ? 'informe' : 'nota';
    await notes.save({ title, body: text ? text.slice(0, 200000) : `(Archivo adjunto: ${file.name})`, type, files: [stored.id], tagText: '#importado' });
    count++;
  }
  await loadNotes();
  await suggestFromNotes();
  toast(`${count} archivo${count > 1 ? 's' : ''} guardado${count > 1 ? 's' : ''} en tu bóveda`);
}

// Extrae texto de un PDF con pdf.js (se carga solo cuando hace falta).
async function pdfText(file) {
  try {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = '';
    for (let i = 1; i <= Math.min(doc.numPages, 80); i++) {
      const page = await doc.getPage(i);
      const c = await page.getTextContent();
      out += c.items.map(it => it.str).join(' ') + '\n\n';
    }
    return out.trim();
  } catch (err) { console.warn('PDF sin texto extraíble', err); return ''; }
}

// ---------- Grafo ----------
function refreshGraph() {
  const f = $('#graph-filter').value;
  state.brain.setNotes(f ? state.notes.filter(n => n.type === f) : state.notes);
}

// ---------- Estudio ----------
async function renderStudy() {
  const st = await studyStats();
  $('#study-stats').innerHTML = `
    <div class="stat"><b>${st.due}</b><span>para hoy</span></div>
    <div class="stat"><b>${st.total}</b><span>tarjetas</span></div>
    <div class="stat"><b>${st.learned}</b><span>dominadas</span></div>
    <div class="stat"><b>${st.tomorrow}</b><span>mañana</span></div>`;
}
async function startStudy() {
  state.studyQueue = await dueCards();
  if (!state.studyQueue.length) {
    const all = await cards.all();
    $('#study-area').innerHTML = `<p class="muted">${all.length ? 'Nada pendiente por ahora. ¡Vas al día!' : 'Aún no hay tarjetas. Pulsa “Generar tarjetas” para crearlas desde tus notas (gratis) o pide a Claude que las genere desde una nota.'}</p>`;
    return;
  }
  nextCard();
}
function nextCard() {
  state.studyCard = state.studyQueue.shift(); state.showAnswer = false;
  if (!state.studyCard) { renderStudy(); $('#study-area').innerHTML = '<p class="muted">Sesión terminada. Buen trabajo.</p>'; return; }
  drawCard();
}
async function drawCard() {
  const c = state.studyCard;
  const src = c.noteId ? state.notes.find(n => n.id === c.noteId) : null;
  $('#study-area').innerHTML = `
    <div class="flashcard">
      <div class="q">${esc(c.q)}</div>
      ${state.showAnswer ? `<div class="a">${esc(c.a)}</div>` : '<button class="btn primary" id="btn-show">Mostrar respuesta</button>'}
      ${src ? `<div class="src">De: <a href="#" data-open="${src.id}">${esc(src.title)}</a></div>` : ''}
    </div>
    ${state.showAnswer ? `<div class="grade" style="margin-top:12px">
      <button class="btn" data-grade="0">No la sabía</button>
      <button class="btn" data-grade="1">Difícil</button>
      <button class="btn" data-grade="2">Bien</button>
      <button class="btn primary" data-grade="3">Fácil</button>
    </div>` : ''}
    <p class="muted small" style="text-align:center;margin-top:8px">${state.studyQueue.length} restantes</p>`;
  const show = $('#btn-show'); if (show) show.onclick = () => { state.showAnswer = true; drawCard(); };
  $$('[data-grade]').forEach(b => b.onclick = async () => { await cards.save(schedule(c, +b.dataset.grade)); nextCard(); });
}
async function generateCards() {
  let made = 0;
  const existing = await cards.all();
  const seen = new Set(existing.map(c => c.noteId + '|' + c.q.toLowerCase()));
  for (const n of state.notes) {
    if (n.type === 'tarea') continue;
    for (const c of cardsFromNote(n)) {
      const k = c.noteId + '|' + c.q.toLowerCase(); if (seen.has(k)) continue;
      await cards.save(c); seen.add(k); made++;
    }
  }
  toast(made ? `${made} tarjetas nuevas creadas (sin gastar créditos)` : 'No encontré contenido nuevo para tarjetas. Usa títulos (## Tema), “Término: definición” o **negritas**.');
  renderStudy();
}

// ---------- Recordatorios ----------
async function renderReminders() {
  const list = (await reminders.all()).sort((a, b) => a.when - b.when);
  const el = $('#reminder-list');
  if (!list.length) { el.innerHTML = '<div class="empty">Sin recordatorios. Dile a Brainer “recuérdame … mañana a las 8”.</div>'; return; }
  el.innerHTML = list.map(r => `
    <div class="reminder ${r.done ? 'done' : ''} ${r.suggested ? 'suggested' : ''}" data-id="${r.id}">
      <input type="checkbox" ${r.done ? 'checked' : ''} data-done="${r.id}" ${r.suggested ? 'disabled' : ''}>
      <div class="grow"><div>${esc(r.text)}</div><div class="when">${fmtDate(r.when)}${r.suggested ? ' · propuesto por Brainer' : ''}</div></div>
      ${r.suggested ? `<button class="btn primary small" data-accept="${r.id}">Aceptar</button>` : ''}
      <button class="icon-btn" data-del="${r.id}" title="Eliminar"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>
    </div>`).join('');
}

// ---------- Perfil / Portafolio ----------
async function renderProfile() {
  const p = await kv.get('profile', {});
  const mem = await kv.get('memory', {});
  const initials = (p.name || 'B').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const links = (p.links || []).map(l => `<a href="${esc(/^https?:/.test(l) ? l : 'https://' + l)}" target="_blank" rel="noopener">${esc(l.replace(/^https?:\/\//, ''))}</a>`).join('');
  $('#profile-view').innerHTML = `
    <div class="avatar">${esc(initials)}</div>
    <h3 style="font-size:1.3rem">${esc(p.name || 'Tu nombre')}</h3>
    <p class="muted">${esc(p.title || 'Cuéntale a Brainer qué haces para que se adapte a ti.')}</p>
    <p>${esc(p.bio || '')}</p>
    ${p.goals && p.goals.length ? `<p><b>Metas:</b> ${p.goals.map(esc).join(' · ')}</p>` : ''}
    <div class="links">${links}</div>
    <div class="core">
      <div><div class="ph">CÓMO SUENO</div>${esc(p.voice || 'Frases cortas. Directo. Sin relleno.')}</div>
      <div><div class="ph">QUÉ NUNCA SE TOCA</div>${esc(p.rules || 'Nada definido todavía.')}</div>
    </div>
    <p class="muted small" style="margin-top:14px">Brainer: ${state.notes.length} notas · ${(await cards.all()).length} tarjetas · ${mem.inputs || 0} conversaciones con Brainer</p>`;
  const projects = state.notes.filter(n => (n.tags || []).includes('proyecto'));
  $('#project-list').innerHTML = projects.length
    ? `<div class="note-list">${projects.map(n => `<article class="note-card" data-type="${esc(n.type)}" data-open="${n.id}"><h4>${esc(n.title)}</h4><p>${esc(n.body.slice(0, 200))}</p></article>`).join('')}</div>`
    : '<p class="muted">Todavía no hay proyectos.</p>';
}

// ---------- Ajustes ----------
async function renderSettings() {
  const s = state.settings = await getSettings();
  $('#set-apikey').value = s.apiKey; $('#set-model-light').value = s.modelLight; $('#set-model-heavy').value = s.modelHeavy;
  $('#set-ask-before-ai').checked = s.askBeforeAI; $('#set-proactive').checked = s.proactive; $('#set-checkin-hour').value = s.checkinHour; $('#set-voice-reply').checked = s.voiceReply;
  $('#set-local-whisper').checked = !!s.localWhisper; $('#set-local-embeddings').checked = !!s.localEmbeddings;
  $('#set-pitch').value = s.pitch || 0.82; $('#set-sounds').checked = s.sounds !== false; $('#set-cloud-voice').checked = s.cloudVoice !== false;
  const sel = $('#set-voice'); const voices = listVoices();
  sel.innerHTML = '<option value="">Automática (grave)</option>' + voices.map(v => `<option value="${esc(v.name)}" ${v.name === s.voiceName ? 'selected' : ''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('');
  await renderRequests();
  const sc = await getSyncConfig();
  $('#sync-url').value = sc.url || 'https://brainer-sync.kusical.workers.dev'; $('#sync-secret').value = sc.secret; $('#sync-enabled').checked = sc.enabled;
  await renderSyncStatus();
  await refreshUsage();
}
async function renderSyncStatus(extra) {
  const sc = await getSyncConfig();
  const last = await kv.get('syncLast', null);
  const q = Object.keys(await kv.get('syncQueue', {})).length;
  const el = $('#sync-status'); if (!el) return;
  el.textContent = extra || (!sc.enabled ? 'Desactivada. Solo se guarda en este dispositivo.' : last ? `Última sincronización ${fmtDate(last.at)} · ${q} cambio${q === 1 ? '' : 's'} pendiente${q === 1 ? '' : 's'}` : 'Activa. Aún no se ha sincronizado.');
}
async function loadModels() {
  const el = $('#models-status');
  try {
    if (state.settings.localWhisper) { el.textContent = 'Preparando Whisper…'; await loadWhisper(); }
    if (state.settings.localEmbeddings) { el.textContent = 'Preparando embeddings…'; await embed(['hola']); const n = await indexNotes(); el.textContent = `Modelos listos · ${n} notas indexadas`; }
    else if (state.settings.localWhisper) el.textContent = 'Whisper listo';
    else el.textContent = 'Activa al menos un modelo arriba.';
    renderCockpit();
  } catch (err) { el.textContent = 'No se pudo cargar: ' + err.message; }
}
async function persistSettings() {
  const s = {
    apiKey: $('#set-apikey').value.trim(), modelLight: $('#set-model-light').value, modelHeavy: $('#set-model-heavy').value,
    askBeforeAI: $('#set-ask-before-ai').checked, proactive: $('#set-proactive').checked, checkinHour: $('#set-checkin-hour').value || '19:00', voiceReply: $('#set-voice-reply').checked,
    localWhisper: $('#set-local-whisper').checked, localEmbeddings: $('#set-local-embeddings').checked, whisperModel: state.settings.whisperModel || 'onnx-community/whisper-base',
    voiceName: $('#set-voice').value, pitch: parseFloat($('#set-pitch').value) || 0.82, sounds: $('#set-sounds').checked,
    cloudVoice: $('#set-cloud-voice').checked,
  };
  await saveSettings(s); state.settings = s; toast('Ajustes guardados');
}
async function refreshUsage() {
  const u = await usageToday();
  const pend = (await requests.all()).filter(r => r.status === 'pendiente').length;
  $('#usage-summary').textContent = `CLAUDE CODE · ${pend} PENDIENTE${pend === 1 ? '' : 'S'}`;
  const d = $('#usage-detail'); if (d) d.innerHTML = `Hoy: ${u.today.calls} llamadas · ${u.today.input.toLocaleString('es')} entrada / ${u.today.output.toLocaleString('es')} salida · ~$${u.today.cost.toFixed(3)}<br>Total: ${u.total.calls} llamadas · ~$${u.total.cost.toFixed(2)}`;
}

// ---------- Voz ----------
async function startVoice() {
  const btn = $('#btn-voice');
  if (state.listening) return;
  state.listening = true;
  try {
    btn.classList.add('active'); setStatus('escuchando', 'listening'); hud('escuchando', 'oyendo…'); uiTone('listen');
    let text = '';
    stopSpeaking();
    if (inAppBrowser()) { toast('Estás dentro del navegador de otra app y no permite el micrófono. Abre brainer.kusical.workers.dev en Safari o Chrome.', 7000); }
    if (await cloudReady()) {
      // Oído en tu nube: grabamos hasta el silencio y Whisper transcribe en tu Worker.
      const clip = await recordClip({ onLevel: lvl => state.brain && state.brain.setState('escuchando', lvl) });
      if (clip) { hud('pensando', 'Whisper en tu nube…'); setStatus('transcribiendo', 'thinking'); text = await cloudTranscribe(clip); }
    } else if (state.settings.localWhisper) {
      // Red neuronal local: grabamos hasta el silencio y transcribimos en el dispositivo.
      const audio = await recordUntilSilence({ onLevel: lvl => state.brain && state.brain.setState('escuchando', lvl) });
      if (audio) { hud('pensando', 'Whisper transcribiendo en tu dispositivo…'); setStatus('transcribiendo', 'thinking'); text = await transcribe(audio); }
    } else {
      if (!voiceSupported) { toast('Tu navegador no soporta voz. Activa Whisper local en Ajustes o usa Safari/Chrome.'); return; }
      text = await listen({ onEnd: () => { btn.classList.remove('active'); setStatus('local'); } });
    }
    if (text) { uiTone('done'); showView('inicio'); await handleInput(text, { fromVoice: true }); }
    else toast('No te escuché. Inténtalo otra vez.');
  } catch (err) { hud('error'); uiTone('error'); toast(err.message, 5000); }
  finally { state.listening = false; btn.classList.remove('active'); setStatus('local'); setTimeout(() => hud('inactivo'), 800); }
}
// Hablar con la voz de Brainer; el cerebro pasa a estado “hablando”
async function speakHud(text) {
  if (!text) return;
  if (state.settings.cloudVoice !== false && await cloudReady()) {
    try {
      hud('pensando', 'generando voz…');
      await speakCloud(text, { speaker: state.settings.speaker || 'celeste', onStart: () => hud('hablando') });
      hud('inactivo'); return;
    } catch (err) { console.warn('voz en la nube no disponible', err); }
  }
  hud('hablando');
  personaSpeak(text, { voiceName: state.settings.voiceName, pitch: state.settings.pitch || 0.82, onEnd: () => hud('inactivo') });
  setTimeout(() => { if ($('#hud-state').textContent === 'Hablando') hud('inactivo'); }, Math.min(20000, 90 * (text || '').length));
}
function uiTone(kind) { if (state.settings.sounds !== false) tone(kind); }

// ---------- Eventos ----------
function bind() {
  $$('.nav-item').forEach(a => a.onclick = e => { e.preventDefault(); showView(a.dataset.view); });
  $('#btn-menu').onclick = () => { $('#sidenav').classList.toggle('open'); $('#scrim').classList.toggle('show'); };
  $('#scrim').onclick = () => { $('#sidenav').classList.remove('open'); $('#scrim').classList.remove('show'); };
  $('#brand').onclick = () => showView('inicio');
  $('#btn-voice').onclick = startVoice;

  $('#composer').onsubmit = e => { e.preventDefault(); const i = $('#composer-input'); const v = i.value; i.value = ''; handleInput(v); };
  document.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if (open) { e.preventDefault(); const n = state.notes.find(x => x.id === open.dataset.open); if (n) openNote(n); return; }
    const tag = e.target.closest('[data-tag]');
    if (tag) { state.activeTag = state.activeTag === tag.dataset.tag ? null : tag.dataset.tag; renderVault(); return; }
    const aiAbout = e.target.closest('[data-ai-about]');
    if (aiAbout) { aiAboutNote(aiAbout.dataset.aiAbout, aiAbout.dataset.q); return; }
    const aiF = e.target.closest('[data-ai-free]');
    if (aiF) { aiFree(aiF.dataset.aiFree); return; }
    const go = e.target.closest('[data-view-go]');
    if (go) { e.preventDefault(); showView(go.dataset.viewGo); return; }
    const skill = e.target.closest('[data-skill]');
    if (skill) { runSkill(skill.dataset.skill); return; }
    const rq = e.target.closest('[data-req-skill]');
    if (rq) { runSkill(rq.dataset.reqSkill, { prompt: rq.dataset.reqPrompt }); return; }
    const rqd = e.target.closest('[data-req-del]');
    if (rqd) { requests.remove(rqd.dataset.reqDel).then(() => { renderRequests(); renderCockpit(); }); return; }
    const cr = e.target.closest('[data-create]');
    if (cr) { e.preventDefault(); notes.save({ title: cr.dataset.create.slice(0, 60), body: '', type: 'nota' }).then(async n => { await loadNotes(); openNote(n); }); return; }
    const del = e.target.closest('[data-del]');
    if (del) { reminders.remove(del.dataset.del).then(renderReminders); return; }
    const acc = e.target.closest('[data-accept]');
    if (acc) { reminders.all().then(async all => { const r = all.find(x => x.id === acc.dataset.accept); if (r) { r.suggested = false; await reminders.save(r); await requestNotifPermission(); renderReminders(); toast('Recordatorio activado'); } }); return; }
  });
  document.addEventListener('change', e => {
    const td = e.target.closest('[data-task-done]');
    if (td) notes.get(td.dataset.taskDone).then(async n => { if (n) { await notes.save({ ...n, tagText: [...(n.tags || []), 'hecha'].join(',') }); await loadNotes(); renderCockpit(); toast('Tarea completada'); } });
    const done = e.target.closest('[data-done]');
    if (done) reminders.all().then(async all => { const r = all.find(x => x.id === done.dataset.done); if (r) { r.done = done.checked; await reminders.save(r); renderReminders(); } });
  });

  // Bóveda
  $('#vault-search').oninput = renderVault;
  $('#btn-new-note').onclick = () => openNote(null);
  $('#file-input').onchange = e => { importFiles([...e.target.files]); e.target.value = ''; };
  // Editor
  ['#note-title', '#note-body', '#note-tags'].forEach(s => $(s).oninput = scheduleSave);
  $('#note-type').onchange = scheduleSave;
  $('#note-close').onclick = closeNote;
  $('#note-preview').onclick = renderPreview;
  $('#note-delete').onclick = async () => {
    if (!state.currentNote || !state.currentNote.id) { $('#note-panel').hidden = true; return; }
    if (!confirm('¿Eliminar esta nota?')) return;
    await notes.remove(state.currentNote.id); $('#note-panel').hidden = true; state.currentNote = null; await loadNotes(); toast('Nota eliminada');
  };
  $('#note-ai').onclick = async () => {
    await saveCurrentNote(); const n = state.currentNote; if (!n || !n.id) return;
    if (!state.settings.apiKey) {
      const p = window.prompt('¿Qué quieres que haga Claude Code con esta nota?', `Explica a fondo y amplía la nota «${n.title}» con fuentes y preguntas de repaso`);
      if (!p) return;
      $('#note-panel').hidden = true; await runSkill('investigacion', { prompt: p }); return;
    }
    const r = await aiDialog(`Claude sobre “${n.title}”`, 'Resume esta nota en 5 puntos y crea 5 tarjetas de estudio en JSON al final.');
    if (!r || !r.prompt) return;
    toast('Pidiendo a Claude…');
    try {
      const res = await askAI({ tier: r.tier, prompt: r.prompt, context: `Nota “${n.title}” (${n.type}):\n\n${n.body}` });
      const made = parseCards(res.text);
      for (const c of made) await cards.save({ ...c, noteId: n.id });
      const clean = res.text.replace(/\[[\s\S]*\]$/, '').trim();
      $('#note-body').value = `${n.body}\n\n---\nClaude (${res.model}):\n${clean}`;
      scheduleSave();
      toast(made.length ? `Listo. ${made.length} tarjetas añadidas a Estudio.` : 'Listo.');
    } catch (err) { toast(err.message, 5000); }
  };
  // Grafo
  $('#graph-filter').onchange = refreshGraph;
  $('#btn-graph-fit').onclick = () => { state.brain.zoom = 1; state.brain.rotX = 0.35; state.brain.clearActivation(); };
  // Estudio
  $('#btn-study-start').onclick = startStudy;
  $('#btn-gen-cards').onclick = generateCards;
  // Recordatorios
  $('#btn-new-reminder').onclick = () => { $('#reminder-form').hidden = false; $('#rem-text').focus(); };
  $('#rem-cancel').onclick = () => { $('#reminder-form').hidden = true; };
  $('#reminder-form').onsubmit = async e => {
    e.preventDefault(); await requestNotifPermission();
    await reminders.save({ text: $('#rem-text').value, when: new Date($('#rem-when').value).getTime() });
    $('#reminder-form').reset(); $('#reminder-form').hidden = true; renderReminders();
  };
  // Perfil
  $('#btn-edit-profile').onclick = async () => {
    const p = await kv.get('profile', {});
    $('#pf-name').value = p.name || ''; $('#pf-title').value = p.title || ''; $('#pf-bio').value = p.bio || ''; $('#pf-voice').value = p.voice || ''; $('#pf-rules').value = p.rules || '';
    $('#pf-links').value = (p.links || []).join(', '); $('#pf-goals').value = (p.goals || []).join(', ');
    $('#profile-form').hidden = false;
  };
  $('#pf-cancel').onclick = () => { $('#profile-form').hidden = true; };
  $('#profile-form').onsubmit = async e => {
    e.preventDefault();
    await kv.set('profile', { name: $('#pf-name').value.trim(), title: $('#pf-title').value.trim(), bio: $('#pf-bio').value.trim(), voice: $('#pf-voice').value.trim(), rules: $('#pf-rules').value.trim(), links: split($('#pf-links').value), goals: split($('#pf-goals').value) });
    $('#profile-form').hidden = true; renderProfile(); toast('Perfil guardado');
  };
  // Ajustes
  ['#set-apikey', '#set-model-light', '#set-model-heavy', '#set-ask-before-ai', '#set-proactive', '#set-checkin-hour', '#set-voice-reply', '#set-local-whisper', '#set-local-embeddings', '#set-voice', '#set-pitch', '#set-sounds', '#set-cloud-voice'].forEach(s => $(s).onchange = persistSettings);
  $('#btn-test-voice').onclick = async () => { await persistSettings(); uiTone('done'); const p = await kv.get('profile', {}); speakHud(`Sistemas en línea, ${p.name || 'Smith'}. Soy Brainer. ¿Por dónde empezamos?`); };
  $('#btn-load-models').onclick = loadModels;
  $('#btn-reindex').onclick = async () => { if (!state.settings.localEmbeddings) { toast('Activa la búsqueda semántica primero'); return; } toast('Indexando…'); const n = await indexNotes(); toast(`${n} notas indexadas`); renderCockpit(); };
  onProgress(p => { const el = $('#models-status'); if (!el) return; const name = p.model.split('/').pop(); el.textContent = p.status === 'progress' ? `${name}: ${p.file || ''} ${Math.round(p.progress)}%` : p.status === 'ready' ? `${name}: listo` : `${name}: ${p.status}`; });
  document.addEventListener('keydown', e => { if (e.ctrlKey && e.altKey && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); startVoice(); } });
  // Sincronización
  $('#sync-enabled').onchange = async e => { const sc = await getSyncConfig(); await saveSyncConfig({ ...sc, enabled: e.target.checked }); renderSyncStatus(); if (e.target.checked) syncNow(); };
  $('#btn-sync-connect').onclick = async () => {
    const url = $('#sync-url').value.trim(), secret = $('#sync-secret').value;
    if (!url || !secret) { toast('Pon la dirección y la frase secreta'); return; }
    try {
      renderSyncStatus('Probando conexión…');
      await testConnection(url, secret);
      await saveSyncConfig({ url, secret, enabled: true }); $('#sync-enabled').checked = true;
      renderSyncStatus('Conectado. Sincronizando toda tu bóveda…');
      const r = await fullSync();
      if (r.error) throw new Error(r.error);
      await loadNotes(); renderSyncStatus(); toast(`Sincronizado: ${r.pushed} enviados, ${r.pulled} recibidos`);
    } catch (err) { renderSyncStatus('Error: ' + err.message); toast(err.message, 5000); }
  };
  $('#btn-sync-now').onclick = async () => { const r = await syncNow(); if (r.skipped) toast('Activa la sincronización primero'); else if (r.error) toast(r.error, 5000); else { await loadNotes(); toast(`Sincronizado: ${r.pushed} enviados, ${r.pulled} recibidos`); } renderSyncStatus(); };
  onSync(evt => {
    const badge = $('#sync-badge'); badge.hidden = false;
    badge.textContent = evt.state === 'syncing' ? 'SYNC…' : evt.state === 'error' ? 'SYNC !' : 'SYNC OK';
    badge.title = evt.state === 'error' ? evt.message : 'Sincronizado';
    if (evt.state === 'ok' && evt.pulled > 0) {
      const before = state.notes.filter(n => (n.tags || []).includes('claude')).length;
      loadNotes().then(() => {
        const after = state.notes.filter(n => (n.tags || []).includes('claude')).length;
        if (after > before) { toast('Claude Code dejó un informe nuevo en tu bóveda', 6000); if (state.view === 'inicio') addMsg('brainer', 'Llegó un informe de Claude Code. Lo tienes en la Cabina y en la Bóveda.', { speakText: 'Llegó un informe de Claude Code.' }); }
      });
      if (state.view === 'recordatorios') renderReminders(); if (state.view === 'estudio') renderStudy(); if (state.view === 'ajustes') renderRequests();
    }
    if (state.view === 'ajustes') renderSyncStatus();
  });

  $('#btn-export').onclick = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `brainer-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast('Bóveda exportada');
  };
  $('#import-input').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { await importAll(JSON.parse(await f.text())); await loadNotes(); toast('Bóveda importada'); } catch (err) { toast(err.message, 5000); }
    e.target.value = '';
  };
  $('#btn-wipe').onclick = async () => { if (confirm('¿Borrar TODO Brainer de este dispositivo? Exporta antes si quieres conservarlo.')) { await wipeAll(); location.reload(); } };

  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && $('#view-' + v)) showView(v); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#note-panel').hidden) closeNote(); });
}
const split = s => s.split(',').map(x => x.trim()).filter(Boolean);

// ---------- Arranque ----------
async function init() {
  state.settings = await getSettings();
  const prof = await kv.get('profile', {});
  if (!prof.name) await kv.set('profile', { ...prof, name: 'Smith' });
  state.brain = new Brain3D($('#brain'), {
    onOpen: openNote,
    onHover: n => { const h = $('#graph-hover'); if (!h) return; if (n && state.view === 'grafo') { h.hidden = false; h.innerHTML = `<b>${esc(n.title)}</b><span class="readout">${esc(TYPE_LABEL[n.type] || n.type)}${(n.tags || []).length ? ' · ' + n.tags.map(esc).join(', ') : ''}</span><p>${esc((n.body || '').slice(0, 160))}</p>`; } else h.hidden = true; },
  });
  bind();
  // Reloj y presencia
  const clock = () => { const el = $('#tel-time'); if (el) el.textContent = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); }; clock(); setInterval(clock, 15000);
  state.lastActivity = Date.now(); state.sessionStart = Date.now();
  document.addEventListener('pointerdown', () => { state.lastActivity = Date.now(); if (!state.userGestured) { state.userGestured = true; firstGesture(); } }, { passive: true });
  document.addEventListener('keydown', () => { state.lastActivity = Date.now(); }, { passive: true });
  setInterval(presence, 60000);
  await loadNotes();
  await suggestFromNotes();
  startTicker(fired => { for (const r of fired) { toast(`Recordatorio: ${r.text}`, 6000); if (state.view === 'inicio') addMsg('brainer', `Te recuerdo: <b>${esc(r.text)}</b>`, { speakText: `Te recuerdo: ${r.text}` }); } });
  await refreshUsage();
  const v = location.hash.slice(1);
  showView(v && $('#view-' + v) ? v : 'inicio');
  // ?demo=1 carga el cerebro de ejemplo automáticamente
  if (new URLSearchParams(location.search).get('demo') && !state.notes.some(n => n.id === 'demo-termo')) setTimeout(runDemo, 600);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  // Sincronización automática (solo si está configurada)
  const sc = await getSyncConfig();
  if (sc.enabled) { syncNow({ silent: true }).then(() => loadNotes()); startAutoSync(60000); }
  // Ejemplo de bienvenida la primera vez
  if (!state.notes.length && !(await kv.get('welcomed'))) {
    await notes.save({ id: 'welcome', title: 'Bienvenido a Brainer', type: 'nota', tagText: 'brainer, guía', body: 'Esto es Brainer, tu inteligencia personal. Todo se guarda en tu dispositivo y se sincroniza en tu propia nube.\n\n## Cómo usarlo\n- Salúdame. Pregúntame cómo estoy. Cuéntame qué estudiaste.\n- Crea notas y enlázalas con [[Bienvenido a Brainer]]: en la Red verás la conexión.\n- Pulsa el micrófono y di: “búscame la nota de bienvenida”.\n- Di “recuérdame repasar mañana a las 8”.\n\n## Estudio\n**Repetición espaciada**: te pregunto lo que aprendes justo antes de que lo olvides.\nTérmino: definición → así genero tarjetas automáticamente.' });
    await kv.set('welcomed', true);
    await loadNotes();
  }
}
init();
