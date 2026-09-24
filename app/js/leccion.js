// Lección guiada: cuando Smith dice «voy a estudiar elipses», Brainer arma una clase completa
// con videos de YouTube, la explicación, un ejercicio resuelto paso a paso con fórmulas,
// una gráfica dibujada aquí mismo y las fuentes. Todo con la IA de tu nube y herramientas sin clave.

import { chat, tools } from './cloud-ai.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- KaTeX (fórmulas), cargado solo cuando hace falta ----------
let katexP = null;
export function loadKatex() {
  if (window.katex) return Promise.resolve(window.katex);
  if (katexP) return katexP;
  katexP = new Promise((resolve, reject) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js'; s.onload = () => resolve(window.katex); s.onerror = () => reject(new Error('KaTeX no disponible')); document.head.appendChild(s);
  });
  return katexP;
}
export function tex(latex, display = true) {
  const k = window.katex;
  if (!k) return `<code class="tex-raw">${esc(latex)}</code>`;
  try { return k.renderToString(latex, { displayMode: display, throwOnError: false, output: 'html' }); } catch (_) { return `<code class="tex-raw">${esc(latex)}</code>`; }
}
// Renderiza $...$ y $$...$$ dentro de un texto plano ya escapado
export function texInline(text) {
  return esc(text).replace(/\$\$([^$]+)\$\$/g, (_, m) => tex(m, true)).replace(/\$([^$\n]+)\$/g, (_, m) => tex(m, false));
}

