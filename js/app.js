// Brainer: lógica principal de la interfaz.
import { notes, reminders, cards, files, kv, getSettings, saveSettings, exportAll, importAll, wipeAll, uid } from './store.js';
import { search, parseIntent, normalize } from './search.js';
import { BrainGraph } from './graph.js';
import { listen, speak, voiceSupported } from './voice.js';
import { ask, parseCards, usageToday } from './ai.js';
import { cardsFromNote, schedule, dueCards, stats as studyStats } from './study.js';
import { requestNotifPermission, startTicker, suggestFromNotes, dailyBrief } from './reminders.js';
import { getSyncConfig, saveSyncConfig, syncNow, fullSync, testConnection, startAutoSync, onSync } from './sync.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmtDate = ts => new Date(ts).toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
  if (name === 'grafo') requestAnimationFrame(() => { state.graph.resize(); refreshGraph(); });
  if (name === 'boveda') renderVault();
  if (name === 'estudio') renderStudy();
  if (name === 'recordatorios') renderReminders();
  if (name === 'perfil') renderProfile();
  if (name === 'ajustes') renderSettings();
  if (name === 'inicio') renderHome();
}

// ---------- Chat con Brainer ----------
function addMsg(role, html, { speakText } = {}) {
  const el = document.createElement('div');
  el.className = 'msg ' + role;
  el.innerHTML = html;
  $('#chat').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  if (role === 'brainer' && speakText && state.settings.voiceReply && state.lastInputWasVoice) speak(speakText);
  return el;
}

function resultCard(note, snippet) {
  return `<span class="result" data-open="${note.id}"><b>${esc(note.title)}</b><span class="cite">${esc(note.type)} · ${fmtDate(note.updated)}</span><br>${esc(snippet || '')}</span>`;
}

async function handleInput(text, { fromVoice = false } = {}) {
  text = (text || '').trim();
  if (!text) return;
  state.lastInputWasVoice = fromVoice;
  addMsg('user', esc(text));
  const intent = parseIntent(text);
  await learnFromInput(text);

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
    addMsg('brainer', `Guardado en tu cerebro. ${made.length ? `Creé ${Math.min(made.length, 4)} tarjetas para repasarlo después.` : 'Mañana te preguntaré sobre esto.'}`, { speakText: 'Guardado en tu cerebro.' });
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
    if (suggested.length) html += `<span class="cite">💡 Vi una fecha y te propuse un recordatorio: “${esc(suggested[0].text)}”. Acéptalo en Recordatorios.</span>`;
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
    let html = `Encontré esto en tu cerebro:${resultCard(top.note, top.snippet)}`;
    if (others.length) html += `<span class="cite">También: ${others.map(r => `<a href="#" data-open="${r.note.id}">${esc(r.note.title)}</a>`).join(' · ')}</span>`;
    if (state.settings.apiKey) html += `<br><button class="btn ghost small" data-ai-about="${top.note.id}" data-q="${esc(text)}">✨ Pedir a Claude que responda con esta nota</button>`;
    addMsg('brainer', html, { speakText: `Encontré ${top.note.title}. ${top.snippet.slice(0, 120)}` });
    if (fromVoice && results.length === 1) openNote(top.note);
    return;
  }
  if (intent.fallbackAI && state.settings.apiKey) {
    const el = addMsg('brainer', `No tengo nada guardado sobre eso. <button class="btn ghost small" data-ai-free="${esc(text)}">✨ Preguntarle a Claude (gasta créditos)</button>`);
    return el;
  }
  addMsg('brainer', `No encontré nada sobre “${esc(intent.query)}” en tu bóveda. ¿Quieres que lo guarde como nota? Dime “crea nota sobre …”.`, { speakText: 'No encontré nada sobre eso en tu bóveda.' });
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

// ---------- Inicio ----------
async function renderHome() {
  const profile = await kv.get('profile', {});
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  $('#greeting').textContent = `${saludo}${profile.name ? ', ' + profile.name.split(' ')[0] : ''}.`;
  await renderBrief(false);
}

