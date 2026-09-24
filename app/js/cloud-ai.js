// La inteligencia de Brainer en tu propia nube (Cloudflare Workers AI, a través de Brainer Sync):
//   chat  → conversación real con un modelo de lenguaje
//   stt   → oído (Whisper) desde cualquier dispositivo
//   tts   → voz humana en español (Aura-2)
// Todo pasa por tu Worker con tu frase secreta. Sin claves de terceros.

import { getSyncConfig } from './sync.js';

async function endpoint(path) {
  const cfg = await getSyncConfig();
  if (!cfg.url || !cfg.secret) throw new Error('Conecta Brainer Sync en Ajustes para activar la voz y la conversación.');
  return { url: cfg.url.replace(/\/$/, '') + path, headers: { authorization: `Bearer ${cfg.secret}` } };
}

export async function cloudReady() {
  const cfg = await getSyncConfig();
  return !!(cfg.url && cfg.secret);
}

// messages: [{role:'user'|'assistant', content}] → texto
export async function chat({ system, messages, maxTokens = 350 }) {
  const { url, headers } = await endpoint('/ai/chat');
  const res = await fetch(url, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ system, messages, max_tokens: maxTokens }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// blob de audio (webm/mp4/wav) → texto
export async function transcribe(blob) {
  const { url, headers } = await endpoint('/ai/stt');
  const res = await fetch(url, { method: 'POST', headers: { ...headers, 'content-type': blob.type || 'application/octet-stream' }, body: blob });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return (data.text || '').trim();
}

// texto → reproduce la voz. Devuelve una promesa que termina cuando acaba de hablar.
let currentAudio = null;
export async function speakCloud(text, { speaker = 'celeste', onStart } = {}) {
  const { url, headers } = await endpoint('/ai/tts');
  const res = await fetch(url, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ text, speaker }) });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Error ${res.status}`); }
  const blob = await res.blob();
  stopSpeaking();
  const audio = new Audio(URL.createObjectURL(blob));
  currentAudio = audio;
  return new Promise((resolve, reject) => {
    audio.onplay = () => onStart && onStart();
    audio.onended = () => { URL.revokeObjectURL(audio.src); if (currentAudio === audio) currentAudio = null; resolve(); };
    audio.onerror = () => reject(new Error('No se pudo reproducir la voz'));
    audio.play().catch(err => reject(err));
  });
}
export function stopSpeaking() { if (currentAudio) { try { currentAudio.pause(); } catch (_) { /* nada */ } currentAudio = null; } }

// Grabación con MediaRecorder. Modo manual: sigue grabando hasta que llames a stop() (o silencio largo / máximo).
// Devuelve { done: Promise<Blob|null>, stop() }.
export function startRecording({ maxMs = 60000, silenceMs = 4000, onLevel } = {}) {
  let stopFn = () => {};
  const done = recordClip({ maxMs, silenceMs, onLevel, expose: fn => { stopFn = fn; } });
  return { done, stop: () => stopFn() };
}

// Grabación con MediaRecorder hasta silencio (~1,3 s) o máximo; devuelve Blob.
export function recordClip({ maxMs = 15000, silenceMs = 1300, onLevel, expose } = {}) {
  return new Promise(async (resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { reject(new Error('Este navegador no permite usar el micrófono. Abre Brainer en Safari o Chrome, no dentro de otra app.')); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (_) { reject(new Error('Permite el micrófono para hablar con Brainer.')); return; }
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    // Detector de silencio con AnalyserNode
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
    const buf = new Uint8Array(an.fftSize);
    let lastVoice = Date.now(), started = false; const t0 = Date.now();
    const timer = setInterval(() => {
      an.getByteTimeDomainData(buf);
      let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / buf.length);
      onLevel && onLevel(rms);
      if (rms > 0.02) { lastVoice = Date.now(); started = true; }
      const quiet = Date.now() - lastVoice;
      if ((started && quiet > silenceMs) || Date.now() - t0 > maxMs || (!started && Date.now() - t0 > 7000)) stop();
    }, 80);
    function stop() {
      clearInterval(timer);
      if (rec.state !== 'inactive') rec.stop();
    }
    if (expose) expose(() => { started = true; stop(); });
    rec.onstop = () => {
      stream.getTracks().forEach(t => t.stop()); ctx.close().catch(() => {});
      resolve(started ? new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }) : null);
    };
    rec.onerror = () => { clearInterval(timer); reject(new Error('No se pudo grabar.')); };
    rec.start(250);
  });
}

// ¿Estamos dentro del navegador integrado de otra app (Instagram, TikTok, etc.)?
export function inAppBrowser() {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|TikTok|Twitter|Line\/|Snapchat|BytedanceWebview|GSA\//i.test(ua) || (/iPhone|iPad/.test(ua) && !/Safari/.test(ua) && !window.navigator.standalone);
}
