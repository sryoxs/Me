/* Funciones (2/3): Kusi te explica, racha diaria, comunidad. 2 s cada una. */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = window.SC;

  /* ---------- Kusi te explica ---------- */
  const ANSWER = 'Gastas 2137 kcal al día. Te resto 277 para bajar grasa sin perder músculo. Tranqui 😉';
  S.coach = function (t, s0, s1) {
    E.bg(t); ctx.save(); E.camera(t, s0, s1); E.stageIn();
    // pregunta del usuario
    const q1 = E.pop(t, s0 + 0.25, 0.3, 2);
    if (q1 > 0) {
      const txt = '¿Por qué 1860 kcal?', w = E.measure(txt, 40, 'jak', 800) + 72;
      ctx.save(); ctx.translate(900 - w / 2, 600); ctx.scale(q1, q1);
      E.card(-w / 2, -48, w, 96, 34, C.COLORS.orange); E.text(txt, 0, 14, 40, '#fff', 'center', 800); ctx.restore();
    }
    // respuesta de Kusi
    const x0 = 170, w = 740, y0 = 690;
    const a = E.expoOut(E.prog(t, s0 + 0.5, s0 + 0.8));
    if (a > 0) {
      ctx.save(); ctx.globalAlpha = E.clamp(a * 2); ctx.translate(0, (1 - a) * 60);
      E.card(x0, y0, w, 400, 40, '#fff');
      E.text('KUSI', x0 + 44, y0 + 62, 28, C.COLORS.orange, 'left', 700, 'pix');
      E.text('IA ACTIVA', x0 + w - 44, y0 + 60, 22, C.COLORS.green, 'right', 700, 'pix');
      if (t < s0 + 0.8) for (let i = 0; i < 3; i++) { const b = Math.sin(t * 16 - i) > 0 ? 8 : 0; ctx.fillStyle = C.COLORS.muted; ctx.fillRect(x0 + 48 + i * 30, y0 + 120 - b, 16, 16); }
      const n = Math.floor(E.prog(t, s0 + 0.8, s0 + 1.45) * ANSWER.length);
      if (n > 0) E.wrap(ANSWER, x0 + 44, y0 + 132, w - 88, 42, 60, C.COLORS.ink, 700, n);
      ctx.restore();
    }
    // Kusi hablando y saludando
    const talk = t > s0 + 0.8 && t < s0 + 1.45 && Math.floor(t * 10) % 2 === 0;
    const kp = E.expoOut(E.prog(t, s0 + 0.1, s0 + 0.5));
    drawKusi(ctx, 330 - 18.5 * 13 + (1 - kp) * -400, 1090, 13, { mood: t > s0 + 1.45 ? 'happy' : 'open', talk, hat: 'chullo', ropa: 'poncho', wave: -2.2 + Math.sin(t * 12) * 0.3, jump: Math.abs(Math.sin((t - s0) * Math.PI * 2)) * 1.2, tail: t * 6 });
    if (t > s0 + 1.2) E.chip(700, 1300, 'Sin sermones', { size: 40, fill: C.COLORS.ink, color: '#fff', scale: E.pop(t, s0 + 1.2, 0.28, 2.2) });
    E.stageOut();
    E.title(t, s0, [['KUSI', 'TE'], [['EXPLICA', C.COLORS.orange]]], { size: 92, y: 352 });
    ctx.restore();
  };

  /* ---------- racha ---------- */
  S.racha = function (t, s0, s1) {
    E.bg(t); ctx.save(); E.camera(t, s0, s1); E.stageIn();
    const lit = E.clamp(Math.floor((t - s0 - 0.25) / 0.125) + 1, 0, 7);
    const glow = ctx.createRadialGradient(540, 820, 0, 540, 820, 330);
    glow.addColorStop(0, 'rgba(255,138,31,.35)'); glow.addColorStop(1, 'rgba(255,138,31,0)'); ctx.fillStyle = glow; ctx.fillRect(200, 480, 680, 680);
    const beat = 1 + 0.1 * E.beatPulse(t, s0), s = 30 * E.back(E.prog(t, s0 + 0.05, s0 + 0.4), 2);
    ctx.save(); ctx.translate(540, 950); ctx.scale(beat * (1 + 0.02 * Math.sin(t * 20)), beat); drawFire(ctx, -5 * s, -11 * s, s); ctx.restore();
    const np = 0.7 + 0.3 * E.pop(t, s0 + 0.25 + (Math.max(lit, 1) - 1) * 0.125, 0.18, 3);
    ctx.save(); ctx.translate(540, 1150); ctx.scale(np, np); E.pix(String(Math.max(lit, 1)), 0, 0, 150, C.COLORS.orange, C.COLORS.ink); ctx.restore();
    E.text('días de racha', 540, 1225, 42, C.COLORS.ink, 'center', 800);
    'LMMJVSD'.split('').forEach((d, i) => {
      const x = 540 + (i - 3) * 100, on = i < lit, q = on ? E.pop(t, s0 + 0.25 + i * 0.125, 0.22, 2.5) : 1;
      E.card(x - 42, 1270, 84, 130, 22, on ? '#fff4ea' : '#fff', { stroke: on ? C.COLORS.orange : C.COLORS.line, lw: 3, shadow: false });
      ctx.save(); ctx.translate(x, 1322); ctx.scale(q, q); drawFire(ctx, -22, -24, 4.4, !on); ctx.restore();
      E.text(d, x, 1385, 26, on ? C.COLORS.orange : C.COLORS.muted, 'center', 800);
    });
    E.burst(t, s0 + 1.1, 540, 900, 44, 520, 0.9);
    E.stageOut();
    E.title(t, s0, [['NO', 'ROMPAS'], ['TU', ['RACHA', C.COLORS.orange]]], { size: 92, y: 352 });
    ctx.restore();
  };

  /* ---------- comunidad ---------- */
  const FEED = [
    { img: 'plato', fx: 0.5, fy: 0.55, user: '@mafe.lima', fur: 'clasico', hat: 'chullo', dish: 'Ceviche', kcal: 450, likes: 38, streak: 12 },
    { img: 'lomo', fx: 0.62, fy: 0.5, user: '@joaco_fit', fur: 'culpeo', hat: 'gorra', dish: 'Lomo saltado', kcal: 680, likes: 24, streak: 5 },
    { img: 'aji', fx: 0.38, fy: 0.5, user: '@sofi.cusco', fur: 'chilla', hat: 'gorroLana', dish: 'Ají de gallina', kcal: 610, likes: 51, streak: 21 },
    { img: 'ceviche', fx: 0.45, fy: 0.5, user: '@ale_trujillo', fur: 'dorado', hat: 'corona', dish: 'Ceviche mixto', kcal: 470, likes: 17, streak: 3 },
    { img: 'lomo', fx: 0.3, fy: 0.6, user: '@nico.arequipa', fur: 'rosadito', hat: 'gorraBlanquirroja', dish: 'Lomo con arroz', kcal: 720, likes: 29, streak: 9 }
  ];
  S.comunidad = function (t, s0, s1) {
    E.bg(t); ctx.save(); E.camera(t, s0, s1); E.stageIn();
    const top = 560, bottom = 1500, ch = 236, gap = 24, x = 170, w = 740;
    const scroll = (t - s0) * 330 + E.expoOut(E.prog(t, s0 + 1.0, s0 + 1.35)) * 120;
    ctx.save(); ctx.beginPath(); ctx.rect(0, top - 20, 1080, bottom - top + 20); ctx.clip();
    FEED.forEach((f, i) => {
      const y = top + 40 + i * (ch + gap) - scroll + (1 - E.expoOut(E.prog(t, s0 + i * 0.06, s0 + 0.5 + i * 0.06))) * 400;
      if (y > bottom || y + ch < top - 30) return;
      E.card(x, y, w, ch, 32, '#fff');
      ctx.save(); E.rr(x + 18, y + 18, ch - 36, ch - 36, 22); ctx.clip();
      E.coverPixel(E.img[f.img], x + 18, y + 18, ch - 36, ch - 36, 17, 1.25, f.fx, f.fy); ctx.restore();
      const tx = x + ch + 6;
      drawKusiHead(ctx, tx + 14, y + 34, 2.6, f.fur, f.hat);
      E.text(f.user, tx + 62, y + 64, 28, C.COLORS.muted, 'left', 800);
      E.text(f.dish, tx, y + 124, 38, C.COLORS.ink, 'left', 800);
      E.text(f.kcal + ' kcal', tx, y + 172, 32, C.COLORS.orange, 'left', 700, 'pix');
      const lt = s0 + 0.5 + i * 0.25, liked = t > lt, lp = liked ? E.pop(t, lt, 0.25, 3) : 1;
      ctx.save(); ctx.translate(tx + 16, y + 206); ctx.scale(lp, lp); E.text(liked ? '❤️' : '🤍', 0, 10, 28, '#000', 'center', 400); ctx.restore();
      E.text(String(f.likes + (liked ? 1 : 0)), tx + 42, y + 216, 26, C.COLORS.muted, 'left', 800);
      drawFire(ctx, tx + 120, y + 188, 2.8); E.text(f.streak + ' días', tx + 158, y + 216, 26, C.COLORS.muted, 'left', 800);
    });
    ctx.restore();
    // desvanecido superior/inferior del feed
    const fade = (y0, y1, a0, a1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(250,244,234,${a0})`); g.addColorStop(1, `rgba(250,244,234,${a1})`); ctx.fillStyle = g; ctx.fillRect(120, y0, 840, y1 - y0); };
    fade(top - 20, top + 60, 1, 0); fade(bottom - 90, bottom, 0, 1);
    E.stageOut();
    E.title(t, s0, [['LA'], [['COMUNIDAD', C.COLORS.orange]]], { size: 92, y: 352 });
    ctx.restore();
  };
})();
