// Neuro: el clasificador de Brainer. No escribe respuestas; decide el nivel.
//   Nivel 1 — reglas + datos guardados. Instantáneo, gratis.
//   Nivel 2 — redes neuronales locales (búsqueda semántica, resumen extractivo). Gratis.
//   Nivel 3 — trabajo real: petición a Claude Code, el informe llega a la bóveda.

import { parseIntent, normalize } from './search.js';

const SKILL_HINTS = [
  { skill: 'proyecto', re: /(armame|arma|construye|construyeme|creame|hazme|desarrolla|programa|programame|montame|monta|arranca el proyecto|sigue con el proyecto)\s+(una|un|la|el|mi)?\s*(app|aplicacion|web|pagina|sitio|bot|script|herramienta|juego|api|proyecto|sistema|dashboard|landing|tienda)?/ },
  { skill: 'procesar-inbox', re: /(procesa|afila|limpia|vacia)\s+(mi\s+|el\s+|las\s+)?(inbox|bandeja|capturas)/ },
  { skill: 'conexiones-semana', re: /(sesion de conexiones|conexiones (de la semana|de hoy|del dia)|que se conecto|encuentra (las )?conexiones)/ },
  { skill: 'examinar', re: /(examiname|examen de|preguntame sobre|califica mis|resume el tema|que me falta para)/ },
  { skill: 'escribir', re: /(escribe (este|el) brief|produce (el contenido|la pieza)|ya escribe la pieza)/ },
  { skill: 'brief', re: /(haz un brief|genera el brief|brief de|ya esta para escribirse)/ },
  { skill: 'parte-del-dia', re: /(mi parte|parte del dia|planifica (el|mi) dia|preparame la manana|resumen del correo|correo|gmail|agenda de hoy)/ },
];

const HEAVY = /(investiga|a fondo|profund|completo|detallado|redacta|escribe (un|una) (ensayo|informe|articulo)|analiza|compara|planifica (mi|el) (mes|semestre|curso)|traduce|corrige|explica(me)? (bien|paso a paso)|resuelve|demuestra|calcula)/;

// Lección guiada: «voy a estudiar elipses», «enséñame derivadas», «clase de fotosíntesis»
const LESSON = /^(?:brainer[, ]*)?(?:hoy\s+)?(?:voy a estudiar|quiero estudiar|vamos a estudiar|estudiemos|estudiar|ensename|enseñame|explica(?:me)? bien|dame una (?:clase|leccion) (?:de|sobre)|(?:una )?(?:clase|leccion) (?:de|sobre)|quiero aprender|aprender|explicame|repasemos|repasar)\s+(?:el tema de |la |el |los |las |sobre |de )?(.{3,80}?)(?:\s+(?:paso a paso|bien|a fondo|desde cero|con ejemplos|con ejercicios))*[.!?]*$/;
// ¿Está listo mi trabajo? → estado de las peticiones y lectura del último informe
const STATUS = /(esta listo|ya esta (listo|hecho|mi|el)|ya termin|termino|terminaron|como va|como van|hay novedades|que hay de nuevo|llego (el|mi|algun) informe|mi trabajo|mis peticiones|que hicieron|que hizo|resultado de|novedades)/;
// Nivel de esfuerzo para el trabajo en la nube: bajo (rápido y barato), medio, alto (a fondo, con más modelo)
export function parseEffort(t) {
  if (/(esfuerzo|nivel|modo)\s+(alto|maximo|profundo)|a fondo|profund|exhaustiv|detallad|completo|con calma|sin prisa|de alta calidad/.test(t)) return 'alto';
  if (/(esfuerzo|nivel|modo)\s+(bajo|minimo|rapido)|rapido|rapidito|breve|corto|ligero|barato|sin gastar/.test(t)) return 'bajo';
  return 'medio';
}
export const EFFORT_LABEL = { bajo: 'esfuerzo bajo', medio: 'esfuerzo medio', alto: 'esfuerzo alto' };

// Devuelve { tier: 0|1|2|3, intent, reason, skill?, prompt?, effort?, topic? }
export function route(text, { hasSemantic = false } = {}) {
  const t = normalize(text);
  const intent = parseIntent(text);

  // Estado del trabajo en la nube
  if (STATUS.test(t) && t.split(' ').length <= 12 && !/recuerdame|crea/.test(t)) return { tier: 1, intent: { intent: 'status' }, reason: 'estado de tus peticiones' };
  // Lección guiada (videos, fórmulas, ejercicio, gráfica, fuentes)
  const lm = LESSON.exec(t);
  if (lm) return { tier: 2, intent: { intent: 'lesson' }, topic: lm[1].trim(), reason: 'lección guiada con tu nube' };

  // Habilidades explícitas → Nivel 3 con la habilidad adecuada
  for (const h of SKILL_HINTS) {
    if (h.re.test(t)) return { tier: 3, intent: { intent: 'skill' }, skill: h.skill, prompt: text, effort: parseEffort(t), reason: `pide la habilidad “${h.skill}”` };
  }
  // Acciones locales claras → Nivel 1
  if (['reminder', 'create', 'study', 'graph', 'brief'].includes(intent.intent)) {
    return { tier: 1, intent, reason: 'regla local: ' + ({ reminder: 'recordatorio', create: 'crear nota', study: 'repaso', graph: 'grafo', brief: 'resumen del día' })[intent.intent] };
  }
  // Trabajo pesado → Nivel 3 (investigación genérica)
  if (HEAVY.test(t) && t.split(' ').length >= 3) {
    return { tier: 3, intent: { intent: 'skill' }, skill: 'examinar', prompt: 'resume el tema: ' + text, effort: parseEffort(t), reason: 'trabajo exigente: lo hace Claude Code' };
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
