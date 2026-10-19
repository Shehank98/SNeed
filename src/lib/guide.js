// Guide painters (canvas) + letter SVG renderer (DOM) built from the stroke data.
import { svgNS } from './dom.js';
import { resample } from './geometry.js';

export const GROUP_COLOR = { small: '#2f8fe8', tall: '#8a5cf6', dirt: '#b9743a' };

/** Dotted guide for Trace mode. Strokes before `from` are drawn lighter (already done). */
export function drawDotted(ctx, stage, letter, from = 0) {
  const { L } = stage.lay;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  letter.strokes.forEach((s, i) => {
    const pts = s.points.map((p) => stage.px(p[0], p[1]));
    if (s.dot) {
      ctx.fillStyle = i < from ? 'rgba(122,107,214,.35)' : 'rgba(122,107,214,.9)';
      ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], L * 0.09, 0, 7); ctx.fill();
      return;
    }
    path(ctx, pts);
    ctx.strokeStyle = 'rgba(122,107,214,.2)';
    ctx.lineWidth = Math.max(18, L * 0.3);
    ctx.stroke();
    path(ctx, pts);
    ctx.strokeStyle = i < from ? 'rgba(122,107,214,.35)' : '#5a47c9';
    ctx.lineWidth = Math.max(5, L * 0.085);
    ctx.setLineDash([0.01, Math.max(11, L * 0.15)]);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

/** Solid model stroke (used when the Watch demo finishes). */
export function drawSolid(ctx, stage, letter, color = 'rgba(61,42,122,.55)', upTo = letter.strokes.length) {
  const { L } = stage.lay;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  letter.strokes.slice(0, upTo).forEach((s) => {
    const pts = s.points.map((p) => stage.px(p[0], p[1]));
    if (s.dot) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], L * 0.075, 0, 7); ctx.fill(); return; }
    path(ctx, pts);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(6, L * 0.13);
    ctx.stroke();
  });
}

/** Arrow heads along each stroke showing the direction. */
export function drawArrows(ctx, stage, letter) {
  const { L } = stage.lay;
  const sz = Math.max(9, L * 0.1);
  letter.strokes.forEach((s) => {
    if (s.dot) return;
    const r = resample(s.points, 9);
    // place near 45% of the way
    const a = stage.px(...r[4]), b = stage.px(...r[5]);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(sz, 0); ctx.lineTo(-sz * 0.7, -sz * 0.85); ctx.lineTo(-sz * 0.35, 0); ctx.lineTo(-sz * 0.7, sz * 0.85);
    ctx.closePath();
    ctx.fillStyle = '#ff7a00';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  });
}

export function path(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
}

/** Vector skydiver (parachute + kid) drawn at the pen position. */
export function drawSkydiver(ctx, x, y, s) {
  ctx.save();
  ctx.lineCap = 'round';
  const cy = y - s * 1.9;
  ctx.beginPath();
  ctx.arc(x, cy, s * 1.1, Math.PI, 0);
  ctx.quadraticCurveTo(x, cy + s * 0.55, x - s * 1.1, cy);
  ctx.fillStyle = '#ff5d8f';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, cy, s * 1.1, Math.PI * 1.34, Math.PI * 1.66); ctx.lineTo(x, cy); ctx.fill();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
  for (const dx of [-1.1, 0, 1.1]) { ctx.beginPath(); ctx.moveTo(x + dx * s, cy); ctx.lineTo(x, y - s * 0.5); ctx.stroke(); }
  ctx.fillStyle = '#ffcf9f';
  ctx.beginPath(); ctx.arc(x, y - s * 0.35, s * 0.32, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3d2a7a'; ctx.lineWidth = s * 0.3;
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.05); ctx.lineTo(x, y + s * 0.5); ctx.stroke();
  ctx.restore();
}

export function drawPen(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.arc(x + 2, y + 3, s, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffb703';
  ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.3, s * 0.3, 0, 7); ctx.fill();
  ctx.restore();
}

/** Letter as an inline SVG using the real stroke data. opts: {height, lines, arrows, numbers, color, strokeW} */
export function letterSVG(letter, opts = {}) {
  const { lines = false, color = GROUP_COLOR[letter.group], strokeW = 0.17, numbers = false, tail = true } = opts;
  const bb = letter.bbox;
  const cx = (bb.minX + bb.maxX) / 2;
  const vw = 1.7, y0 = -0.2, vh = tail ? 3.5 : 2.4;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `${cx - vw / 2} ${y0} ${vw} ${vh}`);
  svg.setAttribute('class', 'letter-svg');
  svg.setAttribute('aria-label', letter.char);
  const add = (tag, attrs, parent = svg) => {
    const el = document.createElementNS(svgNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.append(el);
    return el;
  };
  if (lines) {
    const x0 = cx - vw / 2, x1 = cx + vw / 2;
    add('line', { x1: x0, x2: x1, y1: 0, y2: 0, stroke: '#2f8fe8', 'stroke-width': 0.05 });
    add('line', { x1: x0, x2: x1, y1: 1, y2: 1, stroke: '#9aa9bd', 'stroke-width': 0.05, 'stroke-dasharray': '0.01 0.12', 'stroke-linecap': 'round' });
    add('line', { x1: x0, x2: x1, y1: 2, y2: 2, stroke: '#2fb84f', 'stroke-width': 0.07 });
    if (tail) add('rect', { x: x0, y: 2.03, width: vw, height: vh + y0 - 2.03, fill: 'rgba(160,110,60,.35)' });
  }
  letter.strokes.forEach((s, i) => {
    if (s.dot) { add('circle', { cx: s.points[0][0], cy: s.points[0][1], r: strokeW * 0.65, fill: color }); return; }
    add('polyline', {
      points: s.points.map((p) => p.join(',')).join(' '), fill: 'none', stroke: color,
      'stroke-width': strokeW, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    });
    if (numbers) {
      add('circle', { cx: s.start[0], cy: s.start[1], r: 0.17, fill: '#3ddc97', stroke: '#fff', 'stroke-width': 0.04 });
      const tx = add('text', { x: s.start[0], y: s.start[1] + 0.08, 'text-anchor': 'middle', 'font-size': 0.24, 'font-weight': 800, fill: '#fff' });
      tx.textContent = i + 1;
    }
  });
  return svg;
}
