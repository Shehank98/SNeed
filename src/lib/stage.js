// Stage = four stacked layers inside one box:
//   bg canvas   - the four zones (redrawn only on resize / settings change)
//   guide canvas- dotted guide, watch animation, block outlines, circles
//   ink canvas  - the child's drawing (Pointer Events, DPR scaled, smooth round strokes)
//   markers     - DOM start dots / cloud markers (CSS animated, no canvas redraw)
import { h } from './dom.js';
import { drawScene, COLORS } from './scene.js';

export class Stage {
  /**
   * @param opts.layout      (W,H) => {L, ox, oy}   how world units map to pixels
   * @param opts.getZones    () => {showZones, showDirt, highlightGrass, threeLine}
   * @param opts.interactive allow drawing (default true)
   * @param opts.onStrokeEnd (index, strokeWorld) => void
   * @param opts.onStrokeStart (index) => void
   * @param opts.drawGuide   (ctx, lay) => void   static guide painter
   */
  constructor(opts) {
    this.opts = { interactive: true, ...opts };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.strokes = []; // world coordinates
    this.marks = []; // circle marks (world coordinates), drawn on the guide layer
    this.inkTarget = 'ink';
    this.lay = { W: 0, H: 0, L: 80, ox: 0, oy: 0 };
    this.markers = [];
    this.frozen = false;

    this.bg = h('canvas', { class: 'layer' });
    this.guide = h('canvas', { class: 'layer' });
    this.ink = h('canvas', { class: 'layer ink' });
    this.markerLayer = h('div', { class: 'markers' });
    this.overlay = h('div', { class: 'stage-overlay' });
    this.el = h('div', { class: 'stage' }, this.bg, this.guide, this.ink, this.markerLayer, this.overlay);
    this.bgx = this.bg.getContext('2d');
    this.gx = this.guide.getContext('2d');
    this.ix = this.ink.getContext('2d');

    if (this.opts.interactive) this._bindPointer();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
  }

  destroy() {
    this.ro.disconnect();
    cancelAnimationFrame(this._raf);
    this.destroyed = true;
  }

