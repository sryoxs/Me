/* TRAMO B · funciones (1/2): código de barras, plan exacto, Kusi te explica. */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = window.SC, T = C.T;

  /* ---------- código de barras del súper ---------- */
  S.barcode = function (t) {
    const t0 = T.barcode; E.bgCream(t);
    E.header(t, t0, '¿Algo del súper?', 'Escanea su código de barras', { size: 66 });
    // tiendas
    const stores = ['Plaza Vea', 'Tottus', 'Metro'];
    stores.forEach((s, i) => {
      const q = E.pop(t, t0 + 0.35 + i * 0.1, 0.3); if (q <= 0) return;
      const w = E.measure(s, 30, 'jak', 800) + 44, x = E.CX + (i - 1) * 230;
      ctx.save(); ctx.translate(x, 500); ctx.scale(q, q);
      E.card(-w / 2, -30, w, 60, 30, '#fff', false, [3, '#e3d6c3']); E.text(s, 0, 11, 30, C.COLORS.muted, 'center', 800);
      ctx.restore();
    });
    // paquete pixel genérico
    const bob = Math.sin(t * 3) * 6, bx = E.CX - 220, by = 580 + bob, bw = 440, bh = 520, u = 20;
    const q = E.back(E.prog(t, t0 + 0.1, t0 + 0.5));
    ctx.save(); ctx.translate(E.CX, by + bh / 2); ctx.rotate(-0.05); ctx.scale(q, q); ctx.translate(-E.CX, -(by + bh / 2));
    ctx.fillStyle = '#ae5620'; ctx.fillRect(bx + u, by + u, bw, bh);
    ctx.fillStyle = '#f2c14e'; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#e8702a'; ctx.fillRect(bx, by, bw, 5 * u);
    E.text('GALLETAS', bx + bw / 2, by + 66, 44, '#fff', 'center', 700, 'pix');
    E.text('DE AVENA', bx + bw / 2, by + 170, 40, '#8a4a18', 'center', 700, 'pix');
    // espigas pixel
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = j % 2 ? '#d79a06' : '#8a4a18'; ctx.fillRect(bx + 110 + i * 100, by + 200 + j * 22, 22, 18); }
    // código de barras
    const cx0 = bx + 60, cy0 = by + 320, cw = bw - 120, ch = 150;
    ctx.fillStyle = '#fff'; ctx.fillRect(cx0 - 20, cy0 - 16, cw + 40, ch + 56);
    let x = cx0; let i = 0;
    while (x < cx0 + cw) { const w = 3 + Math.floor(E.rand(i) * 4) * 3; if (i % 2 === 0) { ctx.fillStyle = '#141413'; ctx.fillRect(x, cy0, w, ch); } x += w; i++; }
    E.text('7 750000 123456', cx0 + cw / 2, cy0 + ch + 32, 24, '#141413', 'center', 700);
    // láser
    const lp = E.prog(t, t0 + 0.5, t0 + 1.3);
    if (lp > 0 && lp < 1) {
      const ly = cy0 + ch * (0.5 + 0.5 * Math.sin(lp * Math.PI * 3));
      ctx.fillStyle = 'rgba(217,16,35,.25)'; ctx.fillRect(cx0 - 60, ly - 14, cw + 120, 28);
      ctx.fillStyle = '#d91023'; ctx.fillRect(cx0 - 60, ly - 4, cw + 120, 8);
    }
    ctx.restore();
    // resultado
    const r = E.back(E.prog(t, t0 + 1.35, t0 + 1.75));
    if (r > 0) {
      const y = E.lerp(1600, 1180, r), x0 = 110, w = 770;
      E.card(x0, y, w, 250, 34, '#fff', true, [4, C.COLORS.green]);
      ctx.fillStyle = C.COLORS.green; ctx.beginPath(); ctx.arc(x0 + 70, y + 72, 34, 0, Math.PI * 2); ctx.fill();
      E.text('✓', x0 + 70, y + 88, 44, '#fff', 'center', 800);
      E.text('Galletas de avena', x0 + 128, y + 70, 42, C.COLORS.ink, 'left', 800);
      E.text('1 paquete · 45 g', x0 + 128, y + 116, 32, C.COLORS.muted, 'left', 700);
      E.text('198 kcal', x0 + w - 36, y + 205, 60, C.COLORS.orange, 'right', 700, 'pix');
      E.text('P 3 · C 30 · G 7', x0 + 40, y + 200, 30, C.COLORS.muted, 'left', 700);
    }
  };

  /* ---------- plan exacto ---------- */
  S.plan = function (t) {
    const t0 = T.plan; E.bgCream(t);
    E.header(t, t0, 'Tu plan exacto', null, { size: 70 });
    const goals = ['Bajar grasa', 'Mantener', 'Ganar músculo'];
    const sel = 0; // «Bajar grasa» = el plan de 1860 kcal de la captura
    let x = 0; const widths = goals.map((g) => E.measure(g, 32, 'jak', 800) + 60), total = widths.reduce((a, b) => a + b, 0) + 24;
    x = E.CX - total / 2;
    goals.forEach((g, i) => {
      const q = E.pop(t, t0 + 0.2 + i * 0.1, 0.3), on = i === sel && t > t0 + 0.6;
      ctx.save(); ctx.translate(x + widths[i] / 2, 470); ctx.scale(q * (on ? 1.08 : 1), q * (on ? 1.08 : 1));
      E.card(-widths[i] / 2, -36, widths[i], 72, 36, on ? C.COLORS.orange : '#fff', on, on ? null : [3, '#e3d6c3']);
      E.text(g, 0, 11, 32, on ? '#fff' : C.COLORS.ink, 'center', 800);
      ctx.restore(); x += widths[i] + 12;
    });
    const up = E.easeOut(E.prog(t, t0 + 0.15, t0 + 0.7));
    const pw = 520, py = E.lerp(1700, 560, up);
    E.phone(E.CX - pw / 2, py, pw, (sx, sy, sw, sh) => E.shot(E.img.plan, sx, sy, sw, sh, 0));
    // resaltado sobre el número de la captura
    const hp = E.pop(t, t0 + 0.9, 0.35);
    if (hp > 0) {
      const u = (pw * 0.93) / 390, cx = E.CX, cy = py + pw * 0.035 + 272 * u;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(hp, hp);
      ctx.lineWidth = 8; ctx.strokeStyle = C.COLORS.orange; E.rr(-190, -70, 380, 128, 30); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(E.CX + 230, cy - 125); ctx.rotate(0.08); ctx.scale(hp, hp);
      E.card(-150, -46, 300, 92, 20, C.COLORS.ink, true);
      E.text('a tu medida', 0, 12, 34, '#fff', 'center', 800);
      ctx.restore();
    }
  };

  /* ---------- Kusi te explica (coach) ---------- */
  const ANSWER = 'Gastas unas 2137 kcal al día. Te resto 277 para que bajes grasa sin perder músculo. Tranqui, sin sermones 😉';
  S.coach = function (t) {
    const t0 = T.coach; E.bgCream(t);
    E.header(t, t0, 'Kusi te explica', 'cada número, sin sermones', { size: 70 });
    const x0 = 90, y0 = 500, w = 810, h = 900;
    const q = E.easeOut(E.prog(t, t0, t0 + 0.4));
    ctx.save(); ctx.globalAlpha = q; ctx.translate(0, (1 - q) * 80);
    E.card(x0, y0, w, h, 40, '#fff', true);
    // cabecera del chat
    drawKusiHead(ctx, x0 + 36, y0 + 30, 5);
    E.text('Kusi Coach', x0 + 130, y0 + 78, 40, C.COLORS.ink, 'left', 800);
    E.text('IA ACTIVA', x0 + w - 36, y0 + 76, 22, C.COLORS.green, 'right', 700, 'pix');
    ctx.fillStyle = '#efe7da'; ctx.fillRect(x0 + 30, y0 + 120, w - 60, 3);
    // pregunta del usuario
    const qq = E.pop(t, t0 + 0.35, 0.3);
    if (qq > 0) {
      const txt = '¿Por qué 1860 kcal?', bw = E.measure(txt, 36, 'jak', 700) + 60;
      ctx.save(); ctx.translate(x0 + w - 40 - bw / 2, y0 + 200); ctx.scale(qq, qq);
      E.card(-bw / 2, -44, bw, 88, 30, C.COLORS.orange, false); E.text(txt, 0, 12, 36, '#fff', 'center', 700);
      ctx.restore();
    }
    // escribiendo…
    const typingOn = t > t0 + 0.7 && t < t0 + 1.05;
    const by = y0 + 290;
    if (typingOn) {
      E.card(x0 + 40, by, 150, 70, 30, '#f3ece0', false);
      for (let i = 0; i < 3; i++) { const b = Math.sin(t * 14 - i) > 0 ? 6 : 0; ctx.fillStyle = C.COLORS.muted; ctx.fillRect(x0 + 78 + i * 28, by + 30 - b, 14, 14); }
    }
    // respuesta de Kusi escribiéndose
    const n = Math.floor(E.prog(t, t0 + 1.05, t0 + 2.2) * ANSWER.length);
    if (t > t0 + 1.05) {
      E.card(x0 + 40, by, w - 140, 330, 30, '#f3ece0', false);
      E.text('KUSI', x0 + 76, by + 50, 22, C.COLORS.orange, 'left', 700, 'pix');
      E.wrap(ANSWER, x0 + 76, by + 104, w - 220, 38, 54, C.COLORS.ink, 600, 'left', Math.max(1, n));
    }
    // Kusi hablando
    const talking = t > t0 + 1.05 && t < t0 + 2.2 && Math.floor(t * 9) % 2 === 0;
    drawKusi(ctx, x0 + w - 330, y0 + h - 300, 9, { mood: t > t0 + 2.2 ? 'happy' : 'open', talk: talking, hat: 'chullo', ropa: 'poncho', wave: t > t0 + 2.2 ? -2.2 + Math.sin(t * 12) * 0.3 : 0 });
    ctx.restore();
  };
})();
