// Worker que sirve Brainer (app/) desde el propio script. Misma URL, sin subida de assets.
import { FILES } from './bundle.generated.js';
const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
export default {
  async fetch(request) {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    let f = FILES[path];
    if (!f && !path.includes('.')) f = FILES['/index.html']; // SPA: rutas sin extensión → index
    if (!f) return new Response('No encontrado', { status: 404 });
    const immutable = /^\/(icons|css|js)\//.test(path) && path !== '/js/app.js';
    return new Response(bytes(f.b64), { headers: { 'content-type': f.type, 'cache-control': path === '/index.html' || path === '/sw.js' ? 'no-cache' : immutable ? 'public, max-age=3600' : 'public, max-age=300', 'x-brainer': 'bundle' } });
  },
};
