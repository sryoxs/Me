/* Kusi, el zorro andino — sprite portado 1:1 del pixel art de la app
   (mapas de app.js y kusi-pixel-extra.js de kusical-demo), dibujado en canvas. */
(function () {
  const PAL = {
    O: '#e07a3e', D: '#ae5620', L: '#f4a463', W: '#fbf0de', C: '#e5d2b2', K: '#2a1c14', N: '#3a241a', P: '#eba0ad',
    S: '#8a4a18', w: '#ffffff', u: '#f2c14e', r: '#c33c4e', q: '#1b8a6b', b: '#2e86ab', g: '#6f7f88', y: '#d79a06',
    v: '#7b5bd6', e: '#d8cdb8', m: '#8fbf5a', h: '#1e5f7e', A: '#8a1c2b', Q: '#d91023', Z: '#16110d', p: '#5b8def', B: '#e8c46a', E: '#b8913a'
  };
  const HEAD = ['OO..........OO', 'OPO........OPO', 'OPPO......OPPO', 'OPPOOOOOOOOPPO', '.OOOOOOOOOOOO.', 'OOOOOOOOOOOOOO',
    'WOOOOOOOOOOOOW', 'WOOOOOOOOOOOOW', 'WOOWWWWWWWWOOW', '.OOWWWWWWWWOO.', '..OWWWNNWWWO..', '...WWWWWWWW...'];
  const BODY = ['..OOOOOOOOOO..', '.OOOOOOOOOOOO.', 'OOOWWWWWWWWOOO', 'OOOWWWWWWWWOOO', 'OOOWWWWWWWWOOO', '.OOWWWWWWWWOO.', '.OOOOOOOOOOOO.', '..OOOOOOOOOO..'];
  const TAIL = ['...OOOO...', '..OOOOOWW.', '.OOOOOOWWW', 'OOOOOOOWWW', '.OOOOOOWWW', '..OOOOOWW.', '...OOOO...'];
  const LEG_A = ['OOO', 'OOO', 'DDD', 'DDD'], LEG_B = ['...', 'OOO', 'OOO', 'DDD'], LEG_C = ['OOO', 'OOO', 'OOO', 'DDD'];
  const ARM = ['OO', 'OO', 'OO', 'DD'];
  const B = { bx: 11, by: 12, aL: [9, 14], aR: [25, 14], lL: [14, 20], lR: [20, 20], tl: [23, 13] };
  const HX = 11, EY = 6, EL = 14, ER = 20;
  const HATS = {
    chullo: { ox: 13, oy: 0, map: ['....uu....', '..rrrrrr..', '.rqqrrqqr.', 'rrrrrrrrrr'] },
    chulloAndino: { ox: 12, oy: -2, map: ['.....uu.....', '...rrrrrr...', '..rrvvvvrr..', '.rqquqquqqr.', '.rrrrrrrrrr.', '.ruurruurru.', 'A..........A', 'A..........A', 'AA........AA', 'u..........u'] },
    gorra: { ox: 13, oy: 1, map: ['..bbbbbb..', '.bbbbbbbb.', 'bbbbbbbbbb', 'hhhhhhhhhh'] },
    corona: { ox: 13, oy: 1, map: ['uu..uu..uu', 'uuuuuuuuuu', 'urruuuurru'] },
    gorraBlanquirroja: { ox: 13, oy: 1, map: ['..QQQQQQ..', '.QwwwwwwQ.', 'QQQQQQQQQQ', 'AAAAAAAAAAAA'] },
    sombreroChotano: { ox: 10, oy: -1, map: ['....BBBBBBBB....', '....BEEEEEEB....', '....BBBBBBBB....', '..BBQQQQQQQQBB..', 'BBBBBBBBBBBBBBBB', '.EEEEEEEEEEEEEE.'] },
    lentesSol: { ox: 13, oy: 5, map: ['ZZZZZZZZZZ', 'ZwZZ..ZwZZ', '.ZZ....ZZ.'] },
    gorroLana: { ox: 13, oy: -1, map: ['....ww....', '..pppppp..', '.pppppppp.', 'pwpwpwpwpw', 'wwwwwwwwww'] }
  };
  const ROPA = {
    poncho: { ox: -1, oy: 0, capa: true, c: '#d91023', map: ['..QQQQQQQQQQQQ..', '.QQQQQQQQQQQQQQ.', 'QQuuuuuuuuuuuuQQ', 'QqvqvqvqvqvqvqvQ', 'QQuuuuuuuuuuuuQQ', 'QQQQQQQQQQQQQQQQ', 'u.u.u.u.u.u.u.u.'] },
    blanquirroja: { ox: 1, oy: 0, c: '#ffffff', map: ['.wwwwwwwwwww', 'wQQwwwwwwwww', 'wwQQwwwwwwww', 'wwwQQwwwwwww', 'wwwwQQwwwwww', '.wwwwQQwwww.', '..wwwwwQQw..'] }
  };
  const FUR = {
    clasico: {}, culpeo: { O: '#c9502c', D: '#8f3217', L: '#e98457', W: '#fbefe3' },
    chilla: { O: '#9a948c', D: '#6b655e', L: '#c2bdb5', W: '#f4f1ec' }, dorado: { O: '#d9a441', D: '#a6761f', L: '#f0c86e', W: '#fff6df' },
    noche: { O: '#3d3740', D: '#231f26', L: '#5d5562', W: '#d9d2c8' }, rosadito: { O: '#e796ad', D: '#c0667f', L: '#f5bccb', W: '#fff2f5' }
  };

  function px(ctx, map, ox, oy, pal, s) {
    for (let y = 0; y < map.length; y++) {
      const row = map[y]; let x = 0;
      while (x < row.length) {
        const ch = row[x]; if (ch === '.') { x++; continue; }
        let w = 1; while (x + w < row.length && row[x + w] === ch) w++;
        ctx.fillStyle = pal[ch] || '#000';
        ctx.fillRect(Math.round((ox + x) * s), Math.round((oy + y) * s), Math.ceil(w * s), Math.ceil(s));
        x += w;
      }
    }
  }
  function eyes(ctx, mood, s) {
    const K = { K: PAL.K, w: PAL.w, r: PAL.r, u: PAL.u };
    if (mood === 'happy') { px(ctx, ['.KK.', 'K..K'], EL - 1, EY, K, s); px(ctx, ['.KK.', 'K..K'], ER - 1, EY, K, s); return; }
    if (mood === 'love') { const m = ['.r.r.', 'rrrrr', '.rrr.', '..r..']; px(ctx, m, EL - 2, EY - 1, K, s); px(ctx, m, ER - 2, EY - 1, K, s); return; }
    if (mood === 'star') { const m = ['.u.', 'uuu', '.u.']; px(ctx, m, EL - 1, EY - 1, K, s); px(ctx, m, ER - 1, EY - 1, K, s); return; }
    if (mood === 'blink') { px(ctx, ['KKKK'], EL - 1, EY + 1, K, s); px(ctx, ['KKKK'], ER - 1, EY + 1, K, s); return; }
    px(ctx, ['Kw', 'KK'], EL, EY, K, s); px(ctx, ['Kw', 'KK'], ER, EY, K, s);
  }
  function arm(ctx, x, y, pal, s, sleeve) {
    if (!sleeve) return px(ctx, ARM, x, y, pal, s);
    px(ctx, ARM.slice(0, 2), x, y, Object.assign({}, pal, { O: sleeve }), s);
    px(ctx, ARM.slice(2), x, y + 2, pal, s);
  }

  /* o: {mood, hat, ropa, fur, frame(0-2 piernas), talk(bool), wave(ángulo rad), jump(px en celdas)} */
  window.drawKusi = function (ctx, x, y, s, o = {}) {
    const pal = Object.assign({}, PAL, FUR[o.fur || 'clasico'] || {});
    const fr = o.frame || 0;
    const legL = fr === 1 ? LEG_B : fr === 2 ? LEG_C : LEG_A, legR = fr === 1 ? LEG_A : fr === 2 ? LEG_B : LEG_C;
    const R = ROPA[o.ropa];
    ctx.save(); ctx.translate(x, y + 6 * s); // viewBox arranca en y=-6
    // sombra en el piso
    ctx.fillStyle = 'rgba(60,30,10,.16)'; ctx.fillRect(Math.round(11 * s), Math.round(24.2 * s), Math.round(15 * s), Math.round(1 * s));
    ctx.translate(0, -(o.jump || 0) * s);
    ctx.save(); ctx.translate((B.tl[0]) * s, (B.tl[1] + 3) * s); ctx.rotate(Math.sin(o.tail || 0) * 0.12); ctx.translate(-(B.tl[0]) * s, -(B.tl[1] + 3) * s);
    px(ctx, TAIL, B.tl[0], B.tl[1], pal, s); ctx.restore();
    px(ctx, legL, B.lL[0], B.lL[1], pal, s); px(ctx, legR, B.lR[0], B.lR[1], pal, s);
    if (R && !R.capa) {
      const TP = Object.assign({}, pal, { O: R.c, W: R.c });
      px(ctx, BODY.slice(0, 7), B.bx, B.by, TP, s); px(ctx, BODY.slice(7), B.bx, B.by + 7, pal, s);
      px(ctx, R.map, B.bx + R.ox, B.by + R.oy, Object.assign({}, pal, { w: R.c }), s);
    } else {
      px(ctx, BODY, B.bx, B.by, pal, s);
      if (R) px(ctx, R.map, B.bx + R.ox, B.by + R.oy, pal, s);
    }
    const sleeve = R ? R.c : null;
    arm(ctx, B.aL[0], B.aL[1], pal, s, sleeve);
    // brazo derecho: gira en el hombro para saludar
    ctx.save(); const pvx = (B.aR[0] + 1) * s, pvy = B.aR[1] * s;
    ctx.translate(pvx, pvy); ctx.rotate(o.wave || 0); ctx.translate(-pvx, -pvy);
    arm(ctx, B.aR[0], B.aR[1], pal, s, sleeve); ctx.restore();
    // cabeza
    ctx.save(); ctx.translate(0, (o.nod || 0) * s);
    px(ctx, HEAD, HX, 0, pal, s);
    if (o.mood === 'happy' || o.mood === 'love') { px(ctx, ['PP'], 12, 9, pal, s); px(ctx, ['PP'], 22, 9, pal, s); }
    if (o.talk) { ctx.fillStyle = PAL.N; ctx.fillRect(16 * s, 10 * s, 4 * s, 2 * s); ctx.fillStyle = PAL.r; ctx.fillRect(17 * s, 11 * s, 2 * s, s); }
    eyes(ctx, o.mood, s);
    const hats = Array.isArray(o.hat) ? o.hat : o.hat ? [o.hat] : [];
    for (const k of hats) { const h = HATS[k]; if (h) px(ctx, h.map, h.ox, h.oy, pal, s); }
    ctx.restore();
    ctx.restore();
  };
  // cabeza sola (avatar) — s = tamaño de celda
  window.drawKusiHead = function (ctx, x, y, s, fur, hat) {
    const pal = Object.assign({}, PAL, FUR[fur || 'clasico'] || {});
    ctx.save(); ctx.translate(x - HX * s, y);
    px(ctx, HEAD, HX, 0, pal, s); px(ctx, ['Kw', 'KK'], EL, EY, pal, s); px(ctx, ['Kw', 'KK'], ER, EY, pal, s);
    if (hat && HATS[hat]) px(ctx, HATS[hat].map, HATS[hat].ox, HATS[hat].oy, pal, s);
    ctx.restore();
  };
  // icono de fuego de la racha (racha.js)
  const FIRE = ['....r.....', '...rr..r..', '...rrr.rr.', '..rrorrrr.', '.rrooorrr.', '.rroyyorr.', 'rrooyyyorr', 'rroywwyorr', '.rooywyor.', '..rooyor..', '...rrrr...'];
  window.drawFire = function (ctx, x, y, s, gray) {
    const pal = gray ? { r: '#8a8580', o: '#a8a29b', y: '#c9c3bb', w: '#e6e1da' } : { r: '#e8452c', o: '#ff8a1f', y: '#ffd23f', w: '#fff6c8' };
    ctx.save(); ctx.translate(x, y); px(ctx, FIRE, 0, 0, pal, s); ctx.restore();
  };
  window.KUSI_W = 36; window.KUSI_H = 31; // celdas del viewBox útil
})();
