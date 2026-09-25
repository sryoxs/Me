// Voz: escuchar (Web Speech API) y hablar (SpeechSynthesis). Funciona en Safari (iPhone/iPad) y Chrome.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const voiceSupported = !!SR;

export function listen({ lang = 'es-ES', onStart, onEnd, onError } = {}) {
  return new Promise((resolve, reject) => {
    if (!SR) { reject(new Error('Este navegador no soporta reconocimiento de voz.')); return; }
    const rec = new SR();
    rec.lang = lang; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = true;
    let done = false, finalText = '', timer = null;
    const finish = () => { if (done) return; done = true; try { rec.stop(); } catch (_) { /* ya parado */ } resolve(finalText.trim()); };
    rec.onstart = () => { onStart && onStart(); timer = setTimeout(finish, 8000); };
    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' '; else interim += e.results[i][0].transcript; }
      clearTimeout(timer); timer = setTimeout(finish, finalText ? 1200 : 2500);
      if (!finalText && interim) finalText = ''; // esperamos al resultado final
      if (finalText && !interim) { clearTimeout(timer); timer = setTimeout(finish, 900); }
    };
    rec.onerror = e => { done = true; onError && onError(e); reject(new Error(e.error === 'not-allowed' ? 'Permite el micrófono para hablar con Brainer.' : 'No te escuché bien, inténtalo otra vez.')); };
    rec.onend = () => { onEnd && onEnd(); clearTimeout(timer); if (!done) { done = true; resolve(finalText.trim()); } };
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
