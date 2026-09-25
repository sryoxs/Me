/* TRAMO A (0 → 11 s) — provisional y reemplazable por una toma real.
   1 · Mesa (0-3)   2 · Saco el celular (3-6)   3 · Escáner sobre el plato real (6-11) */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = (window.SC = window.SC || {});
  const PH = { w: 500, x: E.CX - 250, y: 450 };            // celular en su posición final
  S.PH = PH;
  const photoZoom = (t) => 1.04 + 0.05 * E.prog(t, 0, 11);

  // fondo desenfocado precalculado (se genera una vez)
  let blurred = null;
  function getBlur() {
    if (blurred) return blurred;
    blurred = document.createElement('canvas'); blurred.width = C.W; blurred.height = C.H;
    const b = blurred.getContext('2d'); b.filter = 'blur(14px) brightness(0.72) saturate(1.1)';
    const im = E.img.ceviche, s = Math.max(C.W / im.width, C.H / im.height) * 1.08;
    b.drawImage(im, (C.W - im.width * s) / 2, (C.H - im.height * s) / 2, im.width * s, im.height * s);
    return blurred;
  }
  // mesa: foto real con Ken Burns; blur = 0..1 mezcla con la versión desenfocada
  S.table = function (t, blur = 0) {
    E.cover(E.img.ceviche, 0, 0, C.W, C.H, photoZoom(t), 0.5, 0.52);
    if (blur > 0) {
      ctx.save(); ctx.globalAlpha = blur; const z = photoZoom(t) / 1.04;
      ctx.translate(C.W / 2, C.H / 2); ctx.scale(z, z); ctx.drawImage(getBlur(), -C.W / 2, -C.H / 2); ctx.restore();
    }
    // viñeta superior para el texto
    const g = ctx.createLinearGradient(0, 0, 0, 700);
    g.addColorStop(0, 'rgba(20,12,6,.62)'); g.addColorStop(1, 'rgba(20,12,6,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, 700);
  };
  // vapor pixel que sube del plato
  function steam(t, alpha = 1) {
    for (let i = 0; i < 16; i++) {
      const life = 2.2, ph = ((t + E.rand(i) * life) % life) / life;
      const x = 380 + E.rand(i + 20) * 360 + Math.sin(t * 2 + i) * 18, y = 1060 - ph * 420;
      ctx.globalAlpha = alpha * 0.55 * Math.sin(ph * Math.PI);
      ctx.fillStyle = '#fff'; const s = 18 + Math.round(E.rand(i + 4) * 2) * 12;
      ctx.fillRect(Math.round(x / 6) * 6, Math.round(y / 6) * 6, s, s);
    }
    ctx.globalAlpha = 1;
  }

  /* pantalla de cámara del celular: el MISMO plato visto a través del teléfono */
  S.camRect = function (sx, sy, sw, sh) { return { x: sx, y: sy + sh * 0.1, w: sw, h: sh * 0.72 }; };
  S.camMap = function (r, u, v) { // punto (u,v) de la foto → pantalla
    const im = E.img.ceviche, zoom = 1.0, s = Math.max(r.w / im.width, r.h / im.height) * zoom;
    const sw = r.w / s, sh = r.h / s, ox = E.clamp(0.5 * im.width - sw / 2, 0, im.width - sw), oy = E.clamp(0.46 * im.height - sh / 2, 0, im.height - sh);
    return { x: r.x + (u * im.width - ox) * s, y: r.y + (v * im.height - oy) * s };
  };
  S.camera = function (t, sx, sy, sw, sh, o = {}) {
    const r = S.camRect(sx, sy, sw, sh);
    ctx.fillStyle = '#0f0d0b'; ctx.fillRect(sx, sy, sw, sh);
    if (o.block && o.block > 1.5) E.coverPixel(E.img.ceviche, r.x, r.y, r.w, r.h, o.block, 1.0, 0.5, 0.46);
    else E.cover(E.img.ceviche, r.x, r.y, r.w, r.h, 1.0, 0.5, 0.46);
    const ui = o.ui === undefined ? 1 : o.ui;
    if (ui <= 0) return r;
    ctx.save(); ctx.globalAlpha = ui;
    // barra superior del escáner
    E.text('Escáner de Kusi', sx + 28, sy + sh * 0.075, sw * 0.056, '#fff', 'left', 800);
    E.rr(sx + sw - 160, sy + sh * 0.045, 132, 40, 20); ctx.fillStyle = 'rgba(31,157,107,.9)'; ctx.fill();
    E.text('IA ACTIVA', sx + sw - 94, sy + sh * 0.045 + 28, 18, '#fff', 'center', 700, 'pix');
    E.corners(r.x + 30, r.y + 30, r.w - 60, r.h - 60, 64, 11);
    // línea de escaneo
    if (o.scan !== undefined && o.scan > 0 && o.scan < 1) {
      const y = r.y + 30 + (r.h - 60) * o.scan;
      const g = ctx.createLinearGradient(0, y - 90, 0, y);
      g.addColorStop(0, 'rgba(232,112,42,0)'); g.addColorStop(1, 'rgba(232,112,42,.45)');
      ctx.fillStyle = g; ctx.fillRect(r.x + 30, y - 90, r.w - 60, 90);
      ctx.fillStyle = C.COLORS.orange; ctx.fillRect(r.x + 18, y - 4, r.w - 36, 8);
      ctx.fillStyle = '#fff'; ctx.fillRect(r.x + 60, y - 1, r.w - 120, 2);
    }
    // botón disparador
    ctx.beginPath(); ctx.arc(sx + sw / 2, sy + sh * 0.9, sw * 0.085, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(sx + sw / 2, sy + sh * 0.9, sw * 0.068, 0, Math.PI * 2); ctx.fillStyle = C.COLORS.orange; ctx.fill();
    ctx.restore();
    return r;
  };
  // etiquetas de ingredientes + total
  S.labels = function (t, r, t0, alpha = 1, total = true) {
    const items = C.PLATO.items;
    if (total !== 'total') items.forEach((it, i) => {
      const ti = t0 + i * 0.5; if (t < ti) return;
      const p = S.camMap(r, it.x, it.y), sc = E.pop(t, ti, 0.35);
      // punto sobre el ingrediente
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 12, p.y - 12, 24, 24); ctx.fillStyle = C.COLORS.orange; ctx.fillRect(p.x - 7, p.y - 7, 14, 14);
      E.pill(E.clamp(p.x, 240, 750), p.y - 70, it.n, it.kcal, 0.78 * sc, it.emoji);
      ctx.restore();
    });
    if (!total) return;
    const tt = t0 + items.length * 0.5 + 0.2; if (t < tt) return;
    const sum = items.reduce((a, b) => a + b.kcal, 0), q = E.easeOut(E.prog(t, tt, tt + 0.8));
    ctx.save(); ctx.globalAlpha = alpha * E.clamp(q * 3);
    const y = r.y + r.h - 20 - 150 * E.back(E.prog(t, tt, tt + 0.4)) + 150;
    E.card(r.x + 24, y - 120, r.w - 48, 110, 26, '#fff', true);
    E.text(C.PLATO.nombre, r.x + 50, y - 52, 34, C.COLORS.ink, 'left', 800);
    E.text(Math.round(sum * q) + ' kcal', r.x + r.w - 50, y - 52, 30, C.COLORS.orange, 'right', 700, 'pix');
    ctx.restore();
  };

  /* mano pixel que sostiene el celular: muñeca con polera naranja atrás, dedos adelante */
  function hand(px0, py0, w, h, front) {
    const u = 12, skin = '#e3a878', mid = '#cf8f5f', dark = '#a8663e', hi = '#f0c29a';
    const blk = (x, y, bw, bh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / u) * u, Math.round(y / u) * u, Math.round(bw / u) * u, Math.round(bh / u) * u); };
    const cx = px0 + w / 2;
    if (!front) {
      blk(cx - 150, py0 + h - 240, 300, 700, dark); blk(cx - 138, py0 + h - 240, 264, 700, skin);
      blk(cx - 138, py0 + h - 240, 36, 700, hi);
      blk(cx - 180, py0 + h + 170, 360, 400, '#b9531a'); blk(cx - 180, py0 + h + 170, 360, 48, '#e8702a');
      for (let i = 0; i < 8; i++) blk(cx - 168 + i * 44, py0 + h + 182, 24, 24, '#f4a463');
      return;
    }
    // pulgar (izquierda)
    blk(px0 - 48, py0 + h - 430, 84, 216, dark); blk(px0 - 36, py0 + h - 430, 72, 204, skin); blk(px0 - 36, py0 + h - 430, 72, 24, hi);
    blk(px0 + 12, py0 + h - 418, 24, 36, '#f7dcc4');
    // dedos (derecha)
    for (let i = 0; i < 4; i++) {
      const yy = py0 + h - 600 + i * 108;
      blk(px0 + w - 24, yy, 72, 96, dark); blk(px0 + w - 24, yy, 60, 84, skin); blk(px0 + w - 24, yy, 60, 12, hi); blk(px0 + w - 24, yy + 72, 60, 12, mid);
    }
  }
  S.phoneA = function (t, x, y, screen) {
    hand(x, y, PH.w, PH.w * 2.06, false);
    const P = E.phone(x, y, PH.w, screen);
    hand(x, y, PH.w, PH.w * 2.06, true);
    return P;
  };

  /* ---------------- escenas ---------------- */
  S.a1 = function (t) { // MESA
    S.table(t, 0); steam(t);
    const p = E.pop(t, 0.15, 0.45);
    ctx.save(); ctx.translate(E.CX, 420); ctx.scale(p, p);
    E.textOut('Antes de', 0, 0, 96); E.textOut('comer...', 0, 115, 96);
    ctx.restore();
    const q = E.pop(t, 0.9, 0.4);
    ctx.save(); ctx.translate(E.CX, 660 + Math.sin(t * 6) * 8); ctx.scale(q, q); ctx.font = '120px "Noto Color Emoji"'; ctx.textAlign = 'center'; ctx.fillText('👀', 0, 0); ctx.restore();
  };
  S.a2 = function (t) { // SACO EL CELULAR
    const rise = E.back(E.prog(t, 3.0, 3.75));
    S.table(t, E.prog(t, 3.0, 3.6)); steam(t, 1 - E.prog(t, 3, 3.5));
    const y = E.lerp(C.H + 40, PH.y, rise);
    S.phoneA(t, PH.x, y, (sx, sy, sw, sh) => {
      const open = E.easeInOut(E.prog(t, 3.9, 4.3));
      // splash con Kusi
      ctx.fillStyle = C.COLORS.cream; ctx.fillRect(sx, sy, sw, sh);
      drawKusi(ctx, sx + sw / 2 - 18 * 9, sy + sh * 0.26, 9, { mood: 'happy', hat: 'chullo', ropa: 'poncho', jump: Math.abs(Math.sin(t * 5)) * 1.5 });
      E.pixTitle('KUSICAL', sx + sw / 2, sy + sh * 0.66, 58);
      // Diario real (captura) que entra
      if (open > 0) { ctx.save(); ctx.globalAlpha = open; E.shot(E.img.dash, sx, sy + (1 - open) * 80, sw, sh); ctx.restore(); }
      // tap en "Escanear"
      const bx = sx + sw / 2, by = sy + (787 * 3) * (sw / 1170);
      const tp = E.prog(t, 4.9, 5.4);
      if (tp > 0 && tp < 1) { ctx.beginPath(); ctx.arc(bx, by, 30 + 120 * tp, 0, Math.PI * 2); ctx.fillStyle = `rgba(232,112,42,${0.5 * (1 - tp)})`; ctx.fill(); }
      if (t > 4.6 && t < 5.3) { ctx.beginPath(); ctx.arc(bx, by, 38, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); }
      const cam = E.easeInOut(E.prog(t, 5.4, 5.95));
      if (cam > 0) { ctx.save(); ctx.beginPath(); ctx.arc(bx, by, cam * sh * 1.2, 0, Math.PI * 2); ctx.clip(); S.camera(t, sx, sy, sw, sh, { ui: cam }); ctx.restore(); }
    });
    E.header(t, 3.05, 'Saco el cel 📱', null, { y: 340, color: '#fff', shadow: C.COLORS.orange, size: 68 });
  };
  S.a3 = function (t) { // ESCÁNER
    S.table(t, 1);
    E.header(t, 6.0, 'Kusi lo escanea', null, { y: 340, color: '#fff', shadow: C.COLORS.orange, size: 68 });
    let r;
    S.phoneA(t, PH.x, PH.y, (sx, sy, sw, sh) => {
      r = S.camera(t, sx, sy, sw, sh, { scan: E.prog(t, 6.3, 8.0) });
      S.labels(t, r, 6.9, 1, 'total');
    });
    S.labels(t, r, 6.9, 1, false);
  };
})();
