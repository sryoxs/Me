/* KusiCal promo v2: configuración del tramo animado (empieza donde termina la toma real).
   Formato por URL: ?fmt=v (1080x1920, TikTok/Reels/Shorts) o ?fmt=h (1920x1080, YouTube/web). */
(function () {
  const H = new URLSearchParams(location.search).get('fmt') === 'h';
  window.CFG = {
    HANDLE: '@kusical',               // <- handle de TikTok / IG (cámbialo aquí)
    MODE: H ? 'h' : 'v',
    W: H ? 1920 : 1080, H: H ? 1080 : 1920, FPS: 30,
    BPM: 120,                         // 1 tiempo = 0.5 s; los cortes caen en inicio de compás
    // Zonas seguras: vertical = UI de TikTok; horizontal = 80 px por lado
    SAFE: H ? { top: 80, bottom: 80, right: 80, left: 80 } : { top: 250, bottom: 400, right: 150, left: 150 },
    // Títulos: vertical arriba y centrados; horizontal en la columna izquierda
    TITLE: H ? { x: 610, y: 430, maxW: 820, subGap: 96 } : { x: 540, y: 352, maxW: 720, subGap: 78 },
    // "Escenario": el contenido de cada escena se diseña en un lienzo de 1080 de ancho y en
    // horizontal se lleva a la columna derecha (centro x, y y escala).
    STAGE: H ? { x: 1335, y: 580, s: 0.92, cx: 540, cy: 1000 } : { x: 540, y: 1000, s: 1, cx: 540, cy: 1000 },
    COLORS: {
      orange: '#e8702a', orangeDark: '#b9531a', orangeLight: '#f4a463', cream: '#faf9f5', cream2: '#f4e8d6',
      ink: '#141413', muted: '#6b6760', green: '#1f9d6b', line: '#e6dccb', night: '#1c1814', night2: '#2a231d'
    },
    PLATO: { nombre: 'Ceviche', total: 450, items: [['Pescado', 210, '🐟'], ['Camote', 140, '🍠'], ['Choclo', 100, '🌽']] },
    // Línea de tiempo del tramo (segundos locales; 0 = primer cuadro después de la toma)
    SCENES: [
      ['kusi', 0, 1], ['pixel', 1, 4], ['platos', 4, 6], ['barcode', 6, 8], ['plan', 8, 10], ['coach', 10, 12],
      ['racha', 12, 14], ['comunidad', 14, 16], ['mikusi', 16, 18], ['cierre', 18, 21.3]
    ],
    // Transición en cada corte (máx. 2 usos por tipo); el corte Kusi → plato es un destello
    CUTS: [[4, 'zoom', 0.5, 0.56], [6, 'whipL'], [8, 'blocks'], [10, 'whipU'], [12, 'mosaic'],
      [14, 'blocks'], [16, 'zoom', 0.5, 0.5], [18, 'mosaic']],
    FLASHES: [[0, 0.16, 1], [1, 0.14, 1], [2, 0.12, 0.85]],   // [t, duración, intensidad]
    TR: 0.36,
    DUR: 21.3
  };
})();
