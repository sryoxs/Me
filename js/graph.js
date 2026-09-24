// Grafo de fuerzas en canvas: tu cerebro como bóveda de nodos conectados.
// Nodos = notas y etiquetas. Aristas = [[enlaces]] y pertenencia a etiqueta.

const COLORS = { nota: '#4dd4ff', informe: '#7c5cff', tarea: '#ffb84d', idea: '#3ddc97', flashcard: '#ff8fd8', tag: '#6b7280' };

export class BrainGraph {
  constructor(canvas, { onOpen } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onOpen = onOpen || (() => {});
    this.nodes = [];
    this.edges = [];
    this.scale = 1; this.tx = 0; this.ty = 0;
    this.drag = null; this.pan = null; this.hover = null;
    this.running = false;
    this.alpha = 1;
    this.active = new Map(); // id → intensidad (0..1) tras una búsqueda
    this.t = 0;
    this._bind();
  }

  setData(notes, { filterType = '' } = {}) {
    const prev = new Map(this.nodes.map(n => [n.id, n]));
    const list = filterType ? notes.filter(n => n.type === filterType) : notes;
    const byTitle = new Map(list.map(n => [n.title.toLowerCase(), n]));
    const nodes = [];
    const edges = [];
    const tagNodes = new Map();
    const W = this.canvas.width / (devicePixelRatio || 1), H = this.canvas.height / (devicePixelRatio || 1);

    for (const n of list) {
      const old = prev.get(n.id);
      nodes.push({
        id: n.id, label: n.title, type: n.type || 'nota', kind: 'note', ref: n,
        x: old ? old.x : W / 2 + (Math.random() - 0.5) * 200, y: old ? old.y : H / 2 + (Math.random() - 0.5) * 200,
        vx: 0, vy: 0, r: 7 + Math.min(10, Math.sqrt((n.body || '').length / 40)),
      });
    }
    const idx = new Map(nodes.map(n => [n.id, n]));
    for (const n of list) {
      for (const l of n.links || []) {
        const target = byTitle.get(l);
        if (target && target.id !== n.id) edges.push({ a: idx.get(n.id), b: idx.get(target.id), kind: 'link' });
      }
      for (const t of n.tags || []) {
        let tn = tagNodes.get(t);
        if (!tn) {
          const old = prev.get('tag:' + t);
          tn = { id: 'tag:' + t, label: '#' + t, type: 'tag', kind: 'tag', x: old ? old.x : W / 2 + (Math.random() - 0.5) * 300, y: old ? old.y : H / 2 + (Math.random() - 0.5) * 300, vx: 0, vy: 0, r: 5 };
          tagNodes.set(t, tn); nodes.push(tn);
        }
        edges.push({ a: idx.get(n.id), b: tn, kind: 'tag' });
      }
    }
    for (const tn of tagNodes.values()) tn.r = 5 + Math.min(8, edges.filter(e => e.b === tn).length);
    this.nodes = nodes; this.edges = edges; this.alpha = 1;
    this.start();
  }

  resize() {
    const dpr = devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, rect.width * dpr);
    this.canvas.height = Math.max(1, rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  fit() {
    if (!this.nodes.length) return;
    const rect = this.canvas.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of this.nodes) { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y); }
    const w = Math.max(50, maxX - minX + 120), h = Math.max(50, maxY - minY + 120);
    this.scale = Math.min(2, Math.min(rect.width / w, rect.height / h));
    this.tx = rect.width / 2 - ((minX + maxX) / 2) * this.scale;
    this.ty = rect.height / 2 - ((minY + maxY) / 2) * this.scale;
    this.draw();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const step = () => {
      if (!this.running) return;
      this.tick();
      this.draw();
      if (this.alpha < 0.005 && !this.drag && !(this.pulseUntil > Date.now())) { this.running = false; return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  wake() { this.alpha = Math.max(this.alpha, 0.3); this.start(); }

  // Ilumina los nodos que respondieron a una búsqueda, como neuronas activándose.
  activate(scores) {
    this.active = new Map(scores.map(s => [s.id, s.score]));
    this.pulseUntil = Date.now() + 6000;
    this.wake();
  }

  tick() {
    const nodes = this.nodes, edges = this.edges;
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    // Repulsión
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy || 0.01;
        if (d2 > 90000) continue;
        const f = 900 / d2;
        const d = Math.sqrt(d2);
        dx = dx / d * f; dy = dy / d * f;
        a.vx += dx; a.vy += dy; b.vx -= dx; b.vy -= dy;
      }
    }
    // Atracción por aristas
    for (const e of edges) {
      const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const target = e.kind === 'tag' ? 70 : 110;
      const f = (d - target) * 0.02;
      const fx = dx / d * f, fy = dy / d * f;
      e.a.vx += fx; e.a.vy += fy; e.b.vx -= fx; e.b.vy -= fy;
    }
    // Gravedad al centro + integración
    for (const n of nodes) {
      if (n === (this.drag && this.drag.node)) { n.vx = n.vy = 0; continue; }
      n.vx += (cx - n.x) * 0.002; n.vy += (cy - n.y) * 0.002;
      n.vx *= 0.85; n.vy *= 0.85;
      n.x += n.vx * this.alpha * 2; n.y += n.vy * this.alpha * 2;
    }
    this.alpha *= 0.985;
  }

