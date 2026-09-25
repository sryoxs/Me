/* Puente (0 → 1 s): Kusi sale del celular de la toma y salta hacia la cámara.
   Escena pixel (1 → 4 s): la foto real del plato se pixelea en 5 golpes, se vuelve un plato pixel
   (¡pop!, drop de la música) y cae al Diario real, que suma +450 kcal. */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = (window.SC = window.SC || {});
  const BLOCKS = [1, 12, 22, 38, 60, 92];
  const STEP = 0.125;                      // semicorchea a 120 BPM
  const T_POP = 1.0, T_LAND = 1.5;
  const SW = 540;                          // ancho de pantalla del iPhone
  const PH_Y = 600;

  // plato pixel 22x22 con máscara circular y borde claro (sale de la foto real)
  let sprite = null;
  S.plateSprite = function () {
    if (sprite) return sprite;
    const N = 22, im = E.img.plato; sprite = document.createElement('canvas'); sprite.width = sprite.height = N;
    const g = sprite.getContext('2d'), side = Math.min(im.width, im.height) * 0.92;
    g.drawImage(im, im.width * 0.5 - side / 2, im.height * 0.56 - side / 2, side, side, 0, 0, N, N);
    const d = g.getImageData(0, 0, N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const r = Math.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5), i = (y * N + x) * 4;
      for (let c = 0; c < 3; c++) d.data[i + c] = E.clamp((d.data[i + c] - 128) * 1.25 + 138, 0, 255);
      if (r > N / 2) d.data[i + 3] = 0;
      else if (r > N / 2 - 1.5) { d.data[i] = 248; d.data[i + 1] = 243; d.data[i + 2] = 232; }
    }
    g.putImageData(d, 0, 0); return sprite;
  };
  S.drawPlate = function (cx, cy, size, rot = 0) {
    const sp = S.plateSprite(), cell = size / sp.width;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.imageSmoothingEnabled = false;
    ctx.shadowColor = 'rgba(60,30,10,.35)'; ctx.shadowOffsetX = cell * 0.5; ctx.shadowOffsetY = cell * 0.9;
    ctx.drawImage(sp, -size / 2, -size / 2, size, size); ctx.restore();
  };

  function shockwave(t, t0, cx, cy) {
    const p = E.prog(t, t0, t0 + 0.45); if (p <= 0 || p >= 1) return;
    const r = 120 + 560 * E.expoOut(p), n = 48;
    ctx.fillStyle = `rgba(232,112,42,${1 - p})`;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; ctx.fillRect(Math.round((cx + Math.cos(a) * r) / 12) * 12, Math.round((cy + Math.sin(a) * r) / 12) * 12, 18, 18); }
  }

  /* ---------- puente: Kusi salta hacia la cámara ---------- */
  S.kusi = function (t, s0, s1) {
    const p = E.prog(t, s0, s1), W = C.W, H = C.H, cx = W / 2, cy0 = H * (C.MODE === 'h' ? 0.62 : 0.6);
    E.bg(t);
    const rays = ctx.createRadialGradient(cx, cy0, 0, cx, cy0, Math.max(W, H) * 0.7);
    rays.addColorStop(0, 'rgba(255,214,150,.9)'); rays.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = rays; ctx.fillRect(0, 0, W, H);
    // líneas de velocidad pixel que salen del centro
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + E.rand(i) * 0.1, r0 = 140 + ((t * 1400 + E.rand(i + 3) * 900) % 900);
      ctx.fillStyle = i % 3 ? 'rgba(232,112,42,.55)' : 'rgba(255,255,255,.8)';
      for (let k = 0; k < 5; k++) { const r = r0 + k * 26; ctx.fillRect(Math.round((cx + Math.cos(a) * r) / 8) * 8, Math.round((cy0 + Math.sin(a) * r) / 8) * 8, 12, 12); }
    }
    // salto: brinco corto (0-0.35) y luego vuela hacia la cámara creciendo (0.35-1)
    const hop = Math.sin(E.prog(p, 0, 0.35) * Math.PI), fly = E.expoIn(E.prog(p, 0.3, 1));
    const s = (C.MODE === 'h' ? 9 : 12) * (1 + 7 * fly + 0.1 * hop), cy = cy0 - hop * 60 - fly * H * 0.08;
    const sq = p < 0.12 ? 1 - 0.18 * Math.sin(E.prog(p, 0, 0.12) * Math.PI) : 1;
    ctx.save(); ctx.translate(cx, cy + 16 * s); ctx.rotate(Math.sin(p * Math.PI) * 0.12); ctx.scale(1 / sq, sq); ctx.translate(-cx, -(cy + 16 * s));
    drawKusi(ctx, cx - 20 * s, cy - 16 * s, s, { mood: p > 0.3 ? 'happy' : 'open', wave: -2.4 + Math.sin(t * 14) * 0.3, jump: 0, tail: t * 9 });
    ctx.restore();
    E.burst(t, s0 + 0.05, cx, cy0, 30, 420, 0.8);
  };

  S.pixel = function (tAbs, sA, sB) {
    const t = tAbs - sA, s1 = sB - sA; // tiempo relativo a la escena
    E.bg(t);
    // ---- 1) foto real → mosaico (0 → 1.0) ----
    if (t < T_POP) {
      const k = E.clamp(Math.floor(t / STEP), 0, 5), block = BLOCKS[k];
      const f = E.expoInOut(E.prog(t, 0.68, T_POP));
      const tp = E.stagePt(540, 880), ts = 600 * C.STAGE.s;
      const w = E.lerp(C.W, ts, f), h = E.lerp(C.H, ts, f), x = E.lerp(0, tp.x - ts / 2, f), y = E.lerp(0, tp.y - ts / 2, f);
      const zoom = E.lerp(1.12, 1.0, E.expoOut(E.prog(t, 0, 0.7)));
      const bump = 1 + 0.04 * Math.exp(-(t - k * STEP) / 0.05) * (k > 0 ? 1 : 0); // "latido" en cada paso
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(bump, bump); ctx.translate(-(x + w / 2), -(y + h / 2));
      E.rr(x, y, w, h, E.lerp(0, ts / 2, f)); ctx.clip();
      E.coverPixel(E.img.plato, x, y, w, h, block * E.lerp(1, 0.6, f), zoom, 0.5, 0.56);
      ctx.restore();
      if (k > 0) { // conteo de pasos pixel
        const q = E.pop(t, k * STEP, 0.18);
        ctx.save(); ctx.globalAlpha = E.clamp(1 - f * 3); ctx.translate(C.W / 2, C.H * (C.MODE === 'h' ? 0.8 : 0.68)); ctx.scale(q, q);
        E.pix('PIXEL x' + [0, 2, 4, 8, 16, 32][k], 0, 0, 64, '#fff', C.COLORS.ink); ctx.restore();
      }
      return;
    }
    // ---- 2) ¡pop! + teléfono con el Diario real (1.0 → 3.0) ----
    ctx.save(); E.camera(t, T_POP, s1); E.stageIn();
    const rise = E.expoOut(E.prog(t, T_POP + 0.05, T_POP + 0.5));
    const py = E.lerp(C.H + 60, PH_Y, rise) + 10 * Math.sin((t - 1) * 3);
    let target = null;
    E.phone(540, py, SW, (sx, sy, sw, sh, u) => {
      E.screen(E.img.before, sx, sy, sw, sh, u, { pin: 88 });
      const rv = E.expoOut(E.prog(t, T_LAND, T_LAND + 0.35));
      if (rv > 0) { // la tarjeta "Cena" se expande con los ingredientes reales
        const yTop = sy, yRow = E.shotY(sy, u, 350), yEnd = sy + sh - 88 * u;
        ctx.save(); ctx.beginPath(); ctx.rect(sx, yTop, sw, E.lerp(yRow, yEnd, rv) - yTop); ctx.clip();
        E.screen(E.img.after, sx, sy, sw, sh, u, { pin: 88 }); ctx.restore();
      }
      target = { x: sx + 55 * u, y: E.shotY(sy, u, 314), kx: sx + 300 * u, u };
    });
    // plato pixel: aparece con ¡pop!, flota y cae dentro de la fila "Cena"
    const fly = E.expoInOut(E.prog(t, T_POP + 0.2, T_LAND));
    const sizeA = 560, sizeB = 50 * target.u;
    const cx = E.lerp(540, target.x, fly), cy = E.lerp(880, target.y, fly) - Math.sin(fly * Math.PI) * 180;
    const popS = E.pop(t, T_POP, 0.3, 2.4);
    const land = E.prog(t, T_LAND, T_LAND + 0.25), squash = 1 + 0.25 * Math.sin(land * Math.PI) * (1 - land);
    S.drawPlate(cx, cy, E.lerp(sizeA, sizeB, fly) * (t < T_POP + 0.3 ? popS : 1) * squash, fly * Math.PI * 2 + Math.sin(t * 5) * 0.05 * (1 - fly));
    shockwave(t, T_POP, 540, 880);
    E.burst(t, T_POP, 540, 880, 60, 700, 1.1);
    E.burst(t, T_LAND, target.x, target.y, 28, 260, 0.8);
    // +450 kcal sobre el número de la fila
    if (t > T_LAND) {
      const n = Math.round(C.PLATO.total * E.expoOut(E.prog(t, T_LAND, T_LAND + 0.45)));
      ctx.save();
      // nace sobre el número de la fila y sube a su lugar sobre el teléfono (no tapa nada)
      const m = E.expoInOut(E.prog(t, T_LAND + 0.3, T_LAND + 0.65));
      E.chip(E.lerp(Math.min(target.kx, 800), 540, m), E.lerp(target.y, 535, m), '+' + n + ' kcal', { fam: 'pix', size: 40, fill: C.COLORS.orange, color: '#fff', scale: E.pop(t, T_LAND, 0.3, 2.5) });
      ctx.restore();
    }
    E.stageOut();
    E.title(t, T_POP + 0.05, [['DIRECTO'], ['AL', ['DIARIO', C.COLORS.orange]]], { size: 92, y: 352 });
    ctx.restore();
  };
})();
