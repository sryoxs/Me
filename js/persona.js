// La personalidad de Brainer: conversa, saluda, tiene presencia y una voz al estilo Jarvis.
// Nada de esto usa la red: reglas, memoria local y la síntesis de voz del sistema.

import { normalize } from './search.js';
import { kv } from './store.js';

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const hour = () => new Date().getHours();
const momento = () => (hour() < 6 ? 'madrugada' : hour() < 12 ? 'mañana' : hour() < 19 ? 'tarde' : 'noche');

// ---------- Conversación ----------
// Devuelve { text, speak } o null si no es conversación.
export function converse(text, ctx = {}) {
  const t = normalize(text).trim();
  const name = ctx.name ? ctx.name.split(' ')[0] : '';
  const N = name ? `, ${name}` : '';
  const brief = ctx.brief || '';

  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|que tal|holi|hello|hi|brainer)\b/.test(t) || t === 'hola brainer') {
    const saludo = { madrugada: 'Buenas noches… o buenos días, según se mire', mañana: 'Buenos días', tarde: 'Buenas tardes', noche: 'Buenas noches' }[momento()];
    const lines = [`${saludo}${N}. Sistemas en línea.`, `${saludo}${N}. Aquí estoy.`, `${saludo}${N}. Todo operativo.`];
    const l = pick(lines);
    return { text: `${l}${brief ? ' ' + brief : ''} ¿Por dónde empezamos?`, speak: `${l} ¿Por dónde empezamos?` };
  }
  if (/(como estas|como te encuentras|como vas|que haces|todo bien|como andas)/.test(t)) {
    const l = pick([`Operativo al cien${N}. ${ctx.notes ? `Vigilo ${ctx.notes} notas y ${ctx.due || 0} tarjetas esperan repaso.` : 'Listo para lo que necesites.'}`, `Sin incidencias${N}. Tu bóveda está sincronizada y yo, atento.`, `Bien, gracias por preguntar${N}. Mejor cuando hay trabajo. ¿Qué toca?`]);
    return { text: l, speak: l };
  }
  if (/(quien eres|que eres|como te llamas|presentate|que puedes hacer|que sabes hacer|ayuda|que haces tu)/.test(t)) {
    const l = `Soy Brainer${N}, tu inteligencia personal. Recuerdo lo que guardas, lo conecto, te lo devuelvo cuando lo pides, te recuerdo lo importante y te ayudo a estudiar. Lo pesado se lo paso a Claude Code y el informe vuelve aquí.`;
    return { text: l + ' Prueba: “recuérdame…”, “guarda que…”, “qué tengo sobre…”, “investiga…”.', speak: l };
  }
  if (/^(gracias|muchas gracias|genial|perfecto|excelente|bien hecho|buen trabajo|te quiero|eres el mejor)/.test(t)) {
    const l = pick([`A tus órdenes${N}.`, `Para eso estoy${N}.`, `Cuando quieras${N}.`, `Un placer${N}.`]);
    return { text: l, speak: l };
  }
  if (/^(adios|hasta luego|chao|chau|nos vemos|me voy|buenas noches brainer|a dormir)/.test(t)) {
    const l = pick([`Hasta luego${N}. Seguiré atento a tus recordatorios.`, `Descansa${N}. Aquí estaré.`, `Nos vemos${N}. Dejo todo sincronizado.`]);
    return { text: l, speak: l };
  }
  if (/(que hora es|hora es|que dia es|que fecha es|en que dia estamos)/.test(t)) {
    const d = new Date();
    const l = `Son las ${d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} del ${d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}.`;
    return { text: l, speak: l };
  }
  if (/(estoy cansado|estoy agotado|no puedo mas|estoy estresado|me rindo|no quiero estudiar|estoy triste|mal dia)/.test(t)) {
    const l = pick([`Te entiendo${N}. Diez minutos de pausa y volvemos con una sola tarjeta. Nada más.`, `Respira${N}. Lo que has guardado hoy no se va a ninguna parte. Descansa y seguimos.`, `Hay días así${N}. Puedo ponerte un recordatorio suave para retomar luego, si quieres.`]);
    return { text: l, speak: l };
  }
  if (/(cuentame un chiste|dime un chiste|hazme reir|algo gracioso)/.test(t)) {
    const l = pick([`¿Por qué el libro de física estaba triste? Porque tenía demasiados problemas.`, `Le dije a mi red neuronal que descansara. Me respondió: “solo una época más”.`, `Un electrón entra a un bar. El camarero: “¿Qué le pongo?”. El electrón: “Da igual, no estoy seguro de dónde estoy”.`]);
    return { text: l, speak: l };
  }
  if (/(motivame|dame animos|necesito motivacion|una frase)/.test(t)) {
    const l = pick([`Lo que repasas hoy es lo que recuerdas en el examen${N}. Una tarjeta ahora vale por diez la víspera.`, `No hace falta que sea perfecto${N}. Hace falta que sea hoy.`, `Cada nota que guardas es una neurona más en Brainer${N}. Sigamos.`]);
    return { text: l, speak: l };
  }
  if (/^(si|no|vale|ok|okey|dale|claro|bueno)\.?$/.test(t)) {
    const l = pick([`Entendido${N}.`, `De acuerdo${N}.`, `Anotado.`]);
    return { text: l, speak: l };
  }
  return null;
}