// ---------- Evaluador seguro de expresiones matemáticas ----------
// Acepta solo números, variables x/t, operadores y funciones de Math. Nada más llega a Function().
const FN = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'exp', 'log', 'pow', 'min', 'max', 'floor', 'ceil', 'sign', 'cbrt', 'sinh', 'cosh', 'tanh'];
export function compile(expr, vars = ['x']) {
  let e = String(expr || '').toLowerCase().replace(/\s+/g, '').replace(/\^/g, '**').replace(/π|pi/g, 'PI').replace(/\be\b/g, 'E').replace(/ln\(/g, 'log(');
  e = e.replace(/(\d)([xt(])/g, '$1*$2').replace(/([xt)])(\d)/g, '$1*$2').replace(/\)\(/g, ')*(').replace(/([xt])\(/g, '$1*(').replace(/\)([xt])/g, ')*$1');
  const ok = new RegExp('^(' + [...FN, 'PI', 'E', ...vars, '\\d+(\\.\\d+)?', '[-+*/(),]', '\\*\\*'].join('|') + ')+$');
  if (!ok.test(e)) return null;
  try {
    const body = 'with(Math){return (' + e + ');}';
    const f = new Function(...vars, body); // eslint-disable-line no-new-func
    f(...vars.map(() => 0.5));
    return f;
  } catch (_) { return null; }
}

// ---------- Gráfica en canvas: funciones y=f(x), curvas paramétricas, ecuaciones implícitas ----------
// spec: { tipo: 'funcion'|'parametrica'|'implicita'|'puntos', expresiones: [...], xmin, xmax, ymin, ymax, tmin, tmax, puntos: [[x,y,'etiqueta']], titulo }
export function drawGraph(canvas, spec) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 520, H = canvas.clientHeight || 320;
  canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);
  const xmin = num(spec.xmin, -6), xmax = num(spec.xmax, 6);
  let ymin = num(spec.ymin, NaN), ymax = num(spec.ymax, NaN);
  if (!isFinite(ymin) || !isFinite(ymax)) { const r = (xmax - xmin) * H / W / 2; ymin = -r; ymax = r; }
  const pad = 28;
  const sx = x => pad + (x - xmin) / (xmax - xmin) * (W - 2 * pad);
  const sy = y => H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad);
  ctx.clearRect(0, 0, W, H);
  // rejilla
  const step = niceStep((xmax - xmin) / 8), stepY = niceStep((ymax - ymin) / 6);
  ctx.lineWidth = 1; ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(200,180,255,0.55)';
  for (let x = Math.ceil(xmin / step) * step; x <= xmax + 1e-9; x += step) { ctx.strokeStyle = Math.abs(x) < 1e-9 ? 'rgba(200,180,255,0.6)' : 'rgba(168,85,247,0.14)'; ctx.beginPath(); ctx.moveTo(sx(x), pad); ctx.lineTo(sx(x), H - pad); ctx.stroke(); if (Math.abs(x) > 1e-9) ctx.fillText(fmt(x), sx(x) - 8, H - pad + 14); }
  for (let y = Math.ceil(ymin / stepY) * stepY; y <= ymax + 1e-9; y += stepY) { ctx.strokeStyle = Math.abs(y) < 1e-9 ? 'rgba(200,180,255,0.6)' : 'rgba(168,85,247,0.14)'; ctx.beginPath(); ctx.moveTo(pad, sy(y)); ctx.lineTo(W - pad, sy(y)); ctx.stroke(); if (Math.abs(y) > 1e-9) ctx.fillText(fmt(y), 4, sy(y) + 3); }
  const colors = ['#c084fc', '#38e1ff', '#f472b6', '#facc15', '#34d399'];
  const exprs = Array.isArray(spec.expresiones) ? spec.expresiones : spec.expresion ? [spec.expresion] : [];
  let drawn = 0;
  exprs.forEach((ex, i) => {
    ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 2.2; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 10;
    if (spec.tipo === 'parametrica') {
      const parts = String(ex).split(/[;,]/).map(s => s.replace(/^[xy]\s*=\s*/i, '').trim());
      const fx = compile(parts[0], ['t']), fy = compile(parts[1], ['t']); if (!fx || !fy) return;
      const t0 = num(spec.tmin, 0), t1 = num(spec.tmax, 2 * Math.PI); ctx.beginPath();
      for (let k = 0; k <= 600; k++) { const t = t0 + (t1 - t0) * k / 600; const x = fx(t), y = fy(t); if (!isFinite(x) || !isFinite(y)) continue; k ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y)); }
      ctx.stroke(); drawn++;
    } else if (spec.tipo === 'implicita') {
      // F(x,y)=0 por marching squares sencillo
      const sides = String(ex).split('=');
      const f = compile(sides.length === 2 ? `(${sides[0]})-(${sides[1]})` : ex, ['x', 'y']); if (!f) return;
      const N = 110, M = 70; const g = [];
      for (let j = 0; j <= M; j++) { g[j] = []; for (let i = 0; i <= N; i++) g[j][i] = f(xmin + (xmax - xmin) * i / N, ymin + (ymax - ymin) * j / M); }
      ctx.beginPath();
      for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
        const x0 = xmin + (xmax - xmin) * i / N, x1 = xmin + (xmax - xmin) * (i + 1) / N, y0 = ymin + (ymax - ymin) * j / M, y1 = ymin + (ymax - ymin) * (j + 1) / M;
        const c = [[x0, y0, g[j][i]], [x1, y0, g[j][i + 1]], [x1, y1, g[j + 1][i + 1]], [x0, y1, g[j + 1][i]]];
        const pts = [];
        for (let k = 0; k < 4; k++) { const a = c[k], b = c[(k + 1) % 4]; if (!isFinite(a[2]) || !isFinite(b[2])) continue; if ((a[2] < 0) !== (b[2] < 0)) { const t = a[2] / (a[2] - b[2]); pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
        if (pts.length >= 2) { ctx.moveTo(sx(pts[0][0]), sy(pts[0][1])); ctx.lineTo(sx(pts[1][0]), sy(pts[1][1])); }
      }
      ctx.stroke(); drawn++;
    } else {
      const f = compile(String(ex).replace(/^y\s*=\s*/i, ''), ['x']); if (!f) return;
      ctx.beginPath(); let pen = false;
      for (let k = 0; k <= 800; k++) { const x = xmin + (xmax - xmin) * k / 800; const y = f(x); if (!isFinite(y) || y < ymin - 50 || y > ymax + 50) { pen = false; continue; } pen ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y)); pen = true; }
      ctx.stroke(); drawn++;
    }
  });
  ctx.shadowBlur = 0;
  for (const p of spec.puntos || []) { if (!Array.isArray(p)) continue; const [x, y, lab] = p; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx(+x), sy(+y), 3.5, 0, 6.28); ctx.fill(); if (lab) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(String(lab), sx(+x) + 6, sy(+y) - 6); } }
  if (spec.titulo) { ctx.fillStyle = 'rgba(220,200,255,0.8)'; ctx.font = '11px Inter, sans-serif'; ctx.fillText(String(spec.titulo), pad, 14); }
  return drawn + (spec.puntos || []).length;
}
const num = (v, d) => { const n = Number(v); return isFinite(n) ? n : d; };
const fmt = n => (Math.round(n * 100) / 100).toString();
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw))); const r = raw / p; return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p; }

