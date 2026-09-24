// Demo: un cerebro de ejemplo para ver Brainer funcionando en un clic.
import { notes, reminders, cards, requests, kv } from './store.js';

const D = 86400000;
const ago = d => Date.now() - d * D;

const NOTAS = [
  { id: 'demo-termo', type: 'informe', title: 'Termodinámica', created: ago(6), body: `## Leyes de la termodinámica

**Primera ley**: la energía no se crea ni se destruye, solo se transforma.
**Segunda ley**: la **entropía** de un sistema aislado siempre aumenta.
Entropía: medida del desorden de un sistema.
Entalpía: energía total de un sistema a presión constante.

Se conecta con [[Máquinas térmicas]] y con lo que vimos en [[Física cuántica]].

Entregar el informe final el 30 de octubre.

#fisica #estudio #informe` },
  { id: 'demo-maquinas', type: 'nota', title: 'Máquinas térmicas', created: ago(5), body: `## Ciclo de Carnot

Es el ciclo **ideal** de máxima eficiencia entre dos temperaturas.
Eficiencia: 1 − (T fría / T caliente), con temperaturas en kelvin.

Ejemplo: motor de un coche, nevera (al revés). Base teórica en [[Termodinámica]].

#fisica #estudio` },
  { id: 'demo-cuantica', type: 'nota', title: 'Física cuántica', created: ago(4), body: `## Ideas clave

Superposición: una partícula puede estar en varios estados a la vez hasta medirla.
Entrelazamiento: dos partículas comparten estado aunque estén lejos.
**Principio de incertidumbre**: no se puede conocer con precisión posición y velocidad a la vez.

Relación con la energía en [[Termodinámica]].

#fisica #estudio` },
  { id: 'demo-ensayo', type: 'tarea', title: 'Ensayo de historia: la Revolución francesa', created: ago(2), body: `Entregar el ensayo el 15 de noviembre.

- [ ] Leer capítulos 3 y 4
- [ ] Esquema de causas y consecuencias
- [ ] Redactar 1500 palabras

Apoyo en [[Revolución francesa]].

#historia #tarea` },
  { id: 'demo-revfr', type: 'nota', title: 'Revolución francesa', created: ago(2), body: `## Cronología

1789: toma de la **Bastilla** y Declaración de los Derechos del Hombre.
1793: ejecución de Luis XVI; comienza el **Terror**.
1799: golpe de **Napoleón**, fin de la revolución.

Causas: crisis económica, desigualdad de los estamentos, ideas de la Ilustración.

#historia #estudio` },
  { id: 'demo-app', type: 'idea', title: 'App de recetas con IA', created: ago(3), body: `Una app que sugiere recetas con lo que hay en la nevera, con lista de compras automática.

Primer paso: prototipo web en una semana. Podría usar el mismo enfoque local-primero de [[Brainer]].

#proyecto #ideas` },
  { id: 'demo-brainer', type: 'nota', title: 'Brainer', created: ago(1), body: `Mi cerebro virtual: bóveda de notas, grafo neuronal, voz local y Claude Code como motor.

Cinco piezas, un sistema: motor, memoria, oídos y boca, clasificador (Neuro) y cara (Cabina).

#proyecto #brainer` },
  { id: 'demo-informe', type: 'informe', title: 'Investigación · Fotosíntesis · 23 sept', created: ago(1), body: `## En una frase
La **fotosíntesis** convierte luz, agua y CO₂ en glucosa y oxígeno dentro de los **cloroplastos**.

## Lo esencial
- Clorofila: pigmento que capta la luz, sobre todo roja y azul.
- Fase luminosa: ocurre en los **tilacoides**; produce ATP y NADPH y libera O₂.
- Ciclo de Calvin: fase oscura en el **estroma**; fija el CO₂ en glucosa.
- Ecuación: 6 CO₂ + 6 H₂O + luz → C₆H₁₂O₆ + 6 O₂.
- Factores limitantes: luz, CO₂, temperatura y agua.

## Cómo se conecta con lo que ya sabes
La energía que almacena la glucosa obedece la primera ley de la [[Termodinámica]].

## Dudas frecuentes
¿Las plantas respiran?: sí, de día y de noche; la fotosíntesis solo de día.
¿Por qué son verdes?: la clorofila refleja la luz verde.

## Fuentes
- Campbell, Biología (cap. 10) · Khan Academy: Fotosíntesis

## Siguiente paso
Repasa las 3 tarjetas que Brainer creó de este informe y dibuja el cloroplasto de memoria.

#informe #claude #investigacion #biologia` },
];

