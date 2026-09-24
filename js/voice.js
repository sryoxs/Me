// Voz: escuchar (Web Speech API) y hablar (SpeechSynthesis). Funciona en Safari (iPhone/iPad) y Chrome.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const voiceSupported = !!SR;

export function listen({ lang = 'es-ES', onStart, onEnd, onError } = {}) {
  return new Promise((resolve, reject) => {
    if (!SR) { reject(new Error('Este navegador no soporta reconocimiento de voz.')); return; }
    const rec = new SR();
    rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;
    let done = false;
    rec.onstart = () => onStart && onStart();
    rec.onresult = e => { done = true; resolve(e.results[0][0].transcript); };
    rec.onerror = e => { done = true; onError && onError(e); reject(new Error(e.error === 'not-allowed' ? 'Permite el micrófono para hablar con Brainer.' : 'No te escuché bien, inténtalo otra vez.')); };
    rec.onend = () => { onEnd && onEnd(); if (!done) resolve(''); };
    try { rec.start(); } catch (err) { reject(err); }
  });
}

let voiceCache = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  if (voiceCache) return voiceCache;
  const voices = speechSynthesis.getVoices();
  voiceCache = voices.find(v => /^es/.test(v.lang) && /Google|Premium|Enhanced|Mónica|Paulina|Jorge/i.test(v.name))
    || voices.find(v => /^es/.test(v.lang)) || null;
  return voiceCache;
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { voiceCache = null; };

export function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*_#\[\]]/g, '').slice(0, 400));
  u.lang = 'es-ES'; u.rate = 1.02; u.pitch = 1;
  const v = pickVoice(); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