// ---------- La lección ----------
const LESSON_SYSTEM = `Eres un profesor particular excelente que escribe en español, claro y directo, sin emojis.
Devuelves SOLO un objeto JSON válido, sin texto antes ni después, sin comentarios, con esta forma exacta:
{
 "titulo": "string corto",
 "resumen": "2 o 3 frases que expliquen la idea central",
 "ideas": ["3 a 5 ideas clave, una frase cada una; fórmulas en LaTeX entre $...$"],
 "formulas": [{"nombre": "string", "latex": "string LaTeX sin $"}],
 "ejercicio": {"enunciado": "string", "pasos": [{"texto": "qué se hace y por qué", "latex": "la operación de ese paso en LaTeX sin $, o cadena vacía"}], "resultado": "string"},
 "grafica": {"tipo": "funcion|parametrica|implicita|ninguna", "titulo": "string", "expresiones": ["..."], "xmin": -6, "xmax": 6, "ymin": -4, "ymax": 4, "tmin": 0, "tmax": 6.283, "puntos": [[x, y, "etiqueta"]]},
 "preguntas": [{"q": "pregunta corta de repaso", "a": "respuesta corta"}],
 "siguiente": "qué conviene estudiar después, una frase"
}
Reglas para "grafica": si el tema es una curva o función, dibújala con la sintaxis de una calculadora: funciones usan x (ej. "x^2-3*x+1"), paramétricas usan t con dos expresiones separadas por ; (ej. "3*cos(t); 2*sin(t)"), implícitas son una ecuación en x e y (ej. "x^2/9+y^2/4=1"). Funciones permitidas: sin cos tan sqrt abs exp log pow. Si el tema no es gráfico, usa tipo "ninguna". Pon en "puntos" los elementos notables (focos, vértices, centro) del ejercicio.
El ejercicio debe estar resuelto de verdad, con números concretos y entre 4 y 7 pasos. Entre 4 y 6 preguntas de repaso.`;

// Convierte la respuesta del modelo en objeto aunque venga con texto alrededor
export function parseLesson(text) {
  const t = String(text || '').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < 0) throw new Error('La IA no devolvió la lección en formato válido');
  let raw = t.slice(a, b + 1);
  try { return JSON.parse(raw); } catch (_) { /* segundo intento: barras de LaTeX sin escapar */ }
  raw = raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
  return JSON.parse(raw);
}

