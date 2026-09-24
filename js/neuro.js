// Neuro: el clasificador de Brainer. No escribe respuestas; decide el nivel.
//   Nivel 1 — reglas + datos guardados. Instantáneo, gratis.
//   Nivel 2 — redes neuronales locales (búsqueda semántica, resumen extractivo). Gratis.
//   Nivel 3 — trabajo real: petición a Claude Code, el informe llega a la bóveda.

import { parseIntent, normalize } from './search.js';

const SKILL_HINTS = [
  { skill: 'resumen-correo', re: /(correo|gmail|email|bandeja|mails?)/ },
  { skill: 'noticias-ia', re: /(noticias|novedades|actualidad).*(ia|inteligencia artificial)|(ia|inteligencia artificial).*(hoy|noticias)/ },
  { skill: 'revision-semanal', re: /(revision|repaso|balance|resumen).*(semana|semanal)|como (fue|me fue) (la|mi) semana/ },
  { skill: 'resumen-diario', re: /(resumen|repaso) (del|de mi|de hoy|diario)/ },
  { skill: 'investigacion', re: /(investiga|investigacion|informe (completo|profundo|detallado)|explicame a fondo|estudio profundo|a fondo|documentate)/ },
];

const HEAVY = /(investiga|a fondo|profund|completo|detallado|redacta|escribe (un|una) (ensayo|informe|articulo)|analiza|compara|planifica (mi|el) (mes|semestre|curso)|traduce|corrige|explica(me)? (bien|paso a paso)|resuelve|demuestra|calcula)/;

// Devuelve { tier: 1|2|3, intent, reason, skill?, prompt? }
export function route(text, { hasSemantic = false } = {}) {
  const t = normalize(text);
  const intent = parseIntent(text);

  // Habilidades explícitas → Nivel 3 con la habilidad adecuada
  for (const h of SKILL_HINTS) {
    if (h.re.test(t)) return { tier: 3, intent: { intent: 'skill' }, skill: h.skill, prompt: text, reason: `pide la habilidad “${h.skill}”` };
  }
  // Acciones locales claras → Nivel 1
  if (['reminder', 'create', 'study', 'graph', 'brief'].includes(intent.intent)) {
    return { tier: 1, intent, reason: 'regla local: ' + ({ reminder: 'recordatorio', create: 'crear nota', study: 'repaso', graph: 'grafo', brief: 'resumen del día' })[intent.intent] };
  }
  // Trabajo pesado → Nivel 3 (investigación genérica)
  if (HEAVY.test(t) && t.split(' ').length >= 3) {
    return { tier: 3, intent: { intent: 'skill' }, skill: 'investigacion', prompt: text, reason: 'trabajo exigente: lo hace Claude Code' };
  }
  // Búsqueda: Nivel 2 si hay red neuronal semántica lista, si no Nivel 1 por palabras
  if (intent.intent === 'search') {
    const question = /^(que|como|por que|cuando|donde|quien|cual|explica|resume|resumen)/.test(t) || t.endsWith('?');
    if (hasSemantic) return { tier: 2, intent: { ...intent, question }, reason: 'búsqueda semántica local' };
    return { tier: 1, intent: { ...intent, question }, reason: 'búsqueda por palabras en tu bóveda' };
  }
  return { tier: 1, intent, reason: 'regla local' };
}

export const TIER_LABEL = { 0: 'Conversación', 1: 'Nivel 1 · instantáneo', 2: 'Nivel 2 · red neuronal local', 3: 'Nivel 3 · Claude Code' };
