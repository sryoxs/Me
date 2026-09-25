/* Orquestador v2: escenas + transiciones compuestas (whip pan con motion blur, zoom a través,
   wipe de bloques, mosaico) + grano/viñeta. render(t) usa segundos locales del tramo. */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = window.SC;
  const q = new URLSearchParams(location.search);
  const mk = () => { const c = document.createElement('canvas'); c.width = C.W; c.height = C.H; return c; };
  const bufA = mk(), bufB = mk(), small = document.createElement('canvas');

  function drawScene(name, t) {
    const sc = C.SCENES.find((s) => s[0] === name);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    S[name](t, sc[1], sc[2]);
    ctx.restore();
  }
  const sceneAt = (t) => (C.SCENES.find(([, a, b]) => t >= a && t < b) || C.SCENES[C.SCENES.length - 1])[0];

  // copia con desenfoque de movimiento direccional (promedio de n muestras)
  function blurDraw(src, dx, dy, spread, vert) {
    const n = spread > 2 ? 6 : 1;
    for (let i = 0; i < n; i++) {
      const o = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
      ctx.globalAlpha = 1 / (i + 1);
      ctx.drawImage(src, dx + (vert ? 0 : o), dy + (vert ? o : 0));
    }
    ctx.globalAlpha = 1;
  }
  function pixelated(src, block) {
    if (block <= 1.5) return ctx.drawImage(src, 0, 0);
    small.width = Math.ceil(C.W / block); small.height = Math.ceil(C.H / block);
    const sc = small.getContext('2d'); sc.imageSmoothingEnabled = true; sc.drawImage(src, 0, 0, small.width, small.height);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, small.width, small.height, 0, 0, C.W, C.H); ctx.restore();
  }

  function transition(type, p, fx, fy) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, C.W, C.H);
    if (type === 'whipL' || type === 'whipU') {
      const vert = type === 'whipU', D = vert ? C.H : C.W, e = E.expoInOut(p);
      const v = Math.min(1, 4 * p * (1 - p) * 1.1) * 320;
      blurDraw(bufA, vert ? 0 : -e * D, vert ? -e * D : 0, v, vert);
      blurDraw(bufB, vert ? 0 : (1 - e) * D, vert ? (1 - e) * D : 0, v, vert);
    } else if (type === 'zoom') {
      const px = fx * C.W, py = fy * C.H, cxm = C.W / 2, cym = C.H / 2;
      if (p < 0.55) {
        const z = 1 + 5 * E.expoIn(p / 0.55);
        ctx.save(); ctx.translate(px, py); ctx.scale(z, z); ctx.translate(-px, -py); ctx.drawImage(bufA, 0, 0); ctx.restore();
      }
      if (p > 0.4) {
        const pp = E.prog(p, 0.4, 1), z = 1.5 - 0.5 * E.expoOut(pp);
        ctx.save(); ctx.globalAlpha = E.clamp(pp * 2.5); ctx.translate(cxm, cym); ctx.scale(z, z); ctx.translate(-cxm, -cym);
        ctx.drawImage(bufB, 0, 0); ctx.restore();
      }
      const f = 1 - Math.abs(p - 0.5) * 3; if (f > 0) { ctx.fillStyle = `rgba(255,248,238,${f * 0.8})`; ctx.fillRect(0, 0, C.W, C.H); }
    } else if (type === 'blocks') {
      ctx.drawImage(p < 0.5 ? bufA : bufB, 0, 0);
      const bs = 90, cols = Math.ceil(C.W / bs), rows = Math.ceil(C.H / bs), cover = p < 0.5 ? p / 0.5 : 1 - (p - 0.5) / 0.5;
      const pal = [C.COLORS.orange, C.COLORS.orangeLight, C.COLORS.orangeDark, '#141413'];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, order = ((cols - i) + j) / (cols + rows) * 0.62 + E.rand(k * 1.3) * 0.38;
        if (order < cover * 1.02) { ctx.fillStyle = pal[k % 4]; ctx.fillRect(i * bs, j * bs, bs + 1, bs + 1); }
      }
    } else if (type === 'mosaic') {
      const blk = p < 0.5 ? E.lerp(1, 110, E.expoIn(p / 0.5)) : E.lerp(110, 1, E.expoOut((p - 0.5) / 0.5));
      pixelated(p < 0.5 ? bufA : bufB, Math.round(blk / 6) * 6 || 1);
    }
  }

  window.render = function (t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, C.W, C.H);
    const cut = C.CUTS.find(([c]) => Math.abs(t - c) < C.TR / 2);
    if (cut) {
      const [c, type, fx = 0.5, fy = 0.5] = cut, p = (t - (c - C.TR / 2)) / C.TR;
      drawScene(sceneAt(c - 0.01), t); bufA.getContext('2d').drawImage(E.cv, 0, 0);
      drawScene(sceneAt(c + 0.01), t); bufB.getContext('2d').drawImage(E.cv, 0, 0);
      transition(type, p, fx, fy);
    } else drawScene(sceneAt(t), t);
    // destellos globales: entrada desde la toma y el "drop" del pixelado
    const fl = Math.max(0, ...C.FLASHES.map(([ft, fd, fi]) => (t >= ft ? fi * (1 - E.prog(t, ft, ft + fd)) : 0)));
    if (fl > 0) { ctx.fillStyle = `rgba(255,252,246,${fl})`; ctx.fillRect(0, 0, C.W, C.H); }
    E.finish(t);
    if (q.get('safe')) {
      ctx.fillStyle = 'rgba(255,0,60,.22)';
      ctx.fillRect(0, 0, C.W, C.SAFE.top); ctx.fillRect(0, C.H - C.SAFE.bottom, C.W, C.SAFE.bottom); ctx.fillRect(C.W - C.SAFE.right, 0, C.SAFE.right, C.H);
      ctx.fillStyle = 'rgba(0,120,255,.5)'; ctx.fillRect(C.TITLE.x - 1, 0, 2, C.H); if (C.MODE === 'h') ctx.fillRect(C.STAGE.x - 1, 0, 2, C.H);
      ctx.fillRect(C.W - C.SAFE.right, 0, 0, 0); ctx.fillStyle = 'rgba(255,0,60,.22)'; ctx.fillRect(0, 0, C.SAFE.left, C.H);
      ctx.font = '700 44px sans-serif'; ctx.fillStyle = '#f0f'; ctx.fillText('t=' + t.toFixed(2), 20, 60);
    }
  };

  window.ready = (async () => {
    await E.load({
      plato: ['../../toma/plato.png', '../../assets/ceviche1.jpg'], ceviche: '../../assets/ceviche1.jpg',
      lomo: '../../assets/lomo2.jpg', aji: '../../assets/aji1.jpg',
      before: '../../capturas/v2/dash-comidas.png', after: '../../capturas/v2/dash-after-comidas.png',
      plan: '../../capturas/v2/plan.png', racha: '../../capturas/v2/racha-modal.png'
    });
    for (const f of ['700 40px Silkscreen', '800 40px "Plus Jakarta Sans"', '700 40px "Plus Jakarta Sans"', '40px "Noto Color Emoji"']) await document.fonts.load(f);
    await document.fonts.ready;
    if (q.get('t')) render(parseFloat(q.get('t')));
    return true;
  })();
})();
