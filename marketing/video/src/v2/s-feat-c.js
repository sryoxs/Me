/* Funciones (3/3): hazlo tuyo (outfits + tema), cierre y portada. */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = window.SC;

  const LOOKS = [
    { n: 'Chullo + poncho', hat: 'chullo', ropa: 'poncho', fur: 'clasico' },
    { n: 'Blanquirroja 🇵🇪', hat: 'gorraBlanquirroja', ropa: 'blanquirroja', fur: 'clasico' },
    { n: 'Sombrero chotano', hat: 'sombreroChotano', ropa: 'poncho', fur: 'culpeo' },
    { n: 'Lentes de sol', hat: ['gorra', 'lentesSol'], ropa: null, fur: 'chilla' },
    { n: 'Corona dorada', hat: 'corona', ropa: null, fur: 'dorado' },
    { n: 'Modo noche', hat: 'chulloAndino', ropa: 'poncho', fur: 'noche' }
  ];
  S.mikusi = function (t, s0, s1) {
    const tDark = s0 + 1.0, dp = E.expoOut(E.prog(t, tDark, tDark + 0.3)), dark = dp > 0.5;
    E.bg(t, 0);
    if (dp > 0) { // el tema oscuro entra como círculo pixelado desde Kusi
      ctx.save(); const r = 1700 * dp, bs = 40, kc = E.stagePt(540, 900);
      ctx.beginPath();
      for (let j = 0; j < C.H / bs; j++) for (let i = 0; i < C.W / bs; i++) if (Math.hypot(i * bs + 20 - kc.x, j * bs + 20 - kc.y) < r) ctx.rect(i * bs, j * bs, bs, bs);
      ctx.clip(); E.bg(t, 1); ctx.restore();
    }
    ctx.save(); E.camera(t, s0, s1); E.stageIn();
    const idx = E.clamp(Math.floor((t - s0) / 0.25), 0, LOOKS.length - 1), L = LOOKS[idx], ct = s0 + idx * 0.25;
    // pedestal
    ctx.fillStyle = dark ? '#3a3029' : '#eadcc6'; E.rr(260, 1190, 560, 40, 20); ctx.fill();
    const jump = 2.2 * Math.sin(E.prog(t, ct, ct + 0.22) * Math.PI), s = 17;
    const sq = 1 + 0.06 * Math.sin(E.prog(t, ct, ct + 0.22) * Math.PI);
    ctx.save(); ctx.translate(540, 1200); ctx.scale(1 / sq, sq); ctx.translate(-540, -1200);
    drawKusi(ctx, 540 - 18.5 * s, 1200 - 30.5 * s, s, { mood: idx % 2 ? 'happy' : 'open', hat: L.hat, ropa: L.ropa, fur: L.fur, jump, tail: t * 7, wave: idx === 5 ? -2.2 + Math.sin(t * 12) * 0.3 : 0 });
    ctx.restore();
    // destello en cada cambio
    const fl = 1 - E.prog(t, ct, ct + 0.08); if (fl > 0 && idx > 0) { ctx.fillStyle = `rgba(255,255,255,${0.22 * fl})`; ctx.beginPath(); ctx.arc(540, 900, 330, 0, Math.PI * 2); ctx.fill(); }
    E.burst(t, ct, 540, 800, 16, 330, 0.45);
    E.chip(540, 1310, L.n, { size: 38, fill: C.COLORS.orange, color: '#fff', scale: 0.75 + 0.25 * E.pop(t, ct, 0.22, 2.4) });
    ['#faf9f5', '#1c1814', '#8fbf5a', '#eba0ad'].forEach((c, i) => {
      const x = 540 + (i - 1.5) * 96, on = dark ? i === 1 : i === 0, r = on ? 30 : 24;
      ctx.beginPath(); ctx.arc(x, 1420, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
      ctx.lineWidth = on ? 7 : 3; ctx.strokeStyle = on ? C.COLORS.orange : dark ? '#6b5a4c' : '#c9bba6'; ctx.stroke();
    });
    E.stageOut();
    E.title(t, s0, [['HAZLO', ['TUYO', C.COLORS.orange]]], { size: 100, y: 352, dark, sub: 'outfits, pelajes y temas', subGap: 84 });
    ctx.restore();
  };

  /* ---------- cierre ---------- */
  function mountains(t, s0) {
    const u = 30, rise = E.expoOut(E.prog(t, s0, s0 + 0.6));
    const cols = ['#d7e0e3', '#b3c4cb', '#9dc46a', '#79ad4c'];
    for (let layer = 0; layer < 4; layer++) {
      const par = (t - s0) * (8 + layer * 10);
      ctx.fillStyle = cols[layer];
      for (let i = -2; i < C.W / u + 4; i++) {
        const x = i * u - (par % u), idx = i + Math.floor(par / u), base = C.H - (C.MODE === 'h' ? 150 : 360) + layer * (C.MODE === 'h' ? 45 : 80) + (1 - rise) * 400;
        const hgt = (layer < 2 ? Math.max(0, 300 - Math.abs(((idx * u + layer * 330) % 820) - 410) * 0.95) : 40 + 20 * (idx % 2)) * (C.MODE === 'h' ? 0.55 : 1);
        ctx.fillRect(x, Math.round((base - hgt) / u) * u, u + 1, C.H);
      }
    }
  }
  S.cierre = function (t, s0, s1) {
    const Hm = C.MODE === 'h';
    // v: todo centrado en columna; h: logo y textos a la izquierda, Kusi a la derecha
    const L = Hm ? { lx: C.TITLE.x, ly: 360, tx: C.TITLE.x, ty: 560, by: 690, hy: 815, kx: 1360, ky: 150, ks: 17 }
      : { lx: 540, ly: 410, tx: 540, ty: 1090, by: 1225, hy: 1365, kx: 540, ky: 440, ks: 16 };
    E.bg(t); mountains(t, s0);
    ctx.save(); E.camera(t, s0, s1);
    const word = 'KUSICAL', size = 128, lw = E.measure(word, size, 'pix'), fit = Math.min(1, 720 / lw);
    let x = L.lx - (lw * fit) / 2;
    word.split('').forEach((ch, i) => {
      const cw = E.measure(ch, size * fit, 'pix'), p = E.prog(t, s0 + i * 0.0625, s0 + i * 0.0625 + 0.3);
      if (p > 0) { ctx.save(); ctx.translate(x + cw / 2, L.ly - (1 - E.back(p, 2.5)) * 120 + Math.sin(t * 5 + i * 0.7) * 5); ctx.globalAlpha = E.clamp(p * 4); E.pix(ch, 0, 0, size * fit, C.COLORS.orange, C.COLORS.ink); ctx.restore(); }
      x += cw;
    });
    const s = L.ks, kp = E.expoOut(E.prog(t, s0 + 0.2, s0 + 0.6));
    drawKusi(ctx, L.kx - 18.5 * s, L.ky + (1 - kp) * 300, s, { mood: 'happy', hat: 'chullo', ropa: 'poncho', wave: -2.3 + Math.sin(t * 11) * 0.35, jump: 2 * Math.abs(Math.sin((t - s0) * Math.PI * 2)), tail: t * 6 });
    E.burst(t, s0 + 0.05, L.kx, L.ky + 210, 60, 620, 1.2);
    E.burst(t, s0 + 2.0, L.kx, L.ky + 210, 40, 520, 1.0);
    const words = ['Gratis', '·', 'sin', 'descargar'];
    let wx = L.tx - (E.measure(words.join(' '), 60, 'jak', 800)) / 2;
    words.forEach((w, i) => {
      const ww = E.measure(w + ' ', 60, 'jak', 800), p = E.prog(t, s0 + 0.5 + i * 0.125, s0 + 0.8 + i * 0.125);
      if (p > 0) { ctx.save(); ctx.globalAlpha = E.clamp(p * 3); E.text(w, wx, L.ty + (1 - E.expoOut(p)) * 40, 60, i === 3 ? C.COLORS.orange : C.COLORS.ink, 'left', 800); ctx.restore(); }
      wx += ww;
    });
    const b = E.pop(t, s0 + 1.0, 0.3, 2.2), pulse = 1 + 0.035 * E.beatPulse(t, s0 + 1.5);
    E.chip(L.tx, L.by, 'Link en la bio 👆', { size: 48, fill: C.COLORS.orange, color: '#fff', scale: b * pulse, pad: 90 });
    E.chip(L.tx, L.hy, C.HANDLE, { size: 44, fam: 'pix', fill: '#fff', color: C.COLORS.ink, scale: E.pop(t, s0 + 1.25, 0.3, 2.2), pad: 70 });
    ctx.restore();
  };

  /* ---------- portada ---------- */
  window.renderCover = function () {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    E.bg(0);
    // foto real (mitad superior) que se vuelve pixel (mitad inferior)
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, C.W, C.H); ctx.clip();
    E.cover(E.img.plato, 0, 0, C.W, C.H, 1.0, 0.5, 0.56);
    ctx.beginPath(); ctx.moveTo(0, 1250); ctx.lineTo(C.W, 950); ctx.lineTo(C.W, C.H); ctx.lineTo(0, C.H); ctx.clip();
    E.coverPixel(E.img.plato, 0, 0, C.W, C.H, 54, 1.0, 0.5, 0.56); ctx.restore();
    const g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, 'rgba(20,12,6,.8)'); g.addColorStop(1, 'rgba(20,12,6,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, 900);
    const L = [['¿CUÁNTAS', '#fff'], ['KCAL TIENE', '#fff'], ['TU CEVICHE?', '#ffd23f']];
    L.forEach(([s, c], i) => { const fit = Math.min(1, 720 / E.measure(s, 104, 'pix')); E.pix(s, 540, 400 + i * 118, 104 * fit, c, C.COLORS.orange); });
    E.chip(540, 820, 'Ceviche · 450 kcal', { size: 44, fill: '#fff', color: C.COLORS.ink, stroke: C.COLORS.orange, lw: 6, pad: 80 });
    drawKusi(ctx, 540 - 18.5 * 13, 980, 13, { mood: 'happy', hat: 'chullo', ropa: 'poncho', wave: -2.3 });
    E.chip(540, 1440, 'KusiCal lo sabe', { size: 50, fill: C.COLORS.orange, color: '#fff', pad: 90 });
    E.finish(0);
  };
})();
