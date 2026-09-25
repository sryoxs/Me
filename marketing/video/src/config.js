/* KusiCal · video promocional vertical — configuración central.
   Cambia aquí el handle, los textos clave y los tiempos. */
window.CFG = {
  HANDLE: '@kusical',            // <- handle de TikTok / IG (cámbialo aquí)
  W: 1080, H: 1920, FPS: 30,
  // Márgenes seguros de la UI de TikTok/Reels: nada importante fuera de esta caja.
  SAFE: { top: 250, bottom: 400, right: 150, left: 60 },
  COLORS: {
    orange: '#e8702a', orangeDark: '#b9531a', cream: '#faf9f5', ink: '#141413',
    card: '#ffffff', beige: '#f3ece0', green: '#1f9d6b', muted: '#6b6760', red: '#d91023'
  },
  // Tramo A (reemplazable por toma real): 0 → A_END s. Tramo B: A_END → B_END s.
  A_END: 11,
  B_END: 38,
  XFADE: 0.5,                    // transición "pixelize" de ffmpeg entre tramos
  // Plato de la demo (valores de la landing de KusiCal)
  PLATO: {
    nombre: 'Ceviche',
    items: [
      { n: 'Pescado', kcal: 190, emoji: '🐟', x: 0.56, y: 0.47 },
      { n: 'Camote', kcal: 140, emoji: '🍠', x: 0.12, y: 0.60 },
      { n: 'Choclo', kcal: 90, emoji: '🌽', x: 0.36, y: 0.20 }
    ]
  },
  // Cortes de escena del tramo B (segundos, tiempo global)
  T: {
    zoom: 11, pixel: 12, pop: 13.6, land: 14.7,
    barcode: 16.0, plan: 18.6, coach: 21.2, racha: 23.8,
    comunidad: 26.2, mikusi: 29.2, cierre: 32.2
  }
};