  // ---- layout ----
  resize() {
    const r = this.el.getBoundingClientRect();
    const W = Math.round(r.width), H = Math.round(r.height);
    if (!W || !H) return;
    this.rect = r;
    for (const c of [this.bg, this.guide, this.ink]) {
      c.width = Math.round(W * this.dpr);
      c.height = Math.round(H * this.dpr);
    }
    const { L, ox, oy } = this.opts.layout(W, H);
    this.lay = { W, H, L, ox, oy };
    this.inkW = Math.max(7, L * 0.15);
    this.redrawAll();
  }
  redrawAll() {
    this.redrawBg();
    this.redrawGuide();
    this.redrawInk();
    this.placeMarkers();
  }
  redrawBg() {
    const { W, H } = this.lay;
    this.bgx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    drawScene(this.bgx, this.lay, this.opts.getZones());
  }
  redrawGuide() {
    const ctx = this.gx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.lay.W, this.lay.H);
    this.opts.drawGuide?.(ctx, this.lay);
    if (this.marks.length) this._drawStrokes(ctx, this.marks, '#ff7a00', this.inkW * 0.6);
  }
  redrawInk() {
    const ctx = this.ix;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.lay.W, this.lay.H);
    this._drawStrokes(ctx, this.strokes, COLORS.ink, this.inkW);
  }

  px(x, y) { return [this.lay.ox + x * this.lay.L, this.lay.oy + y * this.lay.L]; }
  world(px, py) { return [(px - this.lay.ox) / this.lay.L, (py - this.lay.oy) / this.lay.L]; }

  // ---- markers (DOM) ----
  /** items: {type:'start'|'cloud'|'dot', x, y, n, pulse} in world units */
  setMarkers(items) {
    this.markers = items;
    this.markerLayer.replaceChildren(
      ...items.map((m) => {
        const el = h('div', { class: `marker ${m.type} ${m.pulse ? 'pulse' : ''}` }, m.n != null ? h('b', {}, String(m.n)) : null);
        m.el = el;
        return el;
      })
    );
    this.placeMarkers();
  }
  placeMarkers() {
    const s = Math.max(34, this.lay.L * 0.38);
    this.markerLayer.style.setProperty('--ms', s + 'px');
    for (const m of this.markers) {
      const [px, py] = this.px(m.x, m.y);
      m.el.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
    }
  }

  // ---- drawing ----
  _drawStrokes(ctx, strokes, color, width) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    for (const s of strokes) {
      const pts = s.map((p) => this.px(p[0], p[1]));
      if (pts.length < 2 || (pts.length === 2 && pts[0][0] === pts[1][0] && pts[0][1] === pts[1][1])) {
        ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], width * 0.6, 0, 7); ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    }
  }

  _bindPointer() {
    const el = this.ink;
    let pid = null, pts = null, color, width, ctx;
    const local = (e) => [e.clientX - this.rect.left, e.clientY - this.rect.top];
    const target = () => {
      const marks = this.inkTarget === 'marks';
      return { list: marks ? this.marks : this.strokes, ctx: marks ? this.gx : this.ix, color: marks ? '#ff7a00' : COLORS.ink, width: marks ? this.inkW * 0.6 : this.inkW };
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (pid !== null || this.frozen) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.rect = this.el.getBoundingClientRect(); // fresh rect: layout may have shifted
      pid = e.pointerId;
      try { el.setPointerCapture(pid); } catch (err) { /* ignore */ }
      const t = target();
      ({ ctx, color, width } = t);
      const [x, y] = local(e);
      pts = [[x, y]];
      t.list.push([this.world(x, y)]);
      this.opts.onStrokeStart?.(t.list.length - 1, this.inkTarget);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, width * 0.5, 0, 7); ctx.fill();
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pid) return;
      e.preventDefault();
      const t = target();
      const cur = t.list[t.list.length - 1];
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.lineWidth = width;
      for (const ev of evs.length ? evs : [e]) {
        const [x, y] = local(ev);
        const last = pts[pts.length - 1];
        if (Math.hypot(x - last[0], y - last[1]) < 1.5) continue;
        pts.push([x, y]);
        cur.push(this.world(x, y));
        const n = pts.length;
        ctx.beginPath();
        if (n >= 3) {
          const a = pts[n - 3], b = pts[n - 2], c = pts[n - 1];
          ctx.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
          ctx.quadraticCurveTo(b[0], b[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2);
        } else {
          ctx.moveTo(last[0], last[1]);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    const end = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      const t = target();
      const stroke = t.list[t.list.length - 1];
      pts = null;
      if (stroke) this.opts.onStrokeEnd?.(t.list.length - 1, stroke, this.inkTarget);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    // iOS Safari < 13 and pinch/gesture guards: never scroll or zoom while drawing.
    el.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  // ---- ink API ----
  undo() {
    const list = this.inkTarget === 'marks' ? this.marks : this.strokes;
    list.pop();
    this.inkTarget === 'marks' ? this.redrawGuide() : this.redrawInk();
  }
  clear() {
    this.strokes = [];
    this.marks = [];
    this.redrawInk();
    this.redrawGuide();
  }
  clearMarks() { this.marks = []; this.redrawGuide(); }

  /** PNG of zones + ink (used by the "Find best size" comparison). */
  snapshot(maxW = 640) {
    const c = document.createElement('canvas');
    const k = Math.min(1, maxW / this.bg.width);
    c.width = Math.round(this.bg.width * k);
    c.height = Math.round(this.bg.height * k);
    const x = c.getContext('2d');
    x.drawImage(this.bg, 0, 0, c.width, c.height);
    x.drawImage(this.ink, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  }
}
