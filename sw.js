// Service worker: Brainer funciona sin conexión y se instala como app.
const CACHE = 'brainer-v3';
const ASSETS = ['./', 'index.html', 'css/brainer.css', 'js/app.js', 'js/store.js', 'js/search.js', 'js/graph.js', 'js/voice.js', 'js/ai.js', 'js/study.js', 'js/reminders.js', 'js/sync.js', 'js/neuro.js', 'js/hud.js', 'js/local-ai.js', 'skills/skills.json', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Las llamadas a la API de Claude y a CDNs nunca se cachean.
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => list.length ? list[0].focus() : self.clients.openWindow('./#recordatorios')));
});
