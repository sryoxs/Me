// Redes neuronales en tu dispositivo (transformers.js): Whisper para oír y un modelo de
// embeddings para entender el significado de tus notas. Los modelos se descargan la primera
// vez y quedan en la caché del navegador. Nada de audio ni texto sale de tu equipo.

import { vectors, notes, getSettings } from './store.js';

const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/+esm';
const EMBED_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

let tfPromise = null;
const pipelines = {};
const progressListeners = [];
export const onProgress = fn => progressListeners.push(fn);
const report = evt => progressListeners.forEach(fn => fn(evt));

async function tf() {
  if (!tfPromise) tfPromise = import(TRANSFORMERS_URL).then(m => { m.env.allowLocalModels = false; return m; });
  return tfPromise;
}

export async function hasWebGPU() {
  try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (_) { return false; }
}

async function getPipeline(task, model, opts = {}) {
  const key = task + ':' + model;
  if (pipelines[key]) return pipelines[key];
  const { pipeline } = await tf();
  const device = (await hasWebGPU()) ? 'webgpu' : 'wasm';
  pipelines[key] = pipeline(task, model, {
    device, dtype: opts.dtype || 'q8',
    progress_callback: p => report({ model, status: p.status, progress: p.progress || 0, file: p.file }),
  }).catch(err => { delete pipelines[key]; throw err; });
  return pipelines[key];
}

// ---------- Whisper: oír en el dispositivo ----------
export async function whisperReady() {
  const s = await getSettings();
  return s.localWhisper && !!pipelines['automatic-speech-recognition:' + s.whisperModel];
}

export async function loadWhisper() {
  const s = await getSettings();
  return getPipeline('automatic-speech-recognition', s.whisperModel);
}

// Graba hasta que haya silencio (~1,2 s) o se pase el máximo, y devuelve Float32Array a 16 kHz.
export function recordUntilSilence({ maxMs = 20000, silenceMs = 1200, onLevel } = {}) {
  return new Promise(async (resolve, reject) => {
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (_) { reject(new Error('Permite el micrófono para hablar con Brainer.')); return; }
    const ctx = new AudioContext({ sampleRate: 16000 });
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const chunks = []; let lastVoice = Date.now(); let started = false;
    const t0 = Date.now();
    proc.onaudioprocess = e => {
      const d = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(d));
      let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
      const rms = Math.sqrt(sum / d.length);
      onLevel && onLevel(rms);
      if (rms > 0.015) { lastVoice = Date.now(); started = true; }
      const quiet = Date.now() - lastVoice;
      if ((started && quiet > silenceMs) || Date.now() - t0 > maxMs || (!started && Date.now() - t0 > 6000)) finish();
    };
    src.connect(proc); proc.connect(ctx.destination);
    function finish() {
      proc.disconnect(); src.disconnect(); stream.getTracks().forEach(t => t.stop()); ctx.close();
      const len = chunks.reduce((a, c) => a + c.length, 0);
      const out = new Float32Array(len); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
      resolve(started ? out : null);
    }
  });
}

export async function transcribe(audio) {
  const asr = await loadWhisper();
  const r = await asr(audio, { language: 'spanish', task: 'transcribe', chunk_length_s: 30 });
  return (r.text || '').trim();
}

// ---------- Embeddings: entender el significado ----------
export async function embed(texts) {
  const ex = await getPipeline('feature-extraction', EMBED_MODEL);
  const out = await ex(texts, { pooling: 'mean', normalize: true });
  const dims = out.dims[1];
  const data = out.data;
  return texts.map((_, i) => Array.from(data.slice(i * dims, (i + 1) * dims)));
}

export async function embeddingsReady() {
  const s = await getSettings();
  return s.localEmbeddings && !!pipelines['feature-extraction:' + EMBED_MODEL];
}

// Calcula vectores para las notas que cambiaron. Se llama en segundo plano.
let indexing = false;
export async function indexNotes() {
  const s = await getSettings();
  if (!s.localEmbeddings || indexing) return 0;
  indexing = true;
  try {
    const [all, vecs] = await Promise.all([notes.all(), vectors.all()]);
    const have = new Map(vecs.map(v => [v.id, v.updated]));
    const todo = all.filter(n => have.get(n.id) !== n.updated).slice(0, 40);
    // Limpia vectores de notas borradas
    const ids = new Set(all.map(n => n.id));
    for (const v of vecs) if (!ids.has(v.id)) await vectors.remove(v.id);
    if (!todo.length) return 0;
    const texts = todo.map(n => `${n.title}. ${(n.body || '').slice(0, 1200)}`);
    const embs = await embed(texts);
    for (let i = 0; i < todo.length; i++) await vectors.put({ id: todo[i].id, vec: embs[i], updated: todo[i].updated });
    return todo.length;
  } finally { indexing = false; }
}

export async function semanticSearch(query, { limit = 8 } = {}) {
  const s = await getSettings();
  if (!s.localEmbeddings) return [];
  const [q] = await embed([query]);
  const vecs = await vectors.all();
  const scored = vecs.map(v => ({ id: v.id, score: cosine(q, v.vec) })).filter(x => x.score > 0.35);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function cosine(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

// Resumen extractivo local (sin modelo): las frases más representativas.
export function extractiveSummary(text, n = 4) {
  const sents = (text || '').replace(/\s+/g, ' ').match(/[^.!?\n]+[.!?]?/g) || [];
  if (sents.length <= n) return sents.join(' ').trim();
  const freq = {};
  const words = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-zñ]{4,}/g) || [];
  for (const s of sents) for (const w of words(s)) freq[w] = (freq[w] || 0) + 1;
  const scored = sents.map((s, i) => ({ i, s, score: words(s).reduce((a, w) => a + freq[w], 0) / (words(s).length + 3) }));
  return scored.sort((a, b) => b.score - a.score).slice(0, n).sort((a, b) => a.i - b.i).map(x => x.s.trim()).join(' ');
}