export async function loadDemo() {
  for (const n of NOTAS) {
    await notes.save({ ...n, updated: n.created, tagText: '' });
  }
  const t = new Date(); t.setHours(t.getHours() + 3, 0, 0, 0);
  const t2 = new Date(); t2.setDate(t2.getDate() + 1); t2.setHours(19, 0, 0, 0);
  await reminders.save({ id: 'demo-r1', text: 'Repasar termodinámica (tarjetas)', when: t.getTime() });
  await reminders.save({ id: 'demo-r2', text: 'Leer capítulos 3 y 4 de historia', when: t2.getTime() });
  const tarjetas = [
    ['¿Qué dice la segunda ley de la termodinámica?', 'La entropía de un sistema aislado siempre aumenta.', 'demo-termo'],
    ['Eficiencia del ciclo de Carnot', '1 − (T fría / T caliente), en kelvin.', 'demo-maquinas'],
    ['¿Qué es la superposición cuántica?', 'Una partícula puede estar en varios estados a la vez hasta medirla.', 'demo-cuantica'],
    ['¿Qué pasó en 1789?', 'Toma de la Bastilla y Declaración de los Derechos del Hombre.', 'demo-revfr'],
    ['¿Dónde ocurre la fase luminosa de la fotosíntesis?', 'En los tilacoides del cloroplasto.', 'demo-informe'],
    ['¿Qué produce el ciclo de Calvin?', 'Glucosa, fijando el CO₂ en el estroma.', 'demo-informe'],
  ];
  for (let i = 0; i < tarjetas.length; i++) {
    const [q, a, noteId] = tarjetas[i];
    await cards.save({ id: 'demo-c' + i, q, a, noteId, due: Date.now() - 1000, reps: i % 3, interval: i % 3 });
  }
  await requests.save({ id: 'demo-req1', skill: 'investigacion', prompt: 'investiga a fondo la fotosíntesis', status: 'hecho', created: ago(1), reportId: 'demo-informe' });
  await requests.save({ id: 'demo-req2', skill: 'noticias-ia', prompt: 'Lo relevante de hoy en inteligencia artificial', status: 'pendiente', created: Date.now() });
  const profile = await kv.get('profile', {});
  if (!profile.name) await kv.set('profile', { name: 'Estudiante', title: 'Estudio física e historia · construyo Brainer', bio: 'Este es un perfil de ejemplo. Edítalo en Portafolio.', links: ['github.com/sryoxs'], goals: ['Aprobar física con 9', 'Terminar el ensayo de historia', 'Lanzar Brainer'] });
  const mem = await kv.get('memory', {});
  await kv.set('memory', { ...mem, studyLog: [{ day: ago(2), text: 'Termodinámica: leyes y entropía' }, { day: ago(1), text: 'Revolución francesa: cronología' }], demo: true });
  return NOTAS.length;
}

export async function removeDemo() {
  for (const n of NOTAS) await notes.remove(n.id);
  for (const id of ['demo-r1', 'demo-r2']) await reminders.remove(id);
  for (let i = 0; i < 6; i++) await cards.remove('demo-c' + i);
  for (const id of ['demo-req1', 'demo-req2']) await requests.remove(id);
}