// Arma la lección: en paralelo, la IA redacta y las herramientas traen videos, fuentes y Wikipedia.
export async function buildLesson(topic, { level = '', onProgress } = {}) {
  const say = m => onProgress && onProgress(m);
  say('buscando videos y fuentes…');
  const [videos, wiki, web, ai] = await Promise.all([
    tools.youtube(topic + ' explicación clase').catch(() => []),
    tools.wiki(topic).catch(() => null),
    tools.search(topic).catch(() => []),
    (async () => { say('la IA redacta la lección…'); return chat({ system: LESSON_SYSTEM, messages: [{ role: 'user', content: `Tema: ${topic}.${level ? ' Nivel: ' + level + '.' : ''} Arma la lección.` }], maxTokens: 1800 }); })(),
  ]);
  const lesson = parseLesson(ai.text);
  lesson.tema = topic; lesson.videos = (videos || []).slice(0, 4); lesson.wiki = wiki && wiki.found ? wiki : null; lesson.fuentes = (web || []).slice(0, 6); lesson.model = ai.model; lesson.creada = Date.now();
  return lesson;
}

// HTML de la lección (para el chat y para la vista Estudio). Las gráficas se dibujan después con mountLesson().
export function renderLesson(L) {
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  const videos = L.videos && L.videos.length ? `<div class="lsec"><div class="ph">VIDEOS</div><div class="videos">${L.videos.map(v => `<a class="video" href="${esc(v.url)}" target="_blank" rel="noopener" data-yt="${esc(v.id)}"><img src="${esc(v.thumb)}" alt="" loading="lazy"><span class="play"></span><b>${esc(v.title)}</b><small>${esc(v.channel)}${v.length ? ' · ' + esc(v.length) : ''}</small></a>`).join('')}</div></div>` : '';
  const ideas = (L.ideas || []).length ? `<div class="lsec"><div class="ph">IDEAS CLAVE</div><ol class="ideas">${L.ideas.map(i => `<li>${texInline(i)}</li>`).join('')}</ol></div>` : '';
  const formulas = (L.formulas || []).length ? `<div class="lsec"><div class="ph">FÓRMULAS</div><div class="formulas">${L.formulas.map(f => `<div class="formula"><small>${esc(f.nombre)}</small>${tex(f.latex, true)}</div>`).join('')}</div></div>` : '';
  const ej = L.ejercicio && L.ejercicio.enunciado ? `<div class="lsec"><div class="ph">EJERCICIO RESUELTO</div><p class="enunciado">${texInline(L.ejercicio.enunciado)}</p><ol class="pasos">${(L.ejercicio.pasos || []).map((p, i) => `<li><span class="n">${i + 1}</span><div><p>${texInline(p.texto)}</p>${p.latex ? tex(p.latex, true) : ''}</div></li>`).join('')}</ol>${L.ejercicio.resultado ? `<p class="resultado"><b>Resultado:</b> ${texInline(L.ejercicio.resultado)}</p>` : ''}</div>` : '';
  const hasGraph = L.grafica && L.grafica.tipo && L.grafica.tipo !== 'ninguna' && (L.grafica.expresiones || []).length;
  const graph = hasGraph ? `<div class="lsec"><div class="ph">GRÁFICA</div><canvas class="graph" id="${id}" data-graph='${esc(JSON.stringify(L.grafica))}'></canvas></div>` : '';
  const fuentes = [];
  if (L.wiki) fuentes.push(`<li><a href="${esc(L.wiki.url)}" target="_blank" rel="noopener"><b>Wikipedia: ${esc(L.wiki.title)}</b></a><span>${esc((L.wiki.extract || '').slice(0, 180))}</span></li>`);
  for (const f of L.fuentes || []) fuentes.push(`<li><a href="${esc(f.url)}" target="_blank" rel="noopener"><b>${esc(f.title)}</b></a><span>${esc((f.snippet || '').slice(0, 160))}</span><small>${esc(host(f.url))}</small></li>`);
  const src = fuentes.length ? `<div class="lsec"><div class="ph">FUENTES</div><ul class="fuentes">${fuentes.join('')}</ul></div>` : '';
  const preguntas = (L.preguntas || []).length ? `<div class="lsec"><div class="ph">REPASO</div><p class="muted small">Guardadas como tarjetas: te las preguntaré cuando toque.</p><div class="preguntas">${L.preguntas.map(p => `<details><summary>${texInline(p.q)}</summary><p>${texInline(p.a)}</p></details>`).join('')}</div></div>` : '';
  return `<article class="lesson"><header><span class="readout">LECCIÓN · ${esc(L.tema)}</span><h3>${esc(L.titulo || L.tema)}</h3><p>${texInline(L.resumen || '')}</p></header>${videos}${ideas}${formulas}${ej}${graph}${src}${preguntas}${L.siguiente ? `<footer class="muted small">Después: ${esc(L.siguiente)}</footer>` : ''}</article>`;
}
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (_) { return ''; } };

