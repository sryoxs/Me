// HUD: el orbe de Brainer. Una pequeña red neuronal animada que muestra el estado:
// inactivo · escuchando · pensando · hablando · error.

const STATE_COLOR = {
  inactivo: ['#4dd4ff', '#7c5cff'],
  escuchando: ['#ff5c7a', '#ff8fd8'],
  pensando: ['#7c5cff', '#4dd4ff'],
  hablando: ['#3ddc97', '#4dd4ff'],
  error: ['#ff5c7a', '#ffb84d'],
};
export const STATE_LABEL = { inactivo: 'Listo', escuchando: 'Escuchando…', pensando: 'Pensando…', hablando: 'Hablando', error: 'Error' };

export class Orb {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.state = 'inactivo'; this.level = 0; this.t = 0;
    this.nodes = Array.from({ length: 26 }, (_, i) => ({
      a: (i / 26) * Math.PI * 2 + Math.random() * 0.3, r: 0.45 + Math.random() * 0.5, s: 0.2 + Math.random() * 0.6, ph: Math.random() * Math.PI * 2,
    }));
    this.edges = [];
    for (let i = 0; i < this.nodes.length; i++) for (let j = i + 1; j < this.nodes.length; j++) if (Math.random() < 0.12) this.edges.push([i, j, Math.random()]);
    this.resize(); this.loop();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const dpr = devicePixelRatio || 1; const r = this.c.getBoundingClientRect();
    this.c.width = r.width * dpr; this.c.height = r.height * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width; this.h = r.height;
  }
  set(state, { level } = {}) { if (STATE_COLOR[state]) this.state = state; if (level !== undefined) this.level = level; }
  loop() {
    const step = () => { this.t += this.state === 'inactivo' ? 0.008 : 0.02; this.draw(); requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  draw() {
    const { ctx, w, h, t } = this; if (!w) return;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const base = Math.min(w, h) * 0.32;
    const pulse = this.state === 'escuchando' ? Math.min(0.5, this.level * 6) : this.state === 'hablando' ? 0.12 * Math.abs(Math.sin(t * 6)) : this.state === 'pensando' ? 0.08 * Math.sin(t * 4) : 0.03 * Math.sin(t * 2);
    const R = base * (1 + pulse);
    const [c1, c2] = STATE_COLOR[this.state];
    // Halo
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.9);
    g.addColorStop(0, c1 + '55'); g.addColorStop(0.5, c2 + '18'); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // Posiciones de nodos
    const pts = this.nodes.map(n => {
      const ang = n.a + t * n.s * (this.state === 'pensando' ? 1.8 : 1);
      const rr = R * (n.r + 0.08 * Math.sin(t * 2 + n.ph));
      return { x: cx + Math.cos(ang) * rr, y: cy + Math.sin(ang) * rr * 0.92 };
    });
    // Aristas con pulsos
    ctx.lineWidth = 1;
    for (const [i, j, ph] of this.edges) {
      const a = pts[i], b = pts[j];
      ctx.strokeStyle = c2 + '40'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (this.state !== 'inactivo' || Math.sin(t * 3 + ph * 6) > 0.9) {
        const k = ((t * (0.6 + ph)) % 1);
        const px = a.x + (b.x - a.x) * k, py = a.y + (b.y - a.y) * k;
        ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(px, py, 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Nodos
    for (const p of pts) {
      ctx.fillStyle = c1; ctx.shadowColor = c1; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // Núcleo
    const core = ctx.createRadialGradient(cx - R * 0.1, cy - R * 0.1, 2, cx, cy, R * 0.42);
    core.addColorStop(0, '#ffffffcc'); core.addColorStop(0.3, c1); core.addColorStop(1, c2 + '99');
    ctx.fillStyle = core; ctx.shadowColor = c1; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}
