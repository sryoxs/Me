// Empaqueta la carpeta app/ dentro de un Worker (sin "assets"): sirve para publicar desde entornos
// donde la subida de assets de wrangler no funciona. Genera deploy/bundle.generated.js.
//   node deploy/build.mjs && npx wrangler deploy --config deploy/wrangler.toml
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
const ROOT = new URL('../app/', import.meta.url).pathname;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2' };
const files = {};
(function walk(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else files['/' + relative(ROOT, p).split('\\').join('/')] = { type: MIME[extname(p)] || 'application/octet-stream', b64: readFileSync(p).toString('base64') }; } })(ROOT);
const total = Object.values(files).reduce((n, f) => n + f.b64.length, 0);
writeFileSync(new URL('./bundle.generated.js', import.meta.url), `// Generado por deploy/build.mjs. No editar.\nexport const FILES = ${JSON.stringify(files)};\n`);
console.log(`${Object.keys(files).length} archivos, ${(total / 1024).toFixed(0)} KB en base64`);