async function renderBrief(asMessage) {
  const b = await dailyBrief();
  $('#daily-brief').textContent = b.text;
  const sug = $('#suggestions'); sug.innerHTML = '';
  const chips = [];
  if (b.study.due) chips.push({ t: `📚 Repasar ${b.study.due} tarjetas`, fn: () => { showView('estudio'); startStudy(); } });
  if (b.suggested.length) chips.push({ t: `⏰ ${b.suggested.length} recordatorio${b.suggested.length > 1 ? 's' : ''} propuesto${b.suggested.length > 1 ? 's' : ''}`, fn: () => showView('recordatorios') });
  for (const s of b.subjects.slice(0, 2)) chips.push({ t: `🔎 ${s}`, fn: () => handleInput(`qué tengo sobre ${s}`) });
  chips.push({ t: '🕸️ Ver mi cerebro', fn: () => showView('grafo') });
  chips.push({ t: '➕ Crear nota', fn: () => openNote(null) });
  for (const c of chips) { const bt = document.createElement('button'); bt.textContent = c.t; bt.onclick = c.fn; sug.appendChild(bt); }

  if (asMessage) {
    let html = esc(b.text);
    for (const r of b.today) html += `<br>• ${esc(r.text)} — ${fmtDate(r.when)}`;
    for (const t of b.tasks.slice(0, 5)) html += `<br>☐ <a href="#" data-open="${t.id}">${esc(t.title)}</a>`;
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
  if (state.view === 'boveda') renderVault();
  if (state.view === 'grafo') refreshGraph();
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
    .map(([t, c]) => `<span class="chip ${state.activeTag === t ? 'active' : ''}" data-tag="${esc(t)}">#${esc(t)} <small>${c}</small></span>`).join('');
  const el = $('#note-list');
  if (!list.length) { el.innerHTML = `<div class="empty">${state.notes.length ? 'Nada coincide con tu búsqueda.' : 'Tu bóveda está vacía. Crea una nota, importa un archivo o díctale algo a Brainer.'}</div>`; return; }
  el.innerHTML = list.map(n => `
    <article class="note-card" data-type="${esc(n.type)}" data-open="${n.id}">
      <h4>${esc(n.title)}</h4>
      <p>${esc((n.body || '').slice(0, 220))}</p>
      <div class="tags">${(n.tags || []).slice(0, 5).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}${n.files && n.files.length ? `<span class="tag">📎 ${n.files.length}</span>` : ''}</div>
      <span class="muted small">${fmtDate(n.updated)}</span>
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
  $('#note-tags').value = (state.currentNote.tags || []).map(t => '#' + t).join(' ');
  $('#note-meta').textContent = state.currentNote.id ? `Editada ${fmtDate(state.currentNote.updated)}` : 'Nueva nota';
  renderAttachments();
  renderBacklinks();
  if (!state.currentNote.id) $('#note-title').focus();
}

async function renderAttachments() {
  const el = $('#note-attachments'); el.innerHTML = '';
  for (const fid of state.currentNote.files || []) {
    const f = await files.get(fid); if (!f) continue;
    const a = document.createElement('a'); a.textContent = `📎 ${f.name}`; a.href = '#';
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
  const all = state.notes.concat([]);
  state.graph.setData(all, { filterType: $('#graph-filter').value });
  setTimeout(() => state.graph.fit(), 600);
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
  if (!state.studyCard) { renderStudy(); $('#study-area').innerHTML = '<p class="muted">¡Sesión terminada! 🎉</p>'; return; }
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
      <div class="grow"><div>${r.suggested ? '💡 ' : ''}${esc(r.text)}</div><div class="when">${fmtDate(r.when)}${r.suggested ? ' · propuesto por Brainer' : ''}</div></div>
      ${r.suggested ? `<button class="btn primary small" data-accept="${r.id}">Aceptar</button>` : ''}
      <button class="icon-btn" data-del="${r.id}" title="Eliminar">🗑️</button>
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
    <h2>${esc(p.name || 'Tu nombre')}</h2>
    <p class="muted">${esc(p.title || 'Cuéntale a Brainer qué haces para que se adapte a ti.')}</p>
    <p>${esc(p.bio || '')}</p>
    ${p.goals && p.goals.length ? `<p><b>Metas:</b> ${p.goals.map(esc).join(' · ')}</p>` : ''}
    <div class="links">${links}</div>
    <p class="muted small" style="margin-top:14px">Tu cerebro: ${state.notes.length} notas · ${(await cards.all()).length} tarjetas · ${mem.inputs || 0} conversaciones con Brainer</p>`;
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
  const sc = await getSyncConfig();
  $('#sync-url').value = sc.url; $('#sync-secret').value = sc.secret; $('#sync-enabled').checked = sc.enabled;
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
async function persistSettings() {
  const s = {
    apiKey: $('#set-apikey').value.trim(), modelLight: $('#set-model-light').value, modelHeavy: $('#set-model-heavy').value,
    askBeforeAI: $('#set-ask-before-ai').checked, proactive: $('#set-proactive').checked, checkinHour: $('#set-checkin-hour').value || '19:00', voiceReply: $('#set-voice-reply').checked,
  };
  await saveSettings(s); state.settings = s; toast('Ajustes guardados');
}
async function refreshUsage() {
  const u = await usageToday();
  $('#usage-summary').textContent = `Créditos hoy: ${(u.today.input + u.today.output).toLocaleString('es')} tokens (~$${u.today.cost.toFixed(3)})`;
  const d = $('#usage-detail'); if (d) d.innerHTML = `Hoy: ${u.today.calls} llamadas · ${u.today.input.toLocaleString('es')} entrada / ${u.today.output.toLocaleString('es')} salida · ~$${u.today.cost.toFixed(3)}<br>Total: ${u.total.calls} llamadas · ~$${u.total.cost.toFixed(2)}`;
}

// ---------- Voz ----------
async function startVoice() {
  if (!voiceSupported) { toast('Tu navegador no soporta voz. Prueba Safari o Chrome.'); return; }
  const btn = $('#btn-voice');
  try {
    btn.classList.add('active'); setStatus('escuchando…', 'listening');
    const text = await listen({ onEnd: () => { btn.classList.remove('active'); setStatus('local'); } });
    if (text) { showView('inicio'); await handleInput(text, { fromVoice: true }); }
  } catch (err) { toast(err.message); }
  finally { btn.classList.remove('active'); setStatus('local'); }
}

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
    const del = e.target.closest('[data-del]');
    if (del) { reminders.remove(del.dataset.del).then(renderReminders); return; }
    const acc = e.target.closest('[data-accept]');
    if (acc) { reminders.all().then(async all => { const r = all.find(x => x.id === acc.dataset.accept); if (r) { r.suggested = false; await reminders.save(r); await requestNotifPermission(); renderReminders(); toast('Recordatorio activado'); } }); return; }
  });
  document.addEventListener('change', e => {
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
  $('#note-delete').onclick = async () => {
    if (!state.currentNote || !state.currentNote.id) { $('#note-panel').hidden = true; return; }
    if (!confirm('¿Eliminar esta nota?')) return;
    await notes.remove(state.currentNote.id); $('#note-panel').hidden = true; state.currentNote = null; await loadNotes(); toast('Nota eliminada');
  };
  $('#note-ai').onclick = async () => {
    await saveCurrentNote(); const n = state.currentNote; if (!n || !n.id) return;
    if (!state.settings.apiKey) { toast('Configura tu clave de Claude en Ajustes'); showView('ajustes'); return; }
    const r = await aiDialog(`Claude sobre “${n.title}”`, 'Resume esta nota en 5 puntos y crea 5 tarjetas de estudio en JSON al final.');
    if (!r || !r.prompt) return;
    toast('Pidiendo a Claude…');
    try {
      const res = await askAI({ tier: r.tier, prompt: r.prompt, context: `Nota “${n.title}” (${n.type}):\n\n${n.body}` });
      const made = parseCards(res.text);
      for (const c of made) await cards.save({ ...c, noteId: n.id });
      const clean = res.text.replace(/\[[\s\S]*\]$/, '').trim();
      $('#note-body').value = `${n.body}\n\n---\n✨ Claude (${res.model}):\n${clean}`;
      scheduleSave();
      toast(made.length ? `Listo. ${made.length} tarjetas añadidas a Estudio.` : 'Listo.');
    } catch (err) { toast(err.message, 5000); }
  };
  // Grafo
  $('#graph-filter').onchange = refreshGraph;
  $('#btn-graph-fit').onclick = () => state.graph.fit();
  window.addEventListener('resize', () => { if (state.view === 'grafo') state.graph.resize(); });
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
    $('#pf-name').value = p.name || ''; $('#pf-title').value = p.title || ''; $('#pf-bio').value = p.bio || '';
    $('#pf-links').value = (p.links || []).join(', '); $('#pf-goals').value = (p.goals || []).join(', ');
    $('#profile-form').hidden = false;
  };
  $('#pf-cancel').onclick = () => { $('#profile-form').hidden = true; };
  $('#profile-form').onsubmit = async e => {
    e.preventDefault();
    await kv.set('profile', { name: $('#pf-name').value.trim(), title: $('#pf-title').value.trim(), bio: $('#pf-bio').value.trim(), links: split($('#pf-links').value), goals: split($('#pf-goals').value) });
    $('#profile-form').hidden = true; renderProfile(); toast('Perfil guardado');
  };
  // Ajustes
  ['#set-apikey', '#set-model-light', '#set-model-heavy', '#set-ask-before-ai', '#set-proactive', '#set-checkin-hour', '#set-voice-reply'].forEach(s => $(s).onchange = persistSettings);
  // Sincronización
  $('#sync-enabled').onchange = async e => { const sc = await getSyncConfig(); await saveSyncConfig({ ...sc, enabled: e.target.checked }); renderSyncStatus(); if (e.target.checked) syncNow(); };
  $('#btn-sync-connect').onclick = async () => {
    const url = $('#sync-url').value.trim(), secret = $('#sync-secret').value;
    if (!url || !secret) { toast('Pon la dirección y la frase secreta'); return; }
    try {
      renderSyncStatus('Probando conexión…');
      await testConnection(url, secret);
      await saveSyncConfig({ url, secret, enabled: true }); $('#sync-enabled').checked = true;
      renderSyncStatus('Conectado. Sincronizando todo tu cerebro…');
      const r = await fullSync();
      if (r.error) throw new Error(r.error);
      await loadNotes(); renderSyncStatus(); toast(`Sincronizado: ${r.pushed} enviados, ${r.pulled} recibidos`);
    } catch (err) { renderSyncStatus('Error: ' + err.message); toast(err.message, 5000); }
  };
  $('#btn-sync-now').onclick = async () => { const r = await syncNow(); if (r.skipped) toast('Activa la sincronización primero'); else if (r.error) toast(r.error, 5000); else { await loadNotes(); toast(`Sincronizado: ${r.pushed} enviados, ${r.pulled} recibidos`); } renderSyncStatus(); };
  onSync(evt => {
    const badge = $('#sync-badge'); badge.hidden = false;
    badge.textContent = evt.state === 'syncing' ? '☁️…' : evt.state === 'error' ? '☁️!' : '☁️';
    badge.title = evt.state === 'error' ? evt.message : 'Sincronizado';
    if (evt.state === 'ok' && evt.pulled > 0) { loadNotes(); if (state.view === 'recordatorios') renderReminders(); if (state.view === 'estudio') renderStudy(); }
    if (state.view === 'ajustes') renderSyncStatus();
  });

  $('#btn-export').onclick = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `brainer-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast('Cerebro exportado');
  };
  $('#import-input').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { await importAll(JSON.parse(await f.text())); await loadNotes(); toast('Cerebro importado'); } catch (err) { toast(err.message, 5000); }
    e.target.value = '';
  };
  $('#btn-wipe').onclick = async () => { if (confirm('¿Borrar TODO tu cerebro de este dispositivo? Exporta antes si quieres conservarlo.')) { await wipeAll(); location.reload(); } };

  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && $('#view-' + v)) showView(v); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#note-panel').hidden) closeNote(); });
}
const split = s => s.split(',').map(x => x.trim()).filter(Boolean);

// ---------- Arranque ----------
async function init() {
  state.settings = await getSettings();
  state.graph = new BrainGraph($('#graph'), { onOpen: openNote });
  bind();
  await loadNotes();
  await suggestFromNotes();
  startTicker(fired => { for (const r of fired) { toast(`⏰ ${r.text}`, 6000); if (state.view === 'inicio') addMsg('brainer', `⏰ Te recuerdo: <b>${esc(r.text)}</b>`, { speakText: `Te recuerdo: ${r.text}` }); } });
  await refreshUsage();
  const v = location.hash.slice(1);
  showView(v && $('#view-' + v) ? v : 'inicio');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  // Sincronización automática (solo si está configurada)
  const sc = await getSyncConfig();
  if (sc.enabled) { syncNow({ silent: true }).then(() => loadNotes()); startAutoSync(60000); }
  // Ejemplo de bienvenida la primera vez
  if (!state.notes.length && !(await kv.get('welcomed'))) {
    await notes.save({ id: 'welcome', title: 'Bienvenido a Brainer', type: 'nota', body: 'Este es tu cerebro virtual. Todo se guarda en tu dispositivo.\n\n## Cómo usarlo\n- Crea notas y enlázalas con [[Bienvenido a Brainer]] para ver conexiones en el grafo.\n- Usa etiquetas con almohadilla para agrupar, por ejemplo #estudio\n- Pulsa el micrófono y di: “búscame la nota de bienvenida”.\n- Di “recuérdame repasar mañana a las 8”.\n\n## Estudio\n**Repetición espaciada**: Brainer te pregunta lo que aprendes justo antes de que lo olvides.\nTérmino: definición → así Brainer genera tarjetas automáticamente.\n\n#brainer #guia' });
    await kv.set('welcomed', true);
    await loadNotes();
  }
}
init();