// Frase de bienvenida al abrir la app (por voz, cuando el usuario ya interactuó).
export function welcomeLine(ctx = {}) {
  const N = ctx.name ? `, ${ctx.name.split(' ')[0]}` : '';
  const saludo = { madrugada: 'Buenas noches', mañana: 'Buenos días', tarde: 'Buenas tardes', noche: 'Buenas noches' }[momento()];
  const parts = [`${saludo}${N}.`];
  if (ctx.today) parts.push(`Tienes ${ctx.today} recordatorio${ctx.today > 1 ? 's' : ''} para hoy.`);
  if (ctx.due) parts.push(`${ctx.due} tarjeta${ctx.due > 1 ? 's' : ''} esperan repaso.`);
  if (ctx.reports) parts.push(`Claude Code dejó ${ctx.reports} informe${ctx.reports > 1 ? 's' : ''} nuevo${ctx.reports > 1 ? 's' : ''}.`);
  if (parts.length === 1) parts.push(momento() === 'noche' ? 'Buen momento para un repaso corto.' : 'Sistemas en línea.');
  return parts.join(' ');
}

// Presencia: comentarios espontáneos tras un rato de inactividad. Devuelve texto o null.
export async function idleThought(ctx = {}) {
  const mem = await kv.get('memory', {});
  const last = mem.lastIdleThought || 0;
  if (Date.now() - last < 25 * 60000) return null;
  const N = ctx.name ? `, ${ctx.name.split(' ')[0]}` : '';
  const options = [];
  if (ctx.due) options.push(`Sigues con ${ctx.due} tarjetas pendientes${N}. Con cinco minutos las bajamos.`);
  if (ctx.staleTitle) options.push(`Hace días que no tocas «${ctx.staleTitle}». ¿Sigue vivo o lo archivamos?`);
  if (momento() === 'noche' && hour() >= 23) options.push(`Es tarde${N}. Lo que guardes ahora lo repasamos mañana; ¿cerramos el día?`);
  if (momento() === 'mañana') options.push(`¿Cuál es la prioridad de hoy${N}? Dímela y la pongo arriba.`);
  if (ctx.minutesActive > 45) options.push(`Llevas ${Math.round(ctx.minutesActive)} minutos seguidos${N}. Una pausa corta mejora la retención.`);
  if (!options.length) return null;
  mem.lastIdleThought = Date.now(); await kv.set('memory', mem);
  return pick(options);
}

// ---------- Voz al estilo Jarvis ----------
let voicesCache = null;
export function listVoices() {
  if (!('speechSynthesis' in window)) return [];
  voicesCache = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang));
  return voicesCache;
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { voicesCache = null; };

function preferredVoice(name) {
  const voices = listVoices();
  if (name) { const v = voices.find(v => v.name === name); if (v) return v; }
  // Preferimos voces masculinas graves en español (Jorge, Diego, Enrique, Carlos, Google es-ES/es-US)
  return voices.find(v => /Jorge|Diego|Enrique|Carlos|Andrés|Andres|Juan|Reed|Rocko|Eddy/i.test(v.name))
    || voices.find(v => /Google/i.test(v.name)) || voices[0] || null;
}

export function speak(text, { voiceName, pitch = 0.82, rate = 1.0, onEnd } = {}) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const clean = text.replace(/[*_#\[\]`>]/g, '').replace(/\s+/g, ' ').slice(0, 500);
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'es-ES'; u.pitch = pitch; u.rate = rate;
  const v = preferredVoice(voiceName); if (v) { u.voice = v; u.lang = v.lang; }
  if (onEnd) u.onend = onEnd;
  speechSynthesis.speak(u);
}

// Tonos de interfaz (WebAudio): activar escucha, confirmación, error.
let actx = null;
function ac() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; }
export function tone(kind = 'listen') {
  try {
    const a = ac(); const now = a.currentTime;
    const notes = kind === 'listen' ? [[660, 0, 0.08], [990, 0.08, 0.12]] : kind === 'done' ? [[880, 0, 0.07], [1320, 0.07, 0.14]] : kind === 'error' ? [[330, 0, 0.12], [220, 0.12, 0.18]] : [[520, 0, 0.06]];
    for (const [f, t0, dur] of notes) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + t0); g.gain.exponentialRampToValueAtTime(0.08, now + t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      o.connect(g).connect(a.destination); o.start(now + t0); o.stop(now + t0 + dur + 0.02);
    }
  } catch (_) { /* sin audio */ }
}
