/* TRAMO B · funciones (2/2): racha, comunidad, personalización y cierre. */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = window.SC, T = C.T;

  /* ---------- racha diaria ---------- */
  S.racha = function (t) {
    const t0 = T.racha; E.bgCream(t);
    E.header(t, t0, 'Tu racha diaria', 'anota cada día y no la rompas', { size: 70 });
    const days = 'LMMJVSD'.split(''), lit = Math.floor(E.prog(t, t0 + 0.4, t0 + 1.6) * 7 + 0.001);
    const beat = 1 + 0.08 * Math.max(0, Math.sin(t * 9));
    const s = 34 * E.back(E.prog(t, t0 + 0.05, t0 + 0.45));
    ctx.save(); ctx.translate(E.CX, 900); ctx.scale(beat, 2 - beat); drawFire(ctx, -5 * s, -11 * s, s); ctx.restore();
    const n = Math.max(1, lit);
    const np = E.pop(t, t0 + 0.4 + (n - 1) * (1.2 / 7), 0.2);
    ctx.save(); ctx.translate(E.CX, 1100); ctx.scale(0.8 + 0.2 * np, 0.8 + 0.2 * np);
    E.pixTitle(String(n), 0, 0, 170); ctx.restore();
    E.text('días de racha', E.CX, 1205, 46, C.COLORS.ink, 'center', 800);
    days.forEach((d, i) => {
      const x = E.CX - 3 * 112 + i * 112, on = i < lit;
      const q = on ? E.pop(t, t0 + 0.4 + i * (1.2 / 7), 0.25) : 1;
      E.card(x - 46, 1255, 92, 150, 22, on ? '#fff4ea' : '#fff', false, [3, on ? C.COLORS.orange : '#e3d6c3']);
      ctx.save(); ctx.translate(x, 1310); ctx.scale(q, q); drawFire(ctx, -25, -28, 5, !on); ctx.restore();
      E.text(d, x, 1380, 28, on ? C.COLORS.orange : C.COLORS.muted, 'center', 800);
    });
    E.burst(t, t0 + 1.65, E.CX, 900, 40, 520);
  };

  /* ---------- comunidad ---------- */
  const FEED = [
    { img: 'ceviche', fx: 0.5, fy: 0.45, user: '@mafe.lima', fur: 'clasico', hat: 'chullo', dish: 'Ceviche', kcal: 420, likes: 38, streak: 12 },
    { img: 'lomo', fx: 0.6, fy: 0.5, user: '@joaco_fit', fur: 'culpeo', hat: 'gorra', dish: 'Lomo saltado', kcal: 680, likes: 24, streak: 5 },
    { img: 'aji', fx: 0.4, fy: 0.5, user: '@sofi.cusco', fur: 'chilla', hat: 'gorroLana', dish: 'Ají de gallina', kcal: 610, likes: 51, streak: 21 },
    { img: 'ceviche', fx: 0.3, fy: 0.75, user: '@ale_trujillo', fur: 'dorado', hat: 'corona', dish: 'Ceviche con cancha', kcal: 470, likes: 17, streak: 3 }
  ];
  S.comunidad = function (t) {
    const t0 = T.comunidad; E.bgCream(t);
    const top = 540, bottom = 1500, ch = 330, gap = 26;
    const scroll = E.easeInOut(E.prog(t, t0 + 0.9, t0 + 2.8)) * (ch + gap) * 1.6;
    ctx.save(); ctx.beginPath(); ctx.rect(0, top - 30, C.W, bottom - top + 30); ctx.clip();
    FEED.forEach((f, i) => {
      const q = E.easeOut(E.prog(t, t0 + 0.15 + i * 0.12, t0 + 0.55 + i * 0.12));
      const y = top + i * (ch + gap) - scroll + (1 - q) * 160, x = 90, w = 810;
      if (y > bottom || y + ch < top - 40) return;
      ctx.save(); ctx.globalAlpha = q;
      E.card(x, y, w, ch, 34, '#fff', true);
      // plato pixelado de otro usuario
      ctx.save(); E.rr(x + 22, y + 22, 286, 286, 24); ctx.clip();
      E.coverPixel(E.img[f.img], x + 22, y + 22, 286, 286, 22, 1.3, f.fx, f.fy); ctx.restore();
      drawKusiHead(ctx, x + 336, y + 36, 3.4, f.fur, f.hat);
      E.text(f.user, x + 400, y + 72, 32, C.COLORS.ink, 'left', 800);
      E.text(f.dish, x + 336, y + 150, 40, C.COLORS.ink, 'left', 800);
      E.text(f.kcal + ' kcal', x + 336, y + 206, 38, C.COLORS.orange, 'left', 700, 'pix');
      // like animado
      const lt = t0 + 0.9 + i * 0.45, lp = E.pop(t, lt, 0.3), liked = t > lt;
      ctx.save(); ctx.translate(x + 356, y + 268); ctx.scale(liked ? 0.8 + 0.2 * lp : 1, liked ? 0.8 + 0.2 * lp : 1);
      E.text(liked ? '❤️' : '🤍', 0, 12, 34, '#000', 'center', 400); ctx.restore();
      E.text(String(f.likes + (liked ? 1 : 0)), x + 390, y + 280, 30, C.COLORS.muted, 'left', 800);
      drawFire(ctx, x + 500, y + 244, 3.4); E.text(f.streak + ' días', x + 545, y + 280, 30, C.COLORS.muted, 'left', 800);
      ctx.restore();
    });
    ctx.restore();
    // cabecera por encima del feed
    const g = ctx.createLinearGradient(0, 230, 0, 560); g.addColorStop(0, C.COLORS.cream); g.addColorStop(0.8, C.COLORS.cream); g.addColorStop(1, 'rgba(250,249,245,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, 560);
    E.header(t, t0, 'La comunidad', 'mira qué comen y súmate a retos', { size: 70 });
  };

  /* ---------- personaliza a tu Kusi ---------- */
  const LOOKS = [
    { n: 'Chullo + poncho', hat: 'chullo', ropa: 'poncho', fur: 'clasico' },
    { n: 'Blanquirroja 🇵🇪', hat: 'gorraBlanquirroja', ropa: 'blanquirroja', fur: 'clasico' },
    { n: 'Sombrero chotano', hat: 'sombreroChotano', ropa: 'poncho', fur: 'culpeo' },
    { n: 'Lentes de sol 😎', hat: ['gorra', 'lentesSol'], ropa: null, fur: 'chilla' },
    { n: 'Corona dorada', hat: 'corona', ropa: null, fur: 'dorado' },
    { n: 'Chullo andino', hat: 'chulloAndino', ropa: 'poncho', fur: 'clasico' }
  ];
  S.mikusi = function (t) {
    const t0 = T.mikusi, dark = t > t0 + 1.55;
    const dp = E.prog(t, t0 + 1.4, t0 + 1.7);
    E.bgCream(t);
    if (dp > 0) { // tema oscuro que entra en bloques
      ctx.save(); const bs = 90;
      for (let j = 0; j < 22; j++) for (let i = 0; i < 12; i++) if (E.rand(i * 31 + j) * 0.5 + (Math.abs(i - 5.5) + Math.abs(j - 11)) / 34 < dp * 1.4) { ctx.fillStyle = '#1f1b18'; ctx.fillRect(i * bs, j * bs, bs + 1, bs + 1); }
      for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,236,190,${0.5 * dp})`; ctx.fillRect(E.rand(i + 80) * C.W, E.rand(i + 90) * 1500, 8, 8); }
      ctx.restore();
    }
    const ink = dark ? '#fff' : C.COLORS.ink;
    E.header(t, t0, 'Hazlo tuyo', 'outfits, pelajes y temas', { size: 76, subColor: ink, shadow: dark ? '#3a2a1f' : '#e3d6c3' });
    const idx = Math.min(LOOKS.length - 1, Math.floor(E.prog(t, t0 + 0.2, t0 + 2.9) * LOOKS.length));
    const L = LOOKS[idx], ct = t0 + 0.2 + idx * (2.7 / LOOKS.length);
    const jump = 2.5 * Math.sin(E.prog(t, ct, ct + 0.3) * Math.PI);
    // pedestal
    ctx.fillStyle = dark ? '#3a322c' : '#efe4d2'; ctx.fillRect(E.CX - 300, 1180, 600, 36); ctx.fillStyle = dark ? '#2b2521' : '#e3d6c3'; ctx.fillRect(E.CX - 300, 1216, 600, 18);
    const s = 19;
    drawKusi(ctx, E.CX - 18 * s - 30, 1180 - 30 * s, s, { mood: idx % 2 ? 'happy' : 'open', hat: L.hat, ropa: L.ropa, fur: L.fur, jump, tail: t * 6 });
    E.burst(t, ct, E.CX, 820, 22, 380, 0.5);
    // chip con el nombre del look
    const q = E.pop(t, ct, 0.25), w = E.measure(L.n, 38, 'jak', 800) + 70;
    ctx.save(); ctx.translate(E.CX, 1310); ctx.scale(q, q);
    E.card(-w / 2, -42, w, 84, 42, C.COLORS.orange, true); E.text(L.n, 0, 13, 38, '#fff', 'center', 800); ctx.restore();
    // selector de temas
    const sw = ['#faf9f5', '#1f1b18', '#8fbf5a', '#eba0ad'];
    sw.forEach((c, i) => {
      const x = E.CX - 150 + i * 100, on = dark ? i === 1 : i === 0;
      ctx.beginPath(); ctx.arc(x, 1440, on ? 34 : 28, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
      ctx.lineWidth = on ? 8 : 3; ctx.strokeStyle = on ? C.COLORS.orange : '#b9ad9c'; ctx.stroke();
    });
    if (dark) { const qq = E.pop(t, t0 + 1.6, 0.3); ctx.save(); ctx.translate(E.CX + 270, 1440); ctx.scale(qq, qq); E.text('🌙', 0, 16, 48, '#000', 'center', 400); ctx.restore(); }
  };

  /* ---------- cierre ---------- */
  function mountains(t) {
    const cols = ['#c9d6dc', '#9fb4bd', '#8fbf5a', '#6ea345'];
    const u = 30;
    for (let layer = 0; layer < 4; layer++) {
      ctx.fillStyle = cols[layer];
      for (let i = 0; i < 38; i++) {
        const x = i * u, base = 1380 + layer * 90;
        const hgt = layer < 2 ? Math.max(0, 260 - Math.abs(((i * u + layer * 300) % 760) - 380) * 0.9) : 40 + 20 * (i % 2);
        ctx.fillRect(x, Math.round((base - hgt) / u) * u, u, C.H);
      }
    }
  }
  S.cierre = function (t) {
    const t0 = T.cierre; E.bgCream(t, '#faf9f5');
    mountains(t);
    const lp = E.pop(t, t0 + 0.05, 0.45);
    ctx.save(); ctx.translate(E.CX, 400); ctx.scale(lp, lp); E.pixTitle('KUSICAL', 0, 0, 132); ctx.restore();
    const s = 17, jump = 3 * Math.abs(Math.sin(E.prog(t, t0 + 0.2, t0 + 1.0) * Math.PI * 2));
    drawKusi(ctx, E.CX - 18 * s - 20, 470, s, { mood: 'happy', hat: 'chullo', ropa: 'poncho', wave: -2.3 + Math.sin(t * 10) * 0.35, jump, tail: t * 6 });
    E.burst(t, t0 + 0.15, E.CX, 700, 60, 620, 1.4);
    const a = E.easeOut(E.prog(t, t0 + 0.5, t0 + 0.9));
    ctx.save(); ctx.globalAlpha = a;
    E.text('Gratis · sin descargar', E.CX, 1060 + (1 - a) * 30, 58, C.COLORS.ink, 'center', 800);
    E.text('en tu celular, tablet o compu', E.CX, 1122 + (1 - a) * 30, 38, C.COLORS.muted, 'center', 700);
    ctx.restore();
    const b = E.pop(t, t0 + 0.9, 0.35), pulse = 1 + 0.04 * Math.sin(t * 8);
    ctx.save(); ctx.translate(E.CX, 1232); ctx.scale(b * pulse, b * pulse);
    E.card(-270, -56, 540, 112, 56, C.COLORS.orange, true);
    E.text('Link en la bio 👆', 0, 17, 50, '#fff', 'center', 800); ctx.restore();
    const h = E.pop(t, t0 + 1.2, 0.35);
    ctx.save(); ctx.translate(E.CX, 1365); ctx.scale(h, h);
    const hw = E.measure(C.HANDLE, 50, 'pix', 700) + 60;
    E.card(-hw / 2, -52, hw, 80, 20, '#fff', true); E.text(C.HANDLE, 0, 8, 50, C.COLORS.ink, 'center', 700, 'pix'); ctx.restore();
  };
})();
