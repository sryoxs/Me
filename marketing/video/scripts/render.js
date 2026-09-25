// Renderiza la animación cuadro por cuadro con Playwright y la codifica con ffmpeg.
// Uso:
//   node render.js seg A out.mp4          → tramo A (0 → A_END)
//   node render.js seg B out.mp4          → tramo B (A_END → B_END)
//   node render.js preview dir t1 t2 …    → PNGs sueltos para revisar (añade ?safe=1 con SAFE=1)
//   node render.js cover portada.png      → portada 1080x1920
const { chromium } = require(process.env.NODE_PATH_PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const { spawn, execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

function serve() {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    }).listen(0, '127.0.0.1', () => ok(srv));
  });
}
function ffmpegBin() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  return execSync('python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"').toString().trim();
}

(async () => {
  const [mode, a1, ...rest] = process.argv.slice(2);
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/src/index.html${process.env.SAFE ? '?safe=1' : ''}`;
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
  await page.goto(base); await page.evaluate(() => window.ready);
  const cfg = await page.evaluate(() => window.CFG);
  const canvas = await page.$('#cv');

  if (mode === 'preview') {
    fs.mkdirSync(a1, { recursive: true });
    for (const t of rest) {
      await page.evaluate((x) => render(x), parseFloat(t));
      await canvas.screenshot({ path: path.join(a1, `t${String(t).padStart(5, '0')}.png`) });
    }
  } else if (mode === 'cover') {
    await page.evaluate(() => renderCover());
    await canvas.screenshot({ path: a1 });
  } else if (mode === 'seg') {
    const out = rest[0];
    const [t0, t1] = a1 === 'A' ? [0, cfg.A_END] : [cfg.A_END, cfg.B_END];
    const n = Math.round((t1 - t0) * cfg.FPS);
    const ff = spawn(ffmpegBin(), ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(cfg.FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(cfg.FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const started = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate((x) => render(x), t0 + i / cfg.FPS);
      const buf = await canvas.screenshot({ type: 'jpeg', quality: 94 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 60 === 0) console.log(`[${a1}] ${i}/${n} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    console.log(`[${a1}] listo: ${out}`);
  }
  await b.close(); srv.close();
})();
