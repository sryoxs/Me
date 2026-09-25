/* TRAMO B · escena 4 (11 → 16 s): zoom al celular, pixelado progresivo, ¡pop!
   y el plato pixel aterriza en el Diario sumando las kcal. */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = window.SC, T = C.T;
  const SUM = C.PLATO.items.reduce((a, b) => a + b.kcal, 0);
  const META = 1860;
  const BLOCKS = [1, 5, 9, 14, 20, 28, 38, 52, 70];

  // plato pixel: recorte central de la foto en N×N celdas, con máscara circular y borde de plato
  const sprite = document.createElement('canvas'); let spriteOk = false;
  function plateSprite() {
    if (spriteOk) return sprite; spriteOk = true;
    const N = 20, im = E.img.ceviche; sprite.width = sprite.height = N;
    const g = sprite.getContext('2d'); const side = Math.min(im.width, im.height) * 0.82;
    g.drawImage(im, (im.width - side) / 2, im.height * 0.46 - side / 2, side, side, 0, 0, N, N);
    const d = g.getImageData(0, 0, N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const r = Math.hypot(x - N / 2 + 0.5, y - N / 2 + 0.5), i = (y * N + x) * 4;
      for (let c = 0; c < 3; c++) d.data[i + c] = Math.max(0, Math.min(255, (d.data[i + c] - 128) * 1.3 + 140));
      if (r > N / 2) d.data[i + 3] = 0;
      else if (r > N / 2 - 1.6) { d.data[i] = 250; d.data[i + 1] = 246; d.data[i + 2] = 238; }
    }
    g.putImageData(d, 0, 0);
    return sprite;
  }
  S.plate = function (cx, cy, size, rot = 0) {
    const sp = plateSprite(); ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.imageSmoothingEnabled = false;
    const cell = size / sp.width;
    ctx.shadowColor = 'rgba(60,30,10,.35)'; ctx.shadowOffsetX = cell * 0.6; ctx.shadowOffsetY = cell; ctx.shadowBlur = 0; // sombra dura
    ctx.drawImage(sp, -size / 2, -size / 2, size, size); ctx.restore();
  };

  /* Diario recreado con el estilo de la app (unidades lógicas de 390 px) */
  S.diario = function (t, sx, sy, sw, sh, comido) {
    const u = sw / 390; const X = (v) => sx + v * u, Y = (v) => sy + v * u;
    ctx.fillStyle = C.COLORS.cream; ctx.fillRect(sx, sy, sw, sh);
    drawKusiHead(ctx, X(18), Y(58), 1.9 * u);
    E.pixTitle('KUSICAL', X(58), Y(78), 20 * u, C.COLORS.orange, '#e3d6c3', 'left');
    E.rr(X(270), Y(56), 100 * u, 32 * u, 16 * u); ctx.lineWidth = 2 * u; ctx.strokeStyle = C.COLORS.orange; ctx.stroke();
    drawFire(ctx, X(284), Y(62), 1.8 * u, comido <= 0);
    E.text(comido > 0 ? '1 día' : '0', X(338), Y(79), 15 * u, C.COLORS.orange, 'center', 800);
    const days = [['M', 22], ['M', 23], ['J', 24], ['V', 25], ['S', 26], ['D', 27], ['L', 28]];
    days.forEach(([d, n], i) => {
      const x = X(16 + i * 52.5), on = i === 3;
      E.rr(x, Y(104), 46 * u, 62 * u, 14 * u); ctx.fillStyle = on ? C.COLORS.orange : '#fff'; ctx.fill();
      E.text(d, x + 23 * u, Y(126), 12 * u, on ? '#fff' : C.COLORS.muted, 'center', 700);
      E.text(String(n), x + 23 * u, Y(152), 18 * u, on ? '#fff' : C.COLORS.ink, 'center', 800);
    });
    // energía de hoy
    E.card(X(14), Y(182), 362 * u, 250 * u, 26 * u, '#fff', true);
    E.text('Tu energía de hoy', X(34), Y(216), 17 * u, C.COLORS.ink, 'left', 800);
    const cx = X(195), cy = Y(318), R = 72 * u;
    ctx.lineWidth = 14 * u; ctx.strokeStyle = '#f3ece0'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = C.COLORS.orange; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (comido / META) + 0.0001); ctx.stroke(); ctx.lineCap = 'butt';
    E.text(String(Math.round(META - comido)), cx, cy + 10 * u, 38 * u, C.COLORS.ink, 'center', 700, 'pix');
    E.text('kcal restantes', cx, cy + 34 * u, 12 * u, C.COLORS.muted, 'center', 700);
    [['comido', Math.round(comido)], ['quemado', 0], ['meta', META]].forEach(([k, v], i) => {
      const x = X(70 + i * 125); E.text(String(v), x, Y(414), 18 * u, i === 0 && comido > 0 ? C.COLORS.orange : C.COLORS.ink, 'center', 700, 'pix');
      E.text(k, x, Y(428), 11 * u, C.COLORS.muted, 'center', 700);
    });
    // comidas
    E.text('TUS COMIDAS', X(20), Y(466), 12 * u, C.COLORS.green, 'left', 700, 'pix');
    const rows = [['🌅', 'Desayuno', 0], ['🍽️', 'Almuerzo', 0], ['🌙', 'Cena', comido]];
    rows.forEach(([ic, n, v], i) => {
      const y = Y(480 + i * 78), hl = i === 2 && comido > 0;
      E.card(X(14), y, 362 * u, 66 * u, 18 * u, hl ? '#fff4ea' : '#fff', true, hl ? [3 * u, C.COLORS.orange] : null);
      E.text(ic, X(40), y + 42 * u, 22 * u, '#000', 'center', 400);
      E.text(n, X(66), y + (hl ? 30 : 40) * u, 16 * u, C.COLORS.ink, 'left', 800);
      if (hl) E.text('Ceviche', X(66), y + 52 * u, 13 * u, C.COLORS.muted, 'left', 700);
      E.text(String(Math.round(v)), X(352), y + 41 * u, 17 * u, hl ? C.COLORS.orange : C.COLORS.ink, 'right', 700, 'pix');
    });
    return { cena: { x: X(262), y: Y(480 + 2 * 78 + 33) } };
  };

  /* ---------------- escena 4 ---------------- */
  S.b4 = function (t) {
    const PH = S.PH;
    if (t < T.pop) {
      // zoom hacia la pantalla del celular
      const z = E.easeInOut(E.prog(t, T.zoom, T.pixel));
      const k = E.lerp(1, 1080 / (PH.w * 0.93) * 1.02, z);
      const scx = PH.x + PH.w / 2, scy = PH.y + PH.w * 2.06 * 0.41;
      S.table(t, 1);
      ctx.save(); ctx.translate(C.W / 2, E.lerp(scy, C.H / 2, z)); ctx.scale(k, k); ctx.translate(-scx, -scy);
      const step = Math.floor(E.prog(t, T.pixel, T.pop - 0.15) * (BLOCKS.length - 1) + 0.0001);
      const block = t < T.pixel ? 1 : BLOCKS[step] / k;
      const stepT = T.pixel + step * ((T.pop - 0.15 - T.pixel) / (BLOCKS.length - 1));
      let r;
      S.phoneA(t, PH.x, PH.y, (sx, sy, sw, sh) => {
        r = S.camera(t, sx, sy, sw, sh, { ui: 1 - z, block });
        S.labels(t, r, 6.9, 1 - z, 'total');
      });
      S.labels(t, r, 6.9, 1 - E.prog(t, T.zoom, T.zoom + 0.4), false);
      ctx.restore();
      // "latido" en cada salto de bloque
      if (t >= T.pixel) {
        const b = 1 - E.prog(t, stepT, stepT + 0.12);
        ctx.fillStyle = `rgba(255,255,255,${0.12 * b})`; ctx.fillRect(0, 0, C.W, C.H);
      }
      if (t > T.pixel + 0.1) {
        E.header(t, T.pixel + 0.1, 'Modo pixel', null, { y: 360, color: '#fff', shadow: C.COLORS.orange, size: 84 });
        const q = E.pop(t, T.pixel + 0.5, 0.3);
        ctx.save(); ctx.translate(E.CX, 470); ctx.scale(q, q); E.textOut('ON 👾', 0, 0, 72, '#ffd23f'); ctx.restore();
      }
      return;
    }
    // ¡POP! → Diario
    E.bgCream(t);
    const out = E.easeOut(E.prog(t, T.pop, T.pop + 0.5));
    const pw = 540, k = E.lerp(1.7, 1, out);
    const px0 = E.CX - pw / 2, py0 = 470;
    let target;
    ctx.save(); ctx.translate(E.CX, py0 + 500); ctx.scale(k, k); ctx.translate(-E.CX, -(py0 + 500));
    const comido = SUM * E.easeOut(E.prog(t, T.land, T.land + 0.8));
    const P = E.phone(px0, py0, pw, (sx, sy, sw, sh) => { target = S.diario(t, sx, sy, sw, sh, comido).cena; });
    ctx.restore();
    // el plato pixel vuela y aterriza en la fila "Cena"
    const f = E.easeInOut(E.prog(t, T.pop + 0.35, T.land));
    const size0 = 640, size1 = 92;
    const cx = E.lerp(E.CX, target.x, f), cy = E.lerp(930, target.y, f) - Math.sin(f * Math.PI) * 220;
    const pp = E.pop(t, T.pop, 0.35);
    if (t < T.land + 0.05) S.plate(cx, cy, E.lerp(size0, size1, f) * (t < T.pop + 0.35 ? pp : 1), f * Math.PI * 2);
    else S.plate(target.x, target.y, size1 * (1 + 0.25 * (1 - E.prog(t, T.land, T.land + 0.3))));
    // destello + estallido
    const fl = 1 - E.prog(t, T.pop, T.pop + 0.2);
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, C.W, C.H); }
    E.burst(t, T.pop, E.CX, 930, 56, 640);
    E.burst(t, T.land, target.x, target.y, 26, 260, 0.8);
    if (t > T.pop + 0.05 && t < T.pop + 0.6) { const q = E.pop(t, T.pop + 0.05, 0.25); ctx.save(); ctx.translate(E.CX, 1500 - 200); ctx.scale(q, q); E.textOut('¡POP!', 0, 0, 120, '#fff', C.COLORS.orange, 18); ctx.restore(); }
    // +kcal flotante
    if (t > T.land) {
      const q = E.prog(t, T.land, T.land + 1.1);
      ctx.save(); ctx.globalAlpha = 1 - E.easeIn(q);
      E.textOut('+' + SUM + ' kcal', Math.min(target.x, 740), target.y - 80 - 160 * E.easeOut(q), 64, C.COLORS.orange, '#fff', 14);
      ctx.restore();
    }
    E.header(t, T.pop + 0.3, 'Directo al diario', null, { y: 340, size: 66 });
  };
})();
