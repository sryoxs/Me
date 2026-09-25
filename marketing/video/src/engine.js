/* Motor de dibujo determinista: todo depende sólo de t (segundos). */
(function () {
  const C = window.CFG;
  const cv = document.getElementById('cv');
  cv.width = C.W; cv.height = C.H;
  const ctx = cv.getContext('2d');
  const E = (window.E = { ctx, cv, img: {} });

  /* ---------- carga de imágenes ---------- */
  E.load = function (map) {
    return Promise.all(Object.entries(map).map(([k, src]) => new Promise((ok, ko) => {
      const im = new Image();
      im.onload = () => { E.img[k] = im; ok(); };
      im.onerror = () => ko(new Error('No cargó ' + src));
      im.src = src;
    })));
  };

  /* ---------- tiempo y easing ---------- */
  E.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  E.lerp = (a, b, p) => a + (b - a) * p;
  E.prog = (t, a, b) => E.clamp((t - a) / (b - a));
  E.easeOut = (p) => 1 - Math.pow(1 - p, 3);
  E.easeIn = (p) => p * p * p;
  E.easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  E.back = (p) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  E.pop = (t, a, d = 0.35) => E.back(E.prog(t, a, a + d));
  // aleatorio determinista
  E.rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- formas ---------- */
  E.rr = function (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  E.card = function (x, y, w, h, r, fill, shadow = true, border) {
    ctx.save();
    if (shadow) { ctx.shadowColor = 'rgba(40,20,5,.22)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; }
    E.rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
    ctx.restore();
    if (border) { ctx.save(); E.rr(x, y, w, h, r); ctx.lineWidth = border[0]; ctx.strokeStyle = border[1]; ctx.stroke(); ctx.restore(); }
  };
  // imagen tipo "cover" dentro de un rectángulo, con zoom y foco (fx, fy en 0..1)
  E.cover = function (im, x, y, w, h, zoom = 1, fx = 0.5, fy = 0.5) {
    const s = Math.max(w / im.width, h / im.height) * zoom;
    const sw = w / s, sh = h / s;
    const sx = E.clamp(fx * im.width - sw / 2, 0, im.width - sw);
    const sy = E.clamp(fy * im.height - sh / 2, 0, im.height - sh);
    ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
  };
  // versión pixelada (mosaico) de cover: block = tamaño de bloque en px de salida
  const tmp = document.createElement('canvas'); const tctx = tmp.getContext('2d');
  E.coverPixel = function (im, x, y, w, h, block, zoom = 1, fx = 0.5, fy = 0.5) {
    if (block <= 1.5) return E.cover(im, x, y, w, h, zoom, fx, fy);
    const cw = Math.max(1, Math.round(w / block)), ch = Math.max(1, Math.round(h / block));
    tmp.width = cw; tmp.height = ch;
    const s = Math.max(w / im.width, h / im.height) * zoom;
    const sw = w / s, sh = h / s;
    const sx = E.clamp(fx * im.width - sw / 2, 0, im.width - sw);
    const sy = E.clamp(fy * im.height - sh / 2, 0, im.height - sh);
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(im, sx, sy, sw, sh, 0, 0, cw, ch);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, cw, ch, x, y, w, h);
    ctx.restore();
  };

  /* ---------- texto ---------- */
  E.font = (size, fam = 'jak', weight = 800) =>
    fam === 'pix' ? `${weight >= 700 ? 700 : 400} ${size}px Silkscreen, "Noto Color Emoji"` : `${weight} ${size}px "Plus Jakarta Sans", "Noto Color Emoji"`;
  // título pixel con sombra dura (como el logo del sitio)
  E.pixTitle = function (txt, x, y, size, color = C.COLORS.orange, shadow = '#e3d6c3', align = 'center', off = 0.09) {
    ctx.save(); ctx.font = E.font(size, 'pix'); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    const o = Math.round(size * off);
    ctx.fillStyle = shadow; ctx.fillText(txt, x + o, y + o);
    ctx.fillStyle = color; ctx.fillText(txt, x, y);
    ctx.restore();
  };
  E.text = function (txt, x, y, size, color = C.COLORS.ink, align = 'center', weight = 800, fam = 'jak') {
    ctx.save(); ctx.font = E.font(size, fam, weight); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color; ctx.fillText(txt, x, y); ctx.restore();
  };
  // texto con contorno (para ir encima de fotos)
  E.textOut = function (txt, x, y, size, color = '#fff', stroke = C.COLORS.ink, lw = 12, fam = 'pix', align = 'center') {
    ctx.save(); ctx.font = E.font(size, fam, 700); ctx.textAlign = align; ctx.lineJoin = 'round';
    ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(txt, x, y);
    ctx.fillStyle = color; ctx.fillText(txt, x, y); ctx.restore();
  };
  E.measure = (txt, size, fam = 'jak', weight = 800) => { ctx.save(); ctx.font = E.font(size, fam, weight); const w = ctx.measureText(txt).width; ctx.restore(); return w; };
  // párrafo con salto de línea automático; devuelve alto usado
  E.wrap = function (txt, x, y, maxW, size, lh, color, weight = 600, align = 'left', upto = Infinity) {
    ctx.save(); ctx.font = E.font(size, 'jak', weight); ctx.fillStyle = color; ctx.textAlign = align;
    const words = txt.split(' '); let line = '', yy = y, shown = 0;
    const lines = [];
    for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
    if (line) lines.push(line);
    for (const l of lines) {
      const rest = upto - shown; if (rest <= 0) break;
      ctx.fillText(l.slice(0, rest), x, yy); shown += l.length + 1; yy += lh;
    }
    ctx.restore();
    return lines.length * lh;
  };

  /* ---------- bloques de encabezado de cada escena ---------- */
  // Título pixel + bajada, con entrada animada. Centro de la zona segura.
  E.CX = (C.SAFE.left + (C.W - C.SAFE.right)) / 2; // ≈ 495
  E.header = function (t, t0, title, sub, opts = {}) {
    const p = E.pop(t, t0 + 0.05, 0.4), q = E.easeOut(E.prog(t, t0 + 0.25, t0 + 0.6));
    const y = opts.y || 360;
    ctx.save(); ctx.globalAlpha = E.clamp(p * 1.5);
    ctx.translate(E.CX, y); ctx.scale(0.6 + 0.4 * p, 0.6 + 0.4 * p);
    const lines = Array.isArray(title) ? title : [title];
    const maxW = Math.max(...lines.map((l) => E.measure(l, opts.size || 76, 'pix', 700)));
    const fit = Math.min(1, 800 / maxW); ctx.scale(fit, fit);
    lines.forEach((l, i) => E.pixTitle(l, 0, i * (opts.size || 76) * 1.1, opts.size || 76, opts.color, opts.shadow));
    ctx.restore();
    if (sub) {
      ctx.save(); ctx.globalAlpha = q;
      const yy = y + (lines.length - 1) * (opts.size || 76) * 1.1 + 70 + (1 - q) * 20;
      E.text(sub, E.CX, yy, opts.subSize || 42, opts.subColor || C.COLORS.ink, 'center', 700);
      ctx.restore();
    }
  };

  /* ---------- mockup de celular ---------- */
  // Dibuja un celular con esquina superior izquierda (x,y) y ancho w; drawScreen(sx,sy,sw,sh)
  E.phone = function (x, y, w, drawScreen, tilt = 0) {
    const h = w * 2.06, b = w * 0.035, r = w * 0.13;
    ctx.save();
    if (tilt) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(tilt); ctx.translate(-(x + w / 2), -(y + h / 2)); }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
    E.rr(x, y, w, h, r); ctx.fillStyle = '#1d1b19'; ctx.fill(); ctx.restore();
    E.rr(x + 2, y + 2, w - 4, h - 4, r - 2); ctx.lineWidth = 4; ctx.strokeStyle = '#4a4540'; ctx.stroke();
    const sx = x + b, sy = y + b, sw = w - 2 * b, sh = h - 2 * b;
    ctx.save(); E.rr(sx, sy, sw, sh, r - b); ctx.clip();
    ctx.fillStyle = C.COLORS.cream; ctx.fillRect(sx, sy, sw, sh);
    drawScreen(sx, sy, sw, sh);
    ctx.restore();
    // isla dinámica
    E.rr(x + w / 2 - w * 0.13, sy + w * 0.03, w * 0.26, w * 0.075, w * 0.04); ctx.fillStyle = '#0c0b0a'; ctx.fill();
    ctx.restore();
    return { h, sx, sy, sw, sh };
  };
  // captura real ajustada al ancho de la pantalla (390x844 @3x), desplazada dy (px de captura)
  E.shot = function (im, sx, sy, sw, sh, dy = 0) {
    const s = sw / im.width, srcH = Math.min(im.height - dy / s, sh / s);
    ctx.drawImage(im, 0, dy / s, im.width, srcH, sx, sy, sw, srcH * s);
  };

  /* ---------- transición: wipe de bloques pixel ---------- */
  // Cubre (t<tb) y descubre (t>=tb) la pantalla con bloques en orden pseudoaleatorio.
  E.pixelWipe = function (t, tb, d = 0.22, colors = [C.COLORS.orange, '#f4a463', '#ae5620']) {
    if (t < tb - d || t > tb + d) return;
    const bs = 90, cols = Math.ceil(C.W / bs), rows = Math.ceil(C.H / bs);
    const p = t < tb ? E.prog(t, tb - d, tb) : 1 - E.prog(t, tb, tb + d);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      // barrido diagonal + ruido
      const order = ((i + j) / (cols + rows)) * 0.6 + E.rand(k + tb * 7) * 0.4;
      if (order < p) { ctx.fillStyle = colors[k % colors.length]; ctx.fillRect(i * bs, j * bs, bs + 1, bs + 1); }
    }
  };

  /* ---------- partículas pixel (confeti / estallido) ---------- */
  E.burst = function (t, t0, cx, cy, n = 40, spread = 520, dur = 1.1, cols = ['#e8702a', '#f2c14e', '#ffffff', '#c33c4e', '#1b8a6b']) {
    const p = E.prog(t, t0, t0 + dur); if (p <= 0 || p >= 1) return;
    for (let i = 0; i < n; i++) {
      const a = E.rand(i + 3) * Math.PI * 2, v = (0.4 + E.rand(i + 9) * 0.6) * spread;
      const x = cx + Math.cos(a) * v * E.easeOut(p), y = cy + Math.sin(a) * v * E.easeOut(p) + 380 * p * p;
      const s = 10 + Math.round(E.rand(i + 5) * 3) * 6;
      ctx.globalAlpha = 1 - E.easeIn(p); ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(Math.round(x / 6) * 6, Math.round(y / 6) * 6, s, s);
    }
    ctx.globalAlpha = 1;
  };
  // fondo crema con cuadrícula pixel sutil y destellos
  E.bgCream = function (t, col = C.COLORS.cream, dot = 'rgba(232,112,42,.10)') {
    ctx.fillStyle = col; ctx.fillRect(0, 0, C.W, C.H);
    for (let i = 0; i < 26; i++) {
      const x = E.rand(i) * C.W, y = ((E.rand(i + 50) * C.H) - t * (30 + E.rand(i + 7) * 40)) % C.H;
      ctx.fillStyle = dot; const s = 12 + Math.round(E.rand(i + 2) * 2) * 6;
      ctx.fillRect(Math.round(x), Math.round((y + C.H) % C.H), s, s);
    }
  };
  // píldora de etiqueta (ingrediente + kcal)
  E.pill = function (x, y, label, kcal, scale = 1, emoji = '') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    const t1 = (emoji ? emoji + ' ' : '') + label, t2 = kcal + ' kcal';
    const w1 = E.measure(t1, 38, 'jak', 800), w2 = E.measure(t2, 34, 'pix', 700);
    const w = w1 + w2 + 90, h = 84;
    E.card(-w / 2, -h / 2, w, h, 42, '#fff', true, [5, C.COLORS.orange]);
    E.text(t1, -w / 2 + 30, 14, 38, C.COLORS.ink, 'left', 800);
    E.text(t2, w / 2 - 30, 12, 34, C.COLORS.orange, 'right', 700, 'pix');
    ctx.restore();
  };
  // esquinas naranjas del visor
  E.corners = function (x, y, w, h, len = 70, lw = 12, col = C.COLORS.orange) {
    ctx.save(); ctx.fillStyle = col;
    const c = [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]];
    for (const [cx, cy, sx, sy] of c) {
      ctx.fillRect(sx > 0 ? cx : cx - len, sy > 0 ? cy : cy - lw, len, lw);
      ctx.fillRect(sx > 0 ? cx : cx - lw, sy > 0 ? cy : cy - len, lw, len);
    }
    ctx.restore();
  };
})();
