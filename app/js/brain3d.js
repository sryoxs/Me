// El cerebro de Brainer: una esfera 3D de partículas y líneas (plexus) que gira lentamente.
// Tus notas son puntos brillantes en la esfera; los [[enlaces]] entre notas son líneas fuertes;
// las partículas de fondo se conectan por cercanía. Todo en canvas 2D con proyección 3D propia.

const CYAN = [192, 132, 252]; // violeta: el color de la red
const TYPE_RGB = {
  nota: [56, 225, 255], captura: [56, 225, 255], informe: [160, 120, 255], tarea: [255, 184, 77], idea: [61, 220, 151],
  proyecto: [255, 120, 200], conexion: [120, 255, 240], flashcard: [255, 143, 216],
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export class Brain3D {
  constructor(canvas, { onOpen, onHover } = {}) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.onOpen = onOpen || (() => {}); this.onHover = onHover || (() => {});
    this.particles = []; this.notes = []; this.links = [];
    this.rotX = 0.35; this.rotY = 0; this.autoSpin = 0.0022; this.zoom = 1;
    this.active = new Map(); this.state = 'inactivo'; this.level = 0; this.t = 0;
    this.hover = null; this.drag = null; this.projected = [];
    this.focus = null; // id de nota enfocada (se gira hacia ella)
    this._makeParticles(160);
    this._bind(); this.resize(); this._loop();
    window.addEventListener('resize', () => this.resize());
  }

  _makeParticles(n) {
    this.particles = [];
    for (let i = 0; i < n; i++) {
      const p = fib(i, n, 0.9 + Math.random() * 0.25);
      this.particles.push({ ...p, kind: 'dust', r: 0.7 + Math.random() * 0.9, ph: Math.random() * 6.28 });
    }
  }

  // notesList: [{id,title,type,links,tags}] → puntos en la esfera
  setNotes(notesList) {
    const n = Math.max(1, notesList.length);
    const prev = new Map(this.notes.map(x => [x.id, x]));
    this.notes = notesList.map((note, i) => {
      const old = prev.get(note.id);
      const pos = old ? { x: old.x, y: old.y, z: old.z } : fib(i * 7919 % n, n, 1.02);
      return { ...pos, id: note.id, kind: 'note', title: note.title, type: note.type || 'nota', r: 2.6 + Math.min(3, ((note.body || '').length / 900)), ref: note };
    });
    const byTitle = new Map(notesList.map(x => [x.title.toLowerCase(), x.id]));
    const idx = new Map(this.notes.map(x => [x.id, x]));
    this.links = [];
    for (const note of notesList) for (const l of note.links || []) {
      const to = byTitle.get(l); if (to && to !== note.id) this.links.push([idx.get(note.id), idx.get(to)]);
    }
    // Notas con la misma etiqueta se atraen visualmente con una línea tenue
    const byTag = {};
    for (const note of notesList) for (const t of note.tags || []) (byTag[t] = byTag[t] || []).push(idx.get(note.id));
    this.tagLinks = [];
    for (const group of Object.values(byTag)) for (let i = 0; i < group.length - 1; i++) this.tagLinks.push([group[i], group[i + 1]]);
  }

  setState(state, level) { this.state = state; if (level !== undefined) this.level = level; }
  activate(scores) { this.active = new Map(scores.map(s => [s.id, s.score])); this.pulseUntil = Date.now() + 8000; if (scores[0]) this.focus = scores[0].id; }
  clearActivation() { this.active.clear(); this.focus = null; }

  resize() {
    const dpr = devicePixelRatio || 1; const r = this.c.getBoundingClientRect();
    this.c.width = Math.max(1, r.width * dpr); this.c.height = Math.max(1, r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.w = r.width; this.h = r.height;
  }

  _loop() { const step = () => { this.t += 0.016; this._update(); this._draw(); requestAnimationFrame(step); }; requestAnimationFrame(step); }

  _update() {
    if (!this.drag) {
      const speed = this.state === 'pensando' ? 3 : this.state === 'escuchando' ? 0.4 : 1;
      this.rotY += this.autoSpin * speed;
      if (this.focus) { // girar suavemente hacia la nota enfocada
        const n = this.notes.find(x => x.id === this.focus);
        if (n) { const target = Math.atan2(n.x, n.z); let d = target - (this.rotY % (Math.PI * 2)); d = Math.atan2(Math.sin(d), Math.cos(d)); this.rotY += -d * 0.03; }
        if (Date.now() > this.pulseUntil) this.focus = null;
      }
    }
  }

  _project(p) {
    const cy = Math.cos(this.rotY), sy = Math.sin(this.rotY), cx = Math.cos(this.rotX), sx = Math.sin(this.rotX);
    let x = p.x * cy - p.z * sy, z = p.x * sy + p.z * cy, y = p.y;
    const y2 = y * cx - z * sx; z = y * sx + z * cx; y = y2;
    const R = Math.min(this.w, this.h) * 0.36 * this.zoom;
    const persp = 2.6 / (2.6 + z);
    return { sx: this.w / 2 + x * R * persp, sy: this.h / 2 + y * R * persp, z, s: persp };
  }

  _draw() {
    const { ctx, w, h } = this; if (!w) return;
    ctx.clearRect(0, 0, w, h);
    const glow = this.state === 'escuchando' ? Math.min(0.35, this.level * 5) : this.state === 'pensando' ? 0.1 + 0.05 * Math.sin(this.t * 6) : this.state === 'hablando' ? 0.12 + 0.06 * Math.sin(this.t * 10) : 0.06;
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.min(w, h) * 0.5);
    g.addColorStop(0, rgba(CYAN, glow)); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    const all = [...this.particles, ...this.notes];
    const pr = all.map(p => ({ p, ...this._project(p) }));
    this.projected = pr.filter(x => x.p.kind === 'note');

    // Plexus: líneas entre partículas cercanas (en 3D), más tenues detrás
    ctx.lineWidth = 0.6;
    const dust = pr.filter(x => x.p.kind === 'dust');
    for (let i = 0; i < dust.length; i++) for (let j = i + 1; j < dust.length; j++) {
      const a = dust[i], b = dust[j];
      const d = dist3(a.p, b.p); if (d > 0.42) continue;
      const depth = (a.z + b.z) / 2; const alpha = (1 - d / 0.42) * (0.10 + 0.22 * (0.5 - depth / 2));
      ctx.strokeStyle = rgba(CYAN, alpha); ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }
    // Notas cercanas a partículas: ancla a la malla
    const noteP = pr.filter(x => x.p.kind === 'note');
    for (const n of noteP) for (const d of dust) { if (dist3(n.p, d.p) < 0.36) { ctx.strokeStyle = rgba(CYAN, 0.12); ctx.beginPath(); ctx.moveTo(n.sx, n.sy); ctx.lineTo(d.sx, d.sy); ctx.stroke(); } }
    // Etiquetas compartidas: líneas tenues
    const proj = new Map(pr.map(x => [x.p, x]));
    for (const [a, b] of this.tagLinks || []) { const A = proj.get(a), B = proj.get(b); if (!A || !B) continue; ctx.strokeStyle = rgba(CYAN, 0.18); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy); ctx.stroke(); }
    // Enlaces [[ ]]: líneas fuertes con pulso
    for (const [a, b] of this.links) {
      const A = proj.get(a), B = proj.get(b); if (!A || !B) continue;
      const hot = (this.active.get(a.id) || 0) + (this.active.get(b.id) || 0);
      ctx.strokeStyle = rgba(hot ? [255, 255, 255] : CYAN, hot ? 0.9 : 0.55); ctx.lineWidth = hot ? 1.6 : 1.1;
      ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy); ctx.stroke();
      const k = (this.t * (hot ? 0.9 : 0.35) + (a.x + b.y)) % 1;
      ctx.fillStyle = hot ? '#fff' : rgba(CYAN, 0.9); ctx.beginPath(); ctx.arc(A.sx + (B.sx - A.sx) * k, A.sy + (B.sy - A.sy) * k, 1.8, 0, 6.28); ctx.fill();
    }
    // Partículas
    for (const x of dust) {
      const a = 0.35 + 0.45 * (0.5 - x.z / 2) + 0.15 * Math.sin(this.t * 2 + x.p.ph);
      ctx.fillStyle = rgba(CYAN, Math.max(0.1, a)); ctx.beginPath(); ctx.arc(x.sx, x.sy, x.p.r * x.s, 0, 6.28); ctx.fill();
    }
    // Notas (ordenadas por profundidad, las de delante encima)
    noteP.sort((a, b) => b.z - a.z);
    for (const x of noteP) {
      const col = TYPE_RGB[x.p.type] || CYAN;
      const act = this.active.get(x.p.id) || 0; const isHover = this.hover === x.p;
      const r = (x.p.r + act * 2.5 + (isHover ? 1.5 : 0)) * x.s;
      if (act || isHover) { ctx.fillStyle = rgba(col, 0.18 + 0.2 * act); ctx.beginPath(); ctx.arc(x.sx, x.sy, r + 10 + 3 * Math.sin(this.t * 5), 0, 6.28); ctx.fill(); }
      ctx.shadowColor = rgba(col, 1); ctx.shadowBlur = 14 + act * 12;
      ctx.fillStyle = act || isHover ? '#ffffff' : rgba(col, 0.6 + 0.4 * (0.5 - x.z / 2));
      ctx.beginPath(); ctx.arc(x.sx, x.sy, r, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0;
      // Etiqueta solo si está delante, activa o bajo el cursor
      if (x.z < -0.15 || act || isHover) {
        ctx.font = `${act || isHover ? 12 : 11}px "JetBrains Mono", ui-monospace, monospace`; ctx.textAlign = 'left';
        ctx.fillStyle = act || isHover ? '#ffffff' : rgba(col, 0.75);
        ctx.fillText(trunc(x.p.title, 28).toUpperCase(), x.sx + r + 6, x.sy + 4);
        ctx.strokeStyle = rgba(col, 0.5); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x.sx + r + 1, x.sy); ctx.lineTo(x.sx + r + 5, x.sy); ctx.stroke();
      }
    }
    // Anillos HUD alrededor de la esfera
    const R = Math.min(w, h) * 0.36 * this.zoom;
    ctx.strokeStyle = rgba(CYAN, 0.16); ctx.lineWidth = 0.8; ctx.setLineDash([2, 6]);
    ctx.beginPath(); ctx.arc(w / 2, h / 2, R * 1.22, 0, 6.28); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgba(CYAN, 0.28);
    ctx.beginPath(); ctx.arc(w / 2, h / 2, R * 1.3, this.t * 0.5, this.t * 0.5 + 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, R * 1.3, this.t * 0.5 + 3.14, this.t * 0.5 + 3.94); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, R * 1.38, -this.t * 0.3, -this.t * 0.3 + 0.3); ctx.stroke();
  }

  _hit(px, py) {
    let best = null, bd = 18;
    for (const x of this.projected) { const d = Math.hypot(x.sx - px, x.sy - py); if (d < bd) { bd = d; best = x.p; } }
    return best;
  }
  _bind() {
    const c = this.c;
    const pos = e => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); const p = pos(e); this.drag = { start: p, rx: this.rotX, ry: this.rotY, moved: false, hit: this._hit(p.x, p.y) }; });
    c.addEventListener('pointermove', e => {
      const p = pos(e);
      if (this.drag) {
        const dx = p.x - this.drag.start.x, dy = p.y - this.drag.start.y;
        if (Math.hypot(dx, dy) > 4) this.drag.moved = true;
        this.rotY = this.drag.ry + dx * 0.006; this.rotX = Math.max(-1.3, Math.min(1.3, this.drag.rx + dy * 0.006));
      } else { const hv = this._hit(p.x, p.y); if (hv !== this.hover) { this.hover = hv; c.style.cursor = hv ? 'pointer' : 'grab'; this.onHover(hv ? hv.ref : null); } }
    });
    const up = () => { if (this.drag && !this.drag.moved && this.drag.hit) this.onOpen(this.drag.hit.ref); this.drag = null; };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', e => { e.preventDefault(); this.zoom = Math.max(0.5, Math.min(2.2, this.zoom * Math.exp(-e.deltaY * 0.001))); }, { passive: false });
  }
}

// Punto i de n en una esfera de Fibonacci, radio r
function fib(i, n, r) {
  const phi = Math.acos(1 - 2 * (i + 0.5) / n), theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.cos(phi), z: r * Math.sin(phi) * Math.sin(theta) };
}
const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const trunc = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
