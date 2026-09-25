// Neuro: el clasificador de Brainer. No escribe respuestas; decide el nivel.
//   Nivel 1 — reglas + datos guardados. Instantáneo, gratis.
//   Nivel 2 — redes neuronales locales (búsqueda semántica, resumen extractivo). Gratis.
//   Nivel 3 — trabajo real: petición a Claude Code, el informe llega a la bóveda.

import { parseIntent, normalize } from './search.js';

const SKILL_HINTS = [
  { skill: 'proyecto', re: /(arranca el proyecto|sigue con el proyecto|(armame|arma|construye|construyeme|creame|crea|hazme|haz|desarrolla|desarrollame|programa|programame|montame|monta|codea|codeame)\s+(una |un |la |el |mi )?(app|aplicacion|web|pagina web|sitio|bot|script|herramienta|juego|api|proyecto|sistema|dashboard|landing|tienda|programa|codigo|extension|plugin))/ },
  { skill: 'procesar-inbox', re: /(procesa|afila|limpia|vacia)\s+(mi\s+|el\s+|las\s+)?(inbox|bandeja|capturas)/ },
  { skill: 'conexiones-semana', re: /(sesion de conexiones|conexiones (de la semana|de hoy|del dia)|que se conecto|encuentra (las )?conexiones)/ },
  { skill: 'examinar', re: /(examiname|examen de|preguntame sobre|califica mis|resume el tema|que me falta para)/ },
  { skill: 'escribir', re: /(escribe (este|el) brief|produce (el contenido|la pieza)|ya escribe la pieza)/ },
  { skill: 'brief', re: /(haz un brief|genera el brief|brief de|ya esta para escribirse)/ },
  { skill: 'parte-del-dia', re: /(mi parte|parte del dia|planifica (el|mi) dia|preparame la manana|resumen del correo|correo|gmail|agenda de hoy)/ },
];

// Escritura e investigación: las resuelve Brainer con su IA gratuita y fuentes de la web (sin créditos).
const WRITE = /(investiga|busca(me)? (informacion|info|datos|fuentes)|informate|informe|reporte|ensayo|articulo|monografia|resumen de|resumeme|resume|redacta|redactame|escribe(me)?|escribeme|carta|correo para|mensaje para|post|guion|analiza|compara|traduce|traduceme|corrige|corrigeme|mejora (este|mi|el) texto|resuelve|resuelveme|calcula|demuestra|planifica (mi|el) (mes|semestre|curso|semana))/;
// Trabajo pesado de verdad (código, apps, repositorios) o pedido explícito de Claude: aquí sí se gastan créditos.
const CREDITS = /(con claude|claude code|usa (tus |los )?creditos|con creditos|modo pesado)/;

// Lección guiada: «voy a estudiar elipses», «hoy quiero estudiar parábola, dame fórmulas y ejemplos»,
// «hazme una lección de derivadas», «enséñame la fotosíntesis paso a paso». No exige que la frase empiece así.
const LESSON_KEY = /(?:voy a estudiar|quiero estudiar|vamos a estudiar|toca estudiar|tengo que estudiar|debo estudiar|estudiemos|estudiar|estudiando|quiero aprender|aprender|ensename|enseñame|explicame|repasemos|repasar|(?:dame|hazme|quiero|necesito|armame|arma|prepara(?:me)?|genera(?:me)?|crea(?:me)?)\s+(?:una\s+|la\s+|un\s+|el\s+)?(?:leccion|clase|lecion|tutorial|guia|resumen de estudio)|(?:^|\s)(?:leccion|clase|tutorial)\s+(?:de|sobre|del|acerca de)|tema de hoy(?: es)?)\s+(.+)$/;
const LESSON_STOP = /\s*(?:[,;:.!?]|\b(?:y\s+(?:dame|muestrame|quiero|necesito|explicame|que|con)|dame|muestrame|quiero que|necesito que|con (?:formulas|ejemplos|graficas|ejercicios)|paso a paso|bien|a fondo|desde cero|por favor|porfa|xfa|brainer|ayudame|ayuda|please)\b).*$/;
const LEAD = /^(?:bien |por favor |porfa |brainer |el tema de |la |el |los |las |sobre |de |del |acerca de |un poco de |algo de |a )+/;
export function lessonTopic(t) {
  const m = LESSON_KEY.exec(t); if (!m) return null;
  let topic = m[1].replace(LEAD, '').replace(LESSON_STOP, '').replace(LEAD, '').trim();
  topic = topic.replace(/\s+(?:hoy|ahora|mañana|manana)$/, '').trim();
  if (topic.length < 3 || topic.length > 70 || /^(?:que|como|cuando|donde|hoy|ahora|algo|esto|eso)$/.test(topic)) return null;
  return topic;
}
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
  // Lección guiada (videos, fórmulas, ejercicio, gráfica, fuentes); un recordatorio con «estudiar» sigue siendo recordatorio
  const topic = intent.intent === 'reminder' ? null : lessonTopic(t);
  if (topic) return { tier: 2, intent: { intent: 'lesson' }, topic, reason: 'lección guiada con tu nube' };

  // Habilidades explícitas → Nivel 3 con la habilidad adecuada
  for (const h of SKILL_HINTS) {
    if (h.re.test(t)) return { tier: 3, intent: { intent: 'skill' }, skill: h.skill, prompt: text, effort: parseEffort(t), reason: `pide la habilidad “${h.skill}”` };
  }
  // Acciones locales claras → Nivel 1
  if (['reminder', 'create', 'study', 'graph', 'brief'].includes(intent.intent)) {
    return { tier: 1, intent, reason: 'regla local: ' + ({ reminder: 'recordatorio', create: 'crear nota', study: 'repaso', graph: 'grafo', brief: 'resumen del día' })[intent.intent] };
  }
  // Pedido explícito de créditos → Claude Code
  if (CREDITS.test(t)) return { tier: 3, intent: { intent: 'skill' }, skill: 'examinar', prompt: text, effort: 'alto', reason: 'pediste Claude Code' };
  // Redactar, investigar, informes, resolver → Brainer lo hace en tu nube, gratis
  if (WRITE.test(t) && t.split(' ').length >= 3) return { tier: 2, intent: { intent: 'write' }, reason: 'redacción e investigación en tu nube' };
  // Búsqueda: Nivel 2 si hay red neuronal semántica lista, si no Nivel 1 por palabras
  if (intent.intent === 'search') {
    const question = /^(que|como|por que|cuando|donde|quien|cual|explica|resume|resumen)/.test(t) || t.endsWith('?');
    if (hasSemantic) return { tier: 2, intent: { ...intent, question }, reason: 'búsqueda semántica local' };
    return { tier: 1, intent: { ...intent, question }, reason: 'búsqueda por palabras en tu bóveda' };
  }
  return { tier: 1, intent, reason: 'regla local' };
}

export const TIER_LABEL = { 0: 'Conversación', 1: 'Nivel 1 · instantáneo', 2: 'Nivel 2 · red neuronal local', 3: 'Nivel 3 · Claude Code' };