  draw() {
    const ctx = this.ctx; this.t += 0.02;
    const rect = this.canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.save();
    ctx.translate(this.tx, this.ty); ctx.scale(this.scale, this.scale);
    // Aristas
    for (const e of this.edges) {
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y);
      const hot = (this.active.get(e.a.id) || 0) + (this.active.get(e.b.id) || 0);
      ctx.strokeStyle = hot ? `rgba(77,212,255,${0.3 + Math.min(0.6, hot)})` : e.kind === 'tag' ? 'rgba(107,114,128,0.25)' : 'rgba(124,92,255,0.45)';
      ctx.lineWidth = e.kind === 'tag' ? 1 : 1.5;
      ctx.stroke();
      // Pulso viajando por la arista (siempre en enlaces; en etiquetas solo si están activas)
      if (e.kind === 'link' || hot) {
        const k = (this.t * (hot ? 1.5 : 0.4) + (e.a.x + e.b.y) * 0.001) % 1;
        ctx.fillStyle = hot ? '#4dd4ff' : 'rgba(124,92,255,0.8)';
        ctx.beginPath(); ctx.arc(e.a.x + (e.b.x - e.a.x) * k, e.a.y + (e.b.y - e.a.y) * k, hot ? 2.5 : 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Nodos
    for (const n of this.nodes) {
      const color = COLORS[n.type] || COLORS.nota;
      const isHover = this.hover === n;
      const act = this.active.get(n.id) || 0;
      if (act) { // halo de activación
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 10 + 4 * Math.sin(this.t * 4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77,212,255,${0.12 + 0.25 * act})`; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + (isHover ? 3 : 0) + act * 3, 0, Math.PI * 2);
      if (n.kind === 'note') {
        ctx.shadowColor = color; ctx.shadowBlur = isHover ? 24 : 12;
        ctx.fillStyle = color;
      } else {
        ctx.shadowBlur = 0; ctx.fillStyle = '#1a2234'; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      }
      ctx.fill(); if (n.kind === 'tag') ctx.stroke();
      ctx.shadowBlur = 0;
      // Etiqueta
      if (this.scale > 0.55 || isHover || n.kind === 'note') {
        ctx.font = `${n.kind === 'tag' ? 10 : 12}px -apple-system, Segoe UI, sans-serif`;
        ctx.fillStyle = n.kind === 'tag' ? '#8b94a7' : '#e6e9f0';
        ctx.textAlign = 'center';
        ctx.fillText(truncate(n.label, 26), n.x, n.y + n.r + 14);
      }
    }
    ctx.restore();
    if (!this.nodes.length) {
      ctx.fillStyle = '#8b94a7'; ctx.font = '14px -apple-system, Segoe UI, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Tu cerebro está vacío. Crea notas y aparecerán aquí conectadas.', rect.width / 2, rect.height / 2);
    }
  }

  _toWorld(px, py) { return { x: (px - this.tx) / this.scale, y: (py - this.ty) / this.scale }; }
  _hit(px, py) {
    const p = this._toWorld(px, py);
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      const dx = n.x - p.x, dy = n.y - p.y;
      if (dx * dx + dy * dy <= (n.r + 6) * (n.r + 6)) return n;
    }
    return null;
  }

  _bind() {
    const c = this.canvas;
    const pos = e => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    c.addEventListener('pointerdown', e => {
      c.setPointerCapture(e.pointerId);
      const p = pos(e);
      const n = this._hit(p.x, p.y);
      if (n) this.drag = { node: n, moved: false, start: p };
      else this.pan = { start: p, tx: this.tx, ty: this.ty };
    });
    c.addEventListener('pointermove', e => {
      const p = pos(e);
      if (this.drag) {
        const w = this._toWorld(p.x, p.y);
        this.drag.node.x = w.x; this.drag.node.y = w.y;
        if (Math.hypot(p.x - this.drag.start.x, p.y - this.drag.start.y) > 4) this.drag.moved = true;
        this.wake();
      } else if (this.pan) {
        this.tx = this.pan.tx + (p.x - this.pan.start.x); this.ty = this.pan.ty + (p.y - this.pan.start.y);
        this.draw();
      } else {
        const h = this._hit(p.x, p.y);
        if (h !== this.hover) { this.hover = h; c.style.cursor = h ? 'pointer' : 'grab'; this.draw(); }
      }
    });
    const up = () => {
      if (this.drag && !this.drag.moved && this.drag.node.kind === 'note') this.onOpen(this.drag.node.ref);
      if (this.drag && !this.drag.moved && this.drag.node.kind === 'tag') this.onOpen({ tag: this.drag.node.label.slice(1) });
      this.drag = null; this.pan = null;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', e => {
      e.preventDefault();
      const p = pos(e);
      const factor = Math.exp(-e.deltaY * 0.001);
      const ns = Math.min(4, Math.max(0.2, this.scale * factor));
      this.tx = p.x - (p.x - this.tx) * (ns / this.scale);
      this.ty = p.y - (p.y - this.ty) * (ns / this.scale);
      this.scale = ns; this.draw();
    }, { passive: false });
    // Pinch en táctil
    let pinch = null;
    c.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = { d: dist(e.touches), s: this.scale }; }, { passive: true });
    c.addEventListener('touchmove', e => {
      if (pinch && e.touches.length === 2) { this.scale = Math.min(4, Math.max(0.2, pinch.s * dist(e.touches) / pinch.d)); this.draw(); }
    }, { passive: true });
    c.addEventListener('touchend', () => { pinch = null; });
  }
}

function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
