// Estudio: tarjetas de repaso generadas localmente (sin créditos) y repetición espaciada (SM-2 simplificado).

import { cards } from './store.js';

// Genera tarjetas a partir de una nota, sin IA:
//  - "Término: definición" o "Término - definición" → pregunta por el término
//  - Encabezados "## Tema" seguidos de texto → "¿Qué sabes sobre Tema?"
//  - Frases con **negrita** → hueco (cloze)
export function cardsFromNote(note) {
  const out = [];
  const lines = (note.body || '').split('\n').map(l => l.trim()).filter(Boolean);
  let heading = null, buffer = [];
  const flush = () => {
    if (heading && buffer.length) out.push({ q: `¿Qué sabes sobre “${heading}”?`, a: buffer.join(' ').slice(0, 400) });
    buffer = [];
  };
  for (const line of lines) {
    const h = line.match(/^#{1,4}\s+(.+)$/);
    if (h) { flush(); heading = h[1].trim(); continue; }
    const def = line.replace(/^[-*•]\s*/, '').match(/^([^:–\-]{2,60})\s*[:–-]\s+(.{6,})$/);
    if (def && !/^https?:/.test(def[1])) { out.push({ q: `¿Qué es “${def[1].trim()}”?`, a: def[2].trim() }); continue; }
    for (const m of line.matchAll(/\*\*([^*]{2,60})\*\*/g)) {
      out.push({ q: line.replace(m[0], '_____'), a: m[1] });
    }
    if (heading) buffer.push(line.replace(/\*\*/g, ''));
  }
  flush();
  // Sin estructura: una tarjeta general por la nota
  if (!out.length && (note.body || '').length > 80) {
    out.push({ q: `Resume con tus palabras: “${note.title}”`, a: (note.body || '').slice(0, 300) + '…' });
  }
  return dedupe(out).slice(0, 12).map(c => ({ ...c, noteId: note.id }));
}

function dedupe(list) {
  const seen = new Set();
  return list.filter(c => { const k = c.q.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

// grade: 0 = no la sabía, 1 = difícil, 2 = bien, 3 = fácil
export function schedule(card, grade) {
  let { interval = 0, ease = 2.5, reps = 0 } = card;
  if (grade === 0) { reps = 0; interval = 0; ease = Math.max(1.3, ease - 0.2); }
  else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
    if (grade === 1) { ease = Math.max(1.3, ease - 0.15); interval = Math.max(1, Math.round(interval * 0.6)); }
    if (grade === 3) ease += 0.15;
  }
  const dueMs = grade === 0 ? Date.now() + 10 * 60000 : Date.now() + interval * 86400000;
  return { ...card, interval, ease, reps, due: dueMs };
}

export async function dueCards() {
  const all = await cards.all();
  const now = Date.now();
  return all.filter(c => c.due <= now).sort((a, b) => a.due - b.due);
}

export async function stats() {
  const all = await cards.all();
  const now = Date.now();
  const due = all.filter(c => c.due <= now).length;
  const learned = all.filter(c => c.reps >= 3).length;
  const tomorrow = all.filter(c => c.due > now && c.due <= now + 86400000).length;
  return { total: all.length, due, learned, tomorrow };
}
