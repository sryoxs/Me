// Recordatorios y comportamiento proactivo de Brainer (todo local, sin créditos).

import { reminders, notes, kv, getSettings } from './store.js';
import { stats as studyStats } from './study.js';

export async function requestNotifPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' }))
          .catch(() => new Notification(title, { body }));
      } else {
        new Notification(title, { body });
      }
    } catch (_) { /* algunos navegadores no permiten Notification directo */ }
  }
}

// Revisa recordatorios vencidos. Devuelve los que acaban de vencer para mostrarlos en la app.
export async function checkDue() {
  const all = await reminders.all();
  const now = Date.now();
  const fired = [];
  for (const r of all) {
    if (!r.done && !r.notified && !r.suggested && r.when <= now) {
      notify('Brainer te recuerda', r.text);
      r.notified = true;
      await reminders.save(r);
      fired.push(r);
    }
  }
  return fired;
}

// Programa un chequeo cada 30 s mientras la app está abierta.
export function startTicker(onFired) {
  const run = async () => {
    const fired = await checkDue();
    if (fired.length && onFired) onFired(fired);
  };
  run();
  return setInterval(run, 30000);
}

// Detecta fechas en las notas de tipo tarea/informe y propone recordatorios sin que se lo pidan.
// Ej: "entregar el 30 de septiembre", "examen 12/10", "para el viernes".
const MONTHS = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };

export function datesInText(text) {
  const out = [];
  const now = new Date();
  for (const m of (text || '').matchAll(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/gi)) {
    const d = new Date(m[3] ? parseInt(m[3], 10) : now.getFullYear(), MONTHS[m[2].toLowerCase()], parseInt(m[1], 10), 9, 0, 0);
    if (!m[3] && d < now) d.setFullYear(d.getFullYear() + 1);
    out.push({ when: d.getTime(), match: m[0] });
  }
  for (const m of (text || '').matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10)) : now.getFullYear();
    const d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10), 9, 0, 0);
    if (isNaN(d)) continue;
    if (!m[3] && d < now) d.setFullYear(d.getFullYear() + 1);
    out.push({ when: d.getTime(), match: m[0] });
  }
  return out.filter(x => x.when > now.getTime());
}

export async function suggestFromNotes() {
  const s = await getSettings();
  if (!s.proactive) return [];
  const [all, existing] = await Promise.all([notes.all(), reminders.all()]);
  const known = new Set(existing.map(r => r.sourceKey));
  const created = [];
  for (const n of all) {
    if (!['tarea', 'informe'].includes(n.type)) continue;
    for (const d of datesInText(`${n.title}\n${n.body}`)) {
      const key = `${n.id}:${d.when}`;
      if (known.has(key)) continue;
      // Avisar el día anterior a las 18:00
      const when = new Date(d.when); when.setDate(when.getDate() - 1); when.setHours(18, 0, 0, 0);
      const r = await reminders.save({ text: `Mañana: ${n.title} (${d.match})`, when: when.getTime(), suggested: true, sourceKey: key, noteId: n.id });
      known.add(key);
      created.push(r);
    }
  }
  return created;
}

// Resumen del día: qué toca hoy, qué repasar, qué preguntas hacer.
export async function dailyBrief() {
  const [rems, st, allNotes, mem, s] = await Promise.all([reminders.all(), studyStats(), notes.all(), kv.get('memory', {}), getSettings()]);
  const now = new Date();
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const today = rems.filter(r => !r.done && !r.suggested && r.when <= endOfDay.getTime()).sort((a, b) => a.when - b.when);
  const suggested = rems.filter(r => !r.done && r.suggested);
  const tasks = allNotes.filter(n => n.type === 'tarea' && !(n.tags || []).includes('hecha'));
  const stale = allNotes.filter(n => Date.now() - n.updated > 7 * 86400000 && n.type !== 'tarea').length;

  const lines = [];
  if (today.length) lines.push(`Tienes ${today.length} recordatorio${today.length > 1 ? 's' : ''} para hoy.`);
  if (st.due) lines.push(`${st.due} tarjeta${st.due > 1 ? 's' : ''} de repaso te esperan.`);
  if (tasks.length) lines.push(`${tasks.length} tarea${tasks.length > 1 ? 's' : ''} pendiente${tasks.length > 1 ? 's' : ''}.`);
  if (!lines.length) lines.push(allNotes.length ? 'Día despejado. Buen momento para repasar o anotar ideas.' : 'Empieza guardando tu primera nota o dictándome algo.');

  // Preguntas proactivas sobre estudios
  const questions = [];
  const lastCheckin = mem.lastCheckin || 0;
  const [hh, mm] = (s.checkinHour || '19:00').split(':').map(Number);
  const checkinToday = new Date(now); checkinToday.setHours(hh, mm, 0, 0);
  if (s.proactive && now >= checkinToday && lastCheckin < checkinToday.getTime()) {
    questions.push('¿Qué estudiaste hoy? Cuéntamelo y lo guardo en tu cerebro.');
  }
  if (s.proactive && stale > 3) questions.push(`Hay ${stale} notas que no tocas hace más de una semana. ¿Quieres que te pregunte sobre alguna?`);
  const subjects = topTags(allNotes, 3);
  if (s.proactive && subjects.length && Math.random() < 0.5) questions.push(`¿Cómo vas con ${subjects[Math.floor(Math.random() * subjects.length)].replace(/^#/, '')}? ¿Hay algo que se te complique?`);

  return { text: lines.join(' '), today, suggested, tasks, study: st, questions, subjects };
}

export function topTags(list, n = 5) {
  const count = {};
  for (const note of list) for (const t of note.tags || []) count[t] = (count[t] || 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => '#' + t);
}
