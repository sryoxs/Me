/* Orquestador: render(t) dibuja el cuadro del segundo t (tiempo global). */
(function () {
  const C = window.CFG, E = window.E, ctx = E.ctx, S = window.SC, T = C.T;
  const q = new URLSearchParams(location.search);

  const SCENES = [
    [0, 3, S.a1], [3, 6, S.a2], [6, C.A_END, S.a3],
    [T.zoom, T.barcode, S.b4], [T.barcode, T.plan, S.barcode], [T.plan, T.coach, S.plan],
    [T.coach, T.racha, S.coach], [T.racha, T.comunidad, S.racha], [T.comunidad, T.mikusi, S.comunidad],
    [T.mikusi, T.cierre, S.mikusi], [T.cierre, C.B_END + 1, S.cierre]
  ];
  const WIPES = [T.barcode, T.plan, T.coach, T.racha, T.comunidad, T.mikusi, T.cierre];

  window.render = function (t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
    ctx.clearRect(0, 0, C.W, C.H);
    const sc = SCENES.find(([a, b]) => t >= a && t < b) || SCENES[SCENES.length - 1];
    sc[2](t);
    for (const w of WIPES) E.pixelWipe(t, w);
    if (q.get('safe')) safeGuide();
  };

  // guía de zonas seguras (sólo para revisar: ?safe=1)
  function safeGuide() {
    ctx.fillStyle = 'rgba(255,0,0,.18)';
    ctx.fillRect(0, 0, C.W, C.SAFE.top); ctx.fillRect(0, C.H - C.SAFE.bottom, C.W, C.SAFE.bottom);
    ctx.fillRect(C.W - C.SAFE.right, 0, C.SAFE.right, C.H);
  }

  // portada: plato real que se vuelve pixel en diagonal + gancho + Kusi
  window.renderCover = function () {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    E.cover(E.img.ceviche, 0, 0, C.W, C.H, 1.08, 0.5, 0.52);
    ctx.save(); ctx.beginPath(); ctx.moveTo(C.W, 700); ctx.lineTo(C.W, C.H); ctx.lineTo(0, C.H); ctx.lineTo(0, 1500); ctx.closePath(); ctx.clip();
    E.coverPixel(E.img.ceviche, 0, 0, C.W, C.H, 60, 1.08, 0.5, 0.52); ctx.restore();
    const g = ctx.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, 'rgba(20,12,6,.75)'); g.addColorStop(1, 'rgba(20,12,6,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, 900);
    E.textOut('¿Cuántas', E.CX, 420, 96); E.textOut('calorías tiene', E.CX, 530, 76); E.textOut('tu ceviche?', E.CX, 645, 96, '#ffd23f');
    ctx.font = '130px "Noto Color Emoji"'; ctx.textAlign = 'center'; ctx.fillText('🤔', E.CX + 330, 800);
    E.pill(E.CX - 150, 1000, 'Pescado', 190, 1.05, '🐟'); E.pill(E.CX + 120, 1120, 'Camote', 140, 1.05, '🍠');
    drawKusi(ctx, 40, 1130, 11, { mood: 'happy', hat: 'chullo', ropa: 'poncho', wave: -2.3 });
    E.card(420, 1300, 480, 110, 55, C.COLORS.orange, true);
    E.text('KusiCal lo sabe', 660, 1372, 48, '#fff', 'center', 800);
  };

  window.ready = (async () => {
    await E.load({
      ceviche: '../assets/ceviche1.jpg', lomo: '../assets/lomo2.jpg', aji: '../assets/aji1.jpg',
      dash: '../capturas/dash.png', plan: '../capturas/plan.png'
    });
    await document.fonts.load('700 40px Silkscreen'); await document.fonts.load('800 40px "Plus Jakarta Sans"');
    await document.fonts.load('600 40px "Plus Jakarta Sans"'); await document.fonts.load('40px "Noto Color Emoji"');
    await document.fonts.ready;
    if (q.get('t')) render(parseFloat(q.get('t')));
    return true;
  })();
})();
