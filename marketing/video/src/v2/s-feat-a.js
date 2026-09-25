/* Funciones (1/3): comida peruana, código de barras del súper, plan exacto. 2 s cada una. */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = window.SC;

  /* ---------- reconoce comida peruana ---------- */
  const DISHES = [
    { img: 'lomo', fx: 0.62, fy: 0.5, n: 'Lomo saltado', k: 680 },
    { img: 'plato', fx: 0.5, fy: 0.55, n: 'Ceviche', k: 450 },
    { img: 'aji', fx: 0.38, fy: 0.5, n: 'Ají de gallina', k: 610 }
  ];
  S.platos = function (t, s0, s1) {
    E.bg(t); ctx.save(); E.camera(t, s0, s1); E.stageIn();
    const active = E.clamp(Math.floor((t - s0 - 0.5) / 0.5), -1, 2);
    const order = [0, 2, 1].sort((a, b) => (a === active) - (b === active)); // la activa va delante
    for (const i of order) {
      const d = DISHES[i], side = i - 1, inT = s0 + 0.05 + i * 0.1;
      const p = E.expoOut(E.prog(t, inT, inT + 0.45)); if (p <= 0) continue;
      const on = i === active, onP = on ? E.pop(t, s0 + 0.5 + i * 0.5, 0.3, 2) : 0;
      const w = 320, h = 430, cx = 540 + side * 235 + Math.sin(t * 1.6 + i) * 6, cy = 900 + (1 - p) * 700 + Math.cos(t * 1.9 + i) * 8 - (on ? 30 * onP : 0);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(side * 0.11 * (1 - 0.6 * onP) + (1 - p) * side * 0.3); ctx.scale(1 + 0.1 * onP, 1 + 0.1 * onP);
      E.card(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 34, '#fff');
      ctx.save(); E.rr(-w / 2, -h / 2, w, h, 24); ctx.clip();
      E.cover(E.img[d.img], -w / 2, -h / 2, w, h, 1.15, d.fx, d.fy);
      if (on) { // barrido de escaneo sobre la foto
        const sp = E.prog(t, s0 + 0.5 + i * 0.5, s0 + 0.85 + i * 0.5), yy = -h / 2 + h * sp;
        if (sp > 0 && sp < 1) { ctx.fillStyle = 'rgba(232,112,42,.35)'; ctx.fillRect(-w / 2, yy - 60, w, 60); ctx.fillStyle = C.COLORS.orange; ctx.fillRect(-w / 2, yy - 4, w, 8); }
      }
      ctx.restore();
      if (on) { // esquinas del visor
        ctx.fillStyle = C.COLORS.orange; const L = 46, T = 10, ox = w / 2 + 2, oy = h / 2 + 2;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.fillRect(sx * ox - (sx > 0 ? T : 0), sy * oy - (sy > 0 ? L : 0), T, L); ctx.fillRect(sx * ox - (sx > 0 ? L : 0), sy * oy - (sy > 0 ? T : 0), L, T); }
      }
      ctx.restore();
    }
    // etiqueta del plato activo
    if (active >= 0) {
      const d = DISHES[active], ts = s0 + 0.5 + active * 0.5;
      E.chip(540, 1330, d.n + '  ·  ' + d.k + ' kcal', { size: 38, fill: C.COLORS.ink, color: '#fff', scale: 0.75 + 0.25 * E.pop(t, ts, 0.25, 2.5) });
    }
    E.stageOut();
    E.title(t, s0, [['RECONOCE'], ['COMIDA'], [['PERUANA', C.COLORS.orange]]], { size: 84, y: 340 });
    ctx.restore();
  };

  /* ---------- código de barras del súper ---------- */
  function pack(cx, cy, rot, laser) {
    const w = 380, h = 470;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(1.3, 1.3);
    ctx.save(); ctx.shadowColor = 'rgba(60,30,10,.28)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
    ctx.fillStyle = '#f2c14e'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
    ctx.fillStyle = '#d79a06'; ctx.fillRect(w / 2 - 20, -h / 2, 20, h); ctx.fillRect(-w / 2, h / 2 - 16, w, 16);
    ctx.fillStyle = C.COLORS.orange; ctx.fillRect(-w / 2, -h / 2, w, 110);
    E.text('GALLETAS', 0, -h / 2 + 72, 46, '#fff', 'center', 700, 'pix');
    E.text('DE AVENA', 0, -h / 2 + 170, 38, '#8a4a18', 'center', 700, 'pix');
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#8a4a18' : '#b9531a'; ctx.fillRect(-120 + i * 52, -h / 2 + 200, 30, 30); }
    const bx = -w / 2 + 50, by = 20, bw = w - 100, bh = 140;
    ctx.fillStyle = '#fff'; ctx.fillRect(bx - 16, by - 14, bw + 32, bh + 58);
    let x = bx, i = 0; while (x < bx + bw) { const ww = 3 + Math.floor(E.rand(i + 7) * 4) * 3; if (i % 2 === 0) { ctx.fillStyle = '#141413'; ctx.fillRect(x, by, Math.min(ww, bx + bw - x), bh); } x += ww; i++; }
    E.text('7 750182 004512', 0, by + bh + 34, 22, '#141413', 'center', 700);
    if (laser >= 0 && laser <= 1) {
      const ly = by + bh * (0.5 + 0.45 * Math.sin(laser * Math.PI * 4));
      ctx.fillStyle = 'rgba(230,20,40,.25)'; ctx.fillRect(bx - 70, ly - 16, bw + 140, 32);
      ctx.fillStyle = '#e8142a'; ctx.fillRect(bx - 70, ly - 4, bw + 140, 8);
    }
    ctx.restore();
  }
  S.barcode = function (t, s0, s1) {
    E.bg(t); ctx.save(); E.camera(t, s0, s1); E.stageIn();
    ['Plaza Vea', 'Tottus', 'Metro'].forEach((s, i) => {
      const w = E.measure(s, 28, 'jak', 800) + 44, x = 540 + (i - 1) * 215;
      E.chip(x, 548, s, { size: 28, color: C.COLORS.muted, stroke: C.COLORS.line, shadow: false, scale: E.pop(t, s0 + 0.3 + i * 0.0625, 0.25) });
    });
    const p = E.expoOut(E.prog(t, s0, s0 + 0.45));
    pack(540 + Math.sin(t * 2) * 8, 900 + (1 - p) * 800 + Math.sin(t * 2.6) * 10, -0.06 + Math.sin(t * 1.3) * 0.02, E.prog(t, s0 + 0.5, s0 + 0.95) || -1);
    const r = E.prog(t, s0 + 1.0, s0 + 1.4);
    if (r > 0) {
      const y = E.lerp(1600, 1240, E.back(r, 1.4)), x0 = 170, w = 740, n = Math.round(198 * E.expoOut(E.prog(t, s0 + 1.0, s0 + 1.5)));
      E.card(x0, y, w, 210, 36, '#fff', { stroke: C.COLORS.green, lw: 5 });
      ctx.fillStyle = C.COLORS.green; ctx.beginPath(); ctx.arc(x0 + 66, y + 70, 30, 0, Math.PI * 2); ctx.fill();
      E.text('✓', x0 + 66, y + 84, 38, '#fff', 'center', 800);
      E.text('Galletas de avena', x0 + 118, y + 82, 40, C.COLORS.ink, 'left', 800);
      E.text('1 paquete · 45 g', x0 + 40, y + 170, 30, C.COLORS.muted, 'left', 700);
      E.text(n + ' kcal', x0 + w - 36, y + 172, 52, C.COLORS.orange, 'right', 700, 'pix');
    }
    E.stageOut();
    E.title(t, s0, [['¿ALGO', 'DEL'], [['SÚPER?', C.COLORS.orange]]], { size: 90, y: 352, sub: null });
    ctx.restore();
  };

  /* ---------- plan exacto ---------- */
  S.plan = function (t, s0, s1) {
    E.bg(t); ctx.save(); E.camera(t, s0, s1); E.stageIn();
    const goals = ['Bajar grasa', 'Mantener', 'Ganar músculo'], size = 28;
    const ws = goals.map((g) => E.measure(g, size, 'jak', 800) + 50), gap = 14, tot = ws.reduce((a, b) => a + b, 0) + gap * 2;
    const sel = [2, 1, 0][E.clamp(Math.floor((t - s0 - 0.25) / 0.25), 0, 2)];
    let x = 540 - tot / 2;
    goals.forEach((g, i) => {
      const on = sel === i && t > s0 + 0.25, cxx = x + ws[i] / 2, sc = E.pop(t, s0 + 0.2 + i * 0.0625, 0.25) * (on ? 1 + 0.06 * E.pop(t, s0 + 0.25 + [2, 1, 0].indexOf(i) * 0.25, 0.2) : 1);
      E.chip(cxx, 540, g, { size, fill: on ? C.COLORS.orange : '#fff', color: on ? '#fff' : C.COLORS.ink, stroke: on ? null : C.COLORS.line, shadow: on, scale: sc, pad: 50 });
      x += ws[i] + gap;
    });
    const up = E.expoOut(E.prog(t, s0 + 0.05, s0 + 0.55)), py = E.lerp(1950, 610, up) + 8 * Math.sin((t - s0) * 3);
    E.phone(540, py, 520, (sx, sy, sw, sh, u) => {
      E.screen(E.img.plan, sx, sy, sw, sh, u, { pin: 90, bar: '#faf7f2' });
      const hp = E.pop(t, s0 + 1.0, 0.3, 2);
      if (hp > 0) { // resalta el objetivo diario
        const cy = E.shotY(sy, u, 262), ww = 300 * u, hh = 92 * u;
        ctx.save(); ctx.translate(sx + sw / 2, cy); ctx.scale(hp, hp);
        ctx.lineWidth = 6; ctx.strokeStyle = C.COLORS.orange; E.rr(-ww / 2, -hh / 2, ww, hh, 24); ctx.stroke(); ctx.restore();
        E.burst(t, s0 + 1.0, sx + sw / 2, cy, 18, 240, 0.6);
      }
    });
    E.stageOut();
    E.title(t, s0, [['TU', 'PLAN'], [['EXACTO', C.COLORS.orange]]], { size: 92, y: 352 });
    ctx.restore();
  };
})();