// Dibuja las gráficas y activa los videos incrustados dentro de un contenedor ya insertado en el DOM
export function mountLesson(root) {
  root.querySelectorAll('canvas.graph[data-graph]').forEach(c => { try { drawGraph(c, JSON.parse(c.dataset.graph)); } catch (_) { c.remove(); } });
  root.querySelectorAll('a.video[data-yt]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const f = document.createElement('div'); f.className = 'video-frame';
    f.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${esc(a.dataset.yt)}?autoplay=1&hl=es" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    a.replaceWith(f);
  }));
}

// Texto que Brainer dice en voz alta al entregar la lección
const plain = t => String(t || '').replace(/\$\$?([^$]*)\$\$?/g, (_, m) => m.replace(/\\(frac|sqrt|cdot|pm|le|ge|neq|approx|left|right|times)\b/g, ' $1 ').replace(/[\\{}^_]/g, ' ')).replace(/\s+/g, ' ').trim();
export function lessonSpeech(L) {
  const n = (L.videos || []).length;
  return `${L.titulo || L.tema}. ${plain(L.resumen)} Te dejé ${n ? n + ' videos, ' : ''}las fórmulas, un ejercicio resuelto paso a paso${L.grafica && L.grafica.tipo !== 'ninguna' ? ', la gráfica' : ''} y las fuentes. Dime cuando quieras que te pregunte.`;
}

// Cuerpo markdown para guardar la lección como nota en la bóveda
export function lessonMarkdown(L) {
  const lines = [`# ${L.titulo || L.tema}`, '', L.resumen || '', ''];
  if ((L.ideas || []).length) { lines.push('## Ideas clave'); for (const i of L.ideas) lines.push('- ' + i); lines.push(''); }
  if ((L.formulas || []).length) { lines.push('## Fórmulas'); for (const f of L.formulas) lines.push(`- ${f.nombre}: $${f.latex}$`); lines.push(''); }
  if (L.ejercicio && L.ejercicio.enunciado) { lines.push('## Ejercicio resuelto', L.ejercicio.enunciado, ''); (L.ejercicio.pasos || []).forEach((p, i) => lines.push(`${i + 1}. ${p.texto}${p.latex ? ` $${p.latex}$` : ''}`)); if (L.ejercicio.resultado) lines.push('', `**Resultado:** ${L.ejercicio.resultado}`); lines.push(''); }
  if ((L.videos || []).length) { lines.push('## Videos'); for (const v of L.videos) lines.push(`- [${v.title}](${v.url}) · ${v.channel}`); lines.push(''); }
  const src = []; if (L.wiki) src.push(`- [Wikipedia: ${L.wiki.title}](${L.wiki.url})`); for (const f of L.fuentes || []) src.push(`- [${f.title}](${f.url})`);
  if (src.length) { lines.push('## Fuentes', ...src, ''); }
  if ((L.preguntas || []).length) { lines.push('## Repaso'); for (const p of L.preguntas) lines.push(`${p.q}: ${p.a}`); lines.push(''); }
  if (L.siguiente) lines.push('## Siguiente paso', L.siguiente);
  return lines.join('\n');
}
