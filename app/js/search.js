// Búsqueda local, sin créditos. Tolerante a acentos, mayúsculas y palabras parciales.

const STOP = new Set('el la los las un una unos unas de del al a en y o que me mi mis te le lo se su sus por para con sin sobre es son fue hace dias día días semana pasada pasado ayer hoy busca buscame búscame muestrame muéstrame enseñame enséñame ver vea abre abreme ábreme dame quiero necesito informe nota documento archivo tarea idea sobre acerca'.split(' '));

export function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s#]/gu, ' ');
}

export function tokens(s, { keepStop = false } = {}) {
  return normalize(s).split(/\s+/).filter(t => t && t.length > 1 && (keepStop || !STOP.has(t)));
}

// Devuelve las notas ordenadas por relevancia. Cada resultado: { note, score, snippet }
export function search(notesList, query, { limit = 10, type = null } = {}) {
  const q = tokens(query);
  const qTags = [...(query || '').matchAll(/#([\p{L}\p{N}_-]+)/gu)].map(m => normalize(m[1]).trim());
  if (!q.length && !qTags.length) return [];
  const out = [];
  for (const note of notesList) {
    if (type && note.type !== type) continue;
    const title = normalize(note.title);
    const body = normalize(note.body);
    const tags = (note.tags || []).map(normalize);
    let score = 0;
    for (const t of q) {
      if (title === t) score += 12;
      else if (title.split(/\s+/).includes(t)) score += 8;
      else if (title.includes(t)) score += 5;
      if (tags.includes(t)) score += 6;
      const bodyHits = countOccurrences(body, t);
      score += Math.min(bodyHits, 5) * 1.5;
      // Coincidencia parcial (prefijo) para palabras largas: "termodin" ~ "termodinamica"
      if (t.length >= 5 && !body.includes(t)) {
        const prefix = t.slice(0, Math.max(4, t.length - 2));
        if (title.includes(prefix) || body.includes(prefix)) score += 1.5;
      }
    }
    for (const tg of qTags) if (tags.includes(tg)) score += 10;
    // Las notas recientes empatan hacia arriba
    if (score > 0) {
      const ageDays = (Date.now() - (note.updated || 0)) / 86400000;
      score += Math.max(0, 2 - ageDays / 15);
      out.push({ note, score, snippet: snippet(note.body, q) });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

function countOccurrences(hay, needle) {
  if (!needle) return 0;
  let n = 0, i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}

export function snippet(body, q, len = 140) {
  const norm = normalize(body);
  let idx = -1;
  for (const t of q) { idx = norm.indexOf(t); if (idx !== -1) break; }
  if (idx === -1) return (body || '').slice(0, len).replace(/\s+/g, ' ') + ((body || '').length > len ? '…' : '');
  const start = Math.max(0, idx - 40);
  return (start > 0 ? '…' : '') + (body || '').slice(start, start + len).replace(/\s+/g, ' ') + '…';
}

// Interpreta lo que el usuario pide (por texto o por voz). Devuelve { intent, ...datos }.
export function parseIntent(text) {
  const raw = (text || '').trim();
  const t = normalize(raw);

  // Recordatorio: "recuérdame X a las 7", "recordatorio mañana a las 8 estudiar"
  if (/^(recuerdame|recordame|recordatorio|ponme un recordatorio|avisame|recuerda)/.test(t) || /\brecuerdame\b/.test(t)) {
    const when = parseWhen(raw);
    let what = raw.replace(/^(recu[eé]rdame|record[aá]me|recordatorio|ponme un recordatorio|av[ií]same|recuerda)\s*(de|que|para)?\s*/i, '');
    what = stripWhen(what);
    return { intent: 'reminder', text: what || raw, when };
  }
  // Crear nota: "crea una nota sobre X", "anota que…", "guarda esto: …", "nueva idea: …"
  const nm = raw.match(/^(crea|crear|nueva|nuevo|anota|guarda|apunta)\s+(una\s+|un\s+)?(nota|idea|tarea|informe)?\s*(sobre|de|que|:)?\s*(.*)$/i);
  if (nm) {
    const type = (nm[3] || 'nota').toLowerCase();
    return { intent: 'create', type, text: nm[5] || '' };
  }
  // Estudio: "repasar", "quiero estudiar", "pregúntame"
  if (/(repas|estudi|preguntame|quiz|examen|tarjetas)/.test(t) && !/(busca|muestra|ensena|informe)/.test(t)) return { intent: 'study' };
  // Grafo: "muéstrame mi cerebro", "ver bóveda gráficamente", "grafo"
  if (/(cerebro|grafo|nodos|boveda grafic|mapa mental|red de notas)/.test(t)) return { intent: 'graph' };
  // Resumen del día / pendientes
  if (/(que tengo|pendientes|mi dia|agenda|que hay hoy|resumen del dia)/.test(t)) return { intent: 'brief' };
  // Búsqueda: "búscame el informe de X", "muéstrame lo que guardé sobre X", "ver informe X"
  if (/^(busca|buscame|muestrame|ensename|abre|abreme|encuentra|ver|dame|donde esta|donde tengo|que tengo sobre|que guarde)/.test(t) || /(informe|nota|documento|archivo|guarde|mande|envie)/.test(t)) {
    let type = null;
    if (/\binforme/.test(t)) type = 'informe';
    else if (/\btarea/.test(t)) type = 'tarea';
    else if (/\bidea/.test(t)) type = 'idea';
    return { intent: 'search', query: raw, type };
  }
  // Pregunta abierta → búsqueda + posible IA
  return { intent: 'search', query: raw, type: null, fallbackAI: true };
}

// Fecha/hora en español: "mañana a las 7", "hoy a las 19:30", "el viernes a las 5 de la tarde", "en 20 minutos"
export function parseWhen(text) {
  const t = normalize(text);
  const now = new Date();
  let d = new Date(now);
  let hasDay = false, hasTime = false;

  const rel = t.match(/en (\d+)\s*(minuto|min|hora|dia)/);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const ms = rel[2].startsWith('min') ? n * 60000 : rel[2].startsWith('hora') ? n * 3600000 : n * 86400000;
    return new Date(now.getTime() + ms).getTime();
  }
  if (/\bmanana\b/.test(t) && !/\bde la manana\b|\bpor la manana\b|\ben la manana\b/.test(t.replace(/manana a las/, 'X'))) { d.setDate(d.getDate() + 1); hasDay = true; }
  else if (/\bpasado manana\b/.test(t)) { d.setDate(d.getDate() + 2); hasDay = true; }
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  for (let i = 0; i < 7; i++) {
    if (new RegExp(`\\b${days[i]}\\b`).test(t)) {
      let diff = (i - now.getDay() + 7) % 7; if (diff === 0) diff = 7;
      d.setDate(now.getDate() + diff); hasDay = true; break;
    }
  }
  const tm = t.match(/a las?\s+(\d{1,2})(?::(\d{2}))?\s*(de la manana|de la tarde|de la noche|am|pm|h)?/);
  if (tm) {
    let h = parseInt(tm[1], 10); const m = tm[2] ? parseInt(tm[2], 10) : 0;
    const mod = tm[3] || '';
    if (/tarde|noche|pm/.test(mod) && h < 12) h += 12;
    if (/manana|am/.test(mod) && h === 12) h = 0;
    if (!mod && h <= 7 && !hasDay) h += 12; // "a las 5" sin más, por la tarde
    d.setHours(h, m, 0, 0); hasTime = true;
  }
  if (!hasDay && !hasTime) return null;
  if (!hasTime) d.setHours(9, 0, 0, 0);
  if (hasTime && !hasDay && d.getTime() < now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

function stripWhen(text) {
  return text
    .replace(/\b(mañana|pasado mañana|hoy|esta noche|esta tarde)\b/gi, '')
    .replace(/\b(el\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi, '')
    .replace(/\ba las?\s+\d{1,2}(:\d{2})?\s*(de la mañana|de la tarde|de la noche|am|pm|h)?/gi, '')
    .replace(/\ben \d+\s*(minutos?|min|horas?|d[ií]as?)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
}
