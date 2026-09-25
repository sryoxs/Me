/* Motor v2: easing, cámara virtual, fondo premium (degradado + polvo pixel + grano + viñeta),
   tipografía cinética y mockup de iPhone con proporciones reales. Todo determinista en t. */
(function () {
  const C = window.CFG;
  const cv = document.getElementById('cv'); cv.width = C.W; cv.height = C.H; cv.style.width = C.W + 'px'; cv.style.height = C.H + 'px';
  const ctx = cv.getContext('2d');
  const E = (window.E = { ctx, cv, img: {} });

  E.load = (map) => Promise.all(Object.entries(map).map(([k, srcs]) => new Promise((ok, ko) => {
    const list = Array.isArray(srcs) ? srcs.slice() : [srcs];
    const next = () => {
      if (!list.length) return ko(new Error('No cargó ' + k));
      const im = new Image(); im.onload = () => { E.img[k] = im; ok(); }; im.onerror = next; im.src = list.shift();
    };
    next();
  })));

  /* ---------- tiempo ---------- */
  E.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  E.lerp = (a, b, p) => a + (b - a) * p;
  E.prog = (t, a, b) => E.clamp((t - a) / (b - a));
  E.expoOut = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  E.expoIn = (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10));
  E.expoInOut = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2);
  E.cubicOut = (p) => 1 - Math.pow(1 - p, 3);
  E.back = (p, s = 1.6) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  E.pop = (t, a, d = 0.28, s) => E.back(E.prog(t, a, a + d), s);
  E.rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const BEAT = 60 / C.BPM;
  E.BEAT = BEAT;
  // pulso que decae después de cada tiempo (para "punch-in" al ritmo)
  E.beatPulse = (t, t0) => { if (t < t0) return 0; const k = Math.floor((t - t0) / BEAT), dt = t - t0 - k * BEAT; return Math.exp(-dt / 0.09) * (k % 4 === 0 ? 1 : 0.55); };

  /* ---------- formas ---------- */
  E.rr = (x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2); ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  // tarjeta con sombra difusa en dos capas (ambiente + contacto)
  E.card = (x, y, w, h, r, fill, o = {}) => {
    ctx.save();
    if (o.shadow !== false) {
      ctx.shadowColor = 'rgba(60,30,10,.16)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 22; E.rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
      ctx.shadowColor = 'rgba(60,30,10,.12)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    }
    E.rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
    if (o.stroke) { ctx.save(); E.rr(x, y, w, h, r); ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.stroke; ctx.stroke(); ctx.restore(); }
  };
  E.cover = (im, x, y, w, h, zoom = 1, fx = 0.5, fy = 0.5) => {
    const s = Math.max(w / im.width, h / im.height) * zoom, sw = w / s, sh = h / s;
    const sx = E.clamp(fx * im.width - sw / 2, 0, im.width - sw), sy = E.clamp(fy * im.height - sh / 2, 0, im.height - sh);
    ctx.drawImage(im, sx, sy, sw, sh, x, y, w, h);
  };
  const tmp = document.createElement('canvas'), tctx = tmp.getContext('2d');
  E.coverPixel = (im, x, y, w, h, block, zoom = 1, fx = 0.5, fy = 0.5) => {
    if (block <= 1.5) return E.cover(im, x, y, w, h, zoom, fx, fy);
    const cw = Math.max(1, Math.round(w / block)), ch = Math.max(1, Math.round(h / block));
    tmp.width = cw; tmp.height = ch;
    const s = Math.max(w / im.width, h / im.height) * zoom, sw = w / s, sh = h / s;
    const sx = E.clamp(fx * im.width - sw / 2, 0, im.width - sw), sy = E.clamp(fy * im.height - sh / 2, 0, im.height - sh);
    tctx.imageSmoothingEnabled = true; tctx.drawImage(im, sx, sy, sw, sh, 0, 0, cw, ch);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, cw, ch, x, y, w, h); ctx.restore();
  };

  /* ---------- texto ---------- */
  E.font = (size, fam = 'jak', w = 800) => (fam === 'pix' ? `700 ${size}px Silkscreen, "Noto Color Emoji"` : `${w} ${size}px "Plus Jakarta Sans", "Noto Color Emoji"`);
  E.measure = (txt, size, fam = 'jak', w = 800) => { ctx.save(); ctx.font = E.font(size, fam, w); const m = ctx.measureText(txt).width; ctx.restore(); return m; };
  E.text = (txt, x, y, size, color = C.COLORS.ink, align = 'center', w = 800, fam = 'jak') => {
    ctx.save(); ctx.font = E.font(size, fam, w); ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.fillText(txt, x, y); ctx.restore();
  };
  // texto pixel con sombra dura desplazada (look del logo de la app)
  E.pix = (txt, x, y, size, color, shadow, align = 'center', off = 0.085) => {
    ctx.save(); ctx.font = E.font(size, 'pix'); ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    const o = Math.max(3, Math.round(size * off));
    if (shadow) { ctx.fillStyle = shadow; ctx.fillText(txt, x + o, y + o); }
    ctx.fillStyle = color; ctx.fillText(txt, x, y); ctx.restore();
  };
  E.wrap = (txt, x, y, maxW, size, lh, color, w = 700, upto = Infinity) => {
    ctx.save(); ctx.font = E.font(size, 'jak', w); ctx.fillStyle = color; ctx.textAlign = 'left';
    const lines = []; let line = '';
    for (const word of txt.split(' ')) { const tt = line ? line + ' ' + word : word; if (ctx.measureText(tt).width > maxW && line) { lines.push(line); line = word; } else line = tt; }
    if (line) lines.push(line);
    let shown = 0; lines.forEach((l, i) => { const rest = upto - shown; if (rest > 0) ctx.fillText(l.slice(0, rest), x, y + i * lh); shown += l.length + 1; });
    ctx.restore(); return lines.length;
  };
  /* Título cinético: palabras que entran una por semicorchea (escala con rebote + subida),
     centrado en C.CX, cabe siempre en maxW. lines = [['PALABRA', color?], ...] por línea. */
  E.title = (t, t0, lines, o = {}) => {
    const T = C.TITLE, size0 = o.size || 92, maxW = T.maxW, lh = size0 * 1.12;
    const nl = lines.length, y0 = C.MODE === 'h' ? T.y - ((nl - 1) * lh) / 2 - (o.sub ? 40 : 0) : (o.y || T.y);
    const dark = o.dark;
    let k = 0;
    lines.forEach((ln, li) => {
      const words = ln.map((w) => (Array.isArray(w) ? w : [w]));
      const gap = size0 * 0.42;
      const full = words.reduce((a, [w]) => a + E.measure(w, size0, 'pix'), 0) + gap * (words.length - 1);
      const fit = Math.min(1, maxW / full), size = size0 * fit;
      let x = T.x - (full * fit) / 2;
      words.forEach(([w, col]) => {
        const ww = E.measure(w, size, 'pix'), ts = t0 + k * (o.step || 0.125); k++;
        const p = E.prog(t, ts, ts + 0.3); if (p <= 0) { x += ww + gap * fit; return; }
        const sc = E.back(p, 2.2), yy = y0 + li * lh * fit + (1 - E.expoOut(p)) * 50;
        ctx.save(); ctx.globalAlpha = E.clamp(p * 4); ctx.translate(x + ww / 2, yy); ctx.scale(0.5 + 0.5 * sc, 0.5 + 0.5 * sc);
        const fill = col || (dark ? '#fff' : C.COLORS.ink), sh = col ? (dark ? '#000' : C.COLORS.ink) : C.COLORS.orange;
        E.pix(w, 0, 0, size, fill, sh); ctx.restore();
        x += ww + gap * fit;
      });
    });
    if (o.sub) {
      const ts = t0 + k * (o.step || 0.125) + 0.05, p = E.expoOut(E.prog(t, ts, ts + 0.35));
      const yy = y0 + (lines.length - 1) * lh + (C.MODE === 'h' ? T.subGap : o.subGap || T.subGap);
      ctx.save(); ctx.globalAlpha = p; ctx.beginPath(); ctx.rect(0, yy - 60, C.W, 80); ctx.clip();
      E.text(o.sub, T.x, yy + (1 - p) * 50, o.subSize || 42, dark ? '#efe6da' : C.COLORS.muted, 'center', 800);
      ctx.restore();
    }
  };

  /* ---------- fondo premium ---------- */
  E.bg = (t, dark = 0) => {
    const g = ctx.createLinearGradient(0, 0, 0, C.H);
    g.addColorStop(0, dark ? '#221c17' : '#fdf9f3'); g.addColorStop(1, dark ? '#120f0c' : '#f3e6d3');
    ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
    // resplandor naranja que deriva
    const gx = C.W / 2 + Math.sin(t * 0.6) * 160, gy = C.H * 0.45 + Math.cos(t * 0.5) * 120;
    const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(C.W, C.H) * 0.4);
    rg.addColorStop(0, dark ? 'rgba(232,112,42,.22)' : 'rgba(232,112,42,.13)'); rg.addColorStop(1, 'rgba(232,112,42,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, C.W, C.H);
    // polvo pixel en dos capas de parallax
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 20; i++) {
      const id = i + layer * 40, sp = layer ? 70 : 28, s = layer ? 12 : 8;
      const x = E.rand(id) * C.W + Math.sin(t + id) * 10, y = ((E.rand(id + 9) * C.H - t * sp) % C.H + C.H) % C.H;
      ctx.fillStyle = dark ? `rgba(255,220,180,${layer ? 0.16 : 0.1})` : `rgba(232,112,42,${layer ? 0.14 : 0.09})`;
      ctx.fillRect(Math.round(x / 4) * 4, Math.round(y / 4) * 4, s, s);
    }
  };
  // grano (6 texturas precalculadas) + viñeta suave: se aplican sobre el cuadro final
  const grains = [];
  for (let k = 0; k < 6; k++) {
    const g = document.createElement('canvas'); g.width = 540; g.height = 960; const gc = g.getContext('2d');
    const d = gc.createImageData(540, 960);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (E.rand(i * 0.37 + k * 999.1) - 0.5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    gc.putImageData(d, 0, 0); grains.push(g);
  }
  E.finish = (t) => {
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
    ctx.drawImage(grains[Math.floor(t * C.FPS) % 6], 0, 0, C.W, C.H); ctx.restore();
    const R = Math.max(C.W, C.H), v = ctx.createRadialGradient(C.W / 2, C.H / 2, R * 0.27, C.W / 2, C.H / 2, R * 0.65);
    v.addColorStop(0, 'rgba(30,15,5,0)'); v.addColorStop(1, 'rgba(30,15,5,.22)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, C.W, C.H);
  };

  /* ---------- cámara virtual ---------- */
  // micro-zoom continuo 1.00→1.04 dentro de cada escena + punch-in en cada tiempo
  E.camera = (t, s0, s1) => {
    const z = 1 + 0.04 * E.prog(t, s0, s1) + 0.022 * E.beatPulse(t, s0);
    const ax = C.W / 2, ay = C.H * 0.46; ctx.translate(ax, ay); ctx.scale(z, z); ctx.translate(-ax, -ay);
  };

  /* ---------- escenario (contenido diseñado a 1080 de ancho) ---------- */
  const ST = C.STAGE;
  E.stageIn = () => { ctx.save(); ctx.translate(ST.x, ST.y); ctx.scale(ST.s, ST.s); ctx.translate(-ST.cx, -ST.cy); };
  E.stageOut = () => ctx.restore();
  E.stagePt = (x, y) => ({ x: ST.x + (x - ST.cx) * ST.s, y: ST.y + (y - ST.cy) * ST.s });

  /* ---------- iPhone ---------- */
  // Pantalla 390x844 pt; bisel 4.5 %; esquinas y Dynamic Island reales. x = centro.
  E.phoneSize = (sw) => { const b = sw * 0.045; return { sw, sh: sw * 844 / 390, b, w: sw + 2 * b, h: sw * 844 / 390 + 2 * b, u: sw / 390 }; };
  E.phone = (cx, y, sw, drawScreen, o = {}) => {
    const P = E.phoneSize(sw), x = cx - P.w / 2, r = P.w * 0.165;
    ctx.save();
    if (o.rot) { ctx.translate(cx, y + P.h / 2); ctx.rotate(o.rot); ctx.translate(-cx, -(y + P.h / 2)); }
    ctx.save(); ctx.shadowColor = 'rgba(50,25,8,.28)'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 45;
    E.rr(x, y, P.w, P.h, r); ctx.fillStyle = '#2a2724'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.shadowColor = 'rgba(50,25,8,.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
    const fg = ctx.createLinearGradient(x, 0, x + P.w, 0);
    fg.addColorStop(0, '#57524d'); fg.addColorStop(0.08, '#2c2926'); fg.addColorStop(0.92, '#2c2926'); fg.addColorStop(1, '#57524d');
    E.rr(x, y, P.w, P.h, r); ctx.fillStyle = fg; ctx.fill(); ctx.restore();
    // botones laterales
    ctx.fillStyle = '#3d3935';
    [[0.19, 0.05], [0.26, 0.09], [0.37, 0.09]].forEach(([p, l]) => E.rr(x - 5, y + P.h * p, 7, P.h * l, 3) || ctx.fill());
    E.rr(x + P.w - 2, y + P.h * 0.29, 7, P.h * 0.13, 3); ctx.fill();
    E.rr(x + P.b * 0.35, y + P.b * 0.35, P.w - P.b * 0.7, P.h - P.b * 0.7, r - P.b * 0.35); ctx.fillStyle = '#0b0a09'; ctx.fill();
    const sx = x + P.b, sy = y + P.b;
    ctx.save(); E.rr(sx, sy, P.sw, P.sh, r - P.b); ctx.clip();
    ctx.fillStyle = C.COLORS.cream; ctx.fillRect(sx, sy, P.sw, P.sh);
    drawScreen(sx, sy, P.sw, P.sh, P.u);
    // brillo sutil del vidrio
    const gl = ctx.createLinearGradient(sx, sy, sx + P.sw, sy + P.sh * 0.6);
    gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(0.45, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(sx, sy, P.sw, P.sh);
    ctx.restore();
    // Dynamic Island
    E.rr(cx - P.u * 62, sy + P.u * 11, P.u * 124, P.u * 36, P.u * 18); ctx.fillStyle = '#050505'; ctx.fill();
    ctx.restore();
    return Object.assign(P, { x, y, sx, sy });
  };
  // barra de estado iOS (9:41, señal, wifi, batería) sobre fondo del color de la app
  E.statusBar = (sx, sy, sw, u, bg = '#fdf9f3', fg = '#141413') => {
    ctx.fillStyle = bg; ctx.fillRect(sx, sy, sw, 54 * u);
    E.text('9:41', sx + 58 * u, sy + 37 * u, 17 * u, fg, 'center', 700);
    ctx.fillStyle = fg; const bx = sx + sw - 88 * u, by = sy + 27 * u;
    for (let i = 0; i < 4; i++) ctx.fillRect(bx + i * 5 * u, by + (3 - i) * 2.5 * u, 3.4 * u, (4 + i * 2.5) * u);
    ctx.beginPath(); ctx.arc(bx + 34 * u, by + 12 * u, 9 * u, -Math.PI * 0.78, -Math.PI * 0.22); ctx.lineTo(bx + 34 * u, by + 12 * u); ctx.fill();
    E.rr(bx + 50 * u, by, 24 * u, 12 * u, 3.5 * u); ctx.lineWidth = 1.3 * u; ctx.strokeStyle = fg; ctx.stroke();
    E.rr(bx + 52 * u, by + 2 * u, 18 * u, 8 * u, 2 * u); ctx.fill();
  };
  /* Captura real 390x844 dentro de la pantalla: barra de estado arriba (la isla no tapa nada)
     y, si pin > 0, los últimos `pin` pt (barra de navegación) fijos abajo. Nada se estira. */
  const barCache = new Map();
  const topColor = (im) => { // color de la primera fila de la captura (para continuar la barra de estado)
    if (!barCache.has(im)) { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.drawImage(im, im.width / 2, 2, 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; barCache.set(im, `rgb(${d[0]},${d[1]},${d[2]})`); }
    return barCache.get(im);
  };
  E.screen = (im, sx, sy, sw, sh, u, o = {}) => {
    const k = im.width / 390, top = 54, pin = o.pin || 0, avail = 844 - top;
    E.statusBar(sx, sy, sw, u, o.bar || topColor(im));
    const bodyH = avail - pin;
    ctx.drawImage(im, 0, (o.dy || 0) * k, im.width, bodyH * k, sx, sy + top * u, sw, bodyH * u);
    if (pin) ctx.drawImage(im, 0, (844 - pin) * k, im.width, pin * k, sx, sy + (top + bodyH) * u, sw, pin * u);
    // indicador de inicio
    E.rr(sx + sw / 2 - 67 * u, sy + sh - 13 * u, 134 * u, 5 * u, 2.5 * u); ctx.fillStyle = 'rgba(20,20,19,.85)'; ctx.fill();
  };
  // pt de la captura → px de pantalla (para anclar animaciones a la UI real)
  E.shotY = (sy, u, ptY) => sy + (54 + ptY) * u;

  /* ---------- partículas ---------- */
  E.burst = (t, t0, cx, cy, n = 40, spread = 480, dur = 0.9, cols = ['#e8702a', '#f2c14e', '#ffffff', '#c33c4e', '#1b8a6b', '#f4a463']) => {
    const p = E.prog(t, t0, t0 + dur); if (p <= 0 || p >= 1) return;
    for (let i = 0; i < n; i++) {
      const a = E.rand(i + 3 + t0) * Math.PI * 2, v = (0.35 + E.rand(i + 9) * 0.65) * spread;
      const x = cx + Math.cos(a) * v * E.expoOut(p), y = cy + Math.sin(a) * v * E.expoOut(p) + 420 * p * p;
      const s = 10 + Math.round(E.rand(i + 5) * 2) * 6;
      ctx.globalAlpha = 1 - E.expoIn(p); ctx.fillStyle = cols[i % cols.length];
      ctx.save(); ctx.translate(x, y); ctx.rotate(p * 6 * (E.rand(i) - 0.5)); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
    }
    ctx.globalAlpha = 1;
  };
  E.chip = (x, y, label, o = {}) => {
    const size = o.size || 34, w = E.measure(label, size, o.fam || 'jak', 800) + (o.pad || 56), h = size * 2.05;
    ctx.save(); ctx.translate(x, y); if (o.scale !== undefined) ctx.scale(o.scale, o.scale);
    E.card(-w / 2, -h / 2, w, h, h / 2, o.fill || '#fff', { stroke: o.stroke, lw: o.lw || 3, shadow: o.shadow });
    E.text(label, 0, size * 0.36, size, o.color || C.COLORS.ink, 'center', 800, o.fam || 'jak');
    ctx.restore(); return w;
  };
})();
