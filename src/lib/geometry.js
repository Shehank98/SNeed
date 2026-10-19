// Pure geometry feedback (no ML). All coordinates are in "line units":
// y=0 sky, y=1 clouds, y=2 grass, y>2 dirt. 1 unit = distance between lines.

export const TOL = {
  startY: 0.45, // start must be this close to the start line (y)
  startDist: 0.6, // ...and this close to the start dot
  tap: 0.35, // cloud tap marker radius
  dot: 0.55, // dot (i, j) radius
  skyReach: 0.45, // tall letters: top must be at or above this y
  grassSlack: 0.45, // bottom may be this far below the grass line (small/tall)
  dirtReach: 2.6, // dirt letters: bottom must reach this y
  smallTop: 0.55, // small letters: top must be below this y
  shapeOk: 0.3,
  shapeBad: 0.5,
};

export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function pathLength(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

export function resample(pts, n) {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => pts[0]);
  const total = pathLength(pts);
  if (total === 0) return Array.from({ length: n }, () => pts[0]);
  const out = [pts[0]];
  const step = total / (n - 1);
  let acc = 0, i = 1, prev = pts[0];
  while (out.length < n - 1 && i < pts.length) {
    const d = dist(prev, pts[i]);
    if (acc + d >= step) {
      const t = (step - acc) / d;
      const p = [prev[0] + (pts[i][0] - prev[0]) * t, prev[1] + (pts[i][1] - prev[1]) * t];
      out.push(p);
      prev = p;
      acc = 0;
    } else {
      acc += d;
      prev = pts[i];
      i++;
    }
  }
  out.push(pts[pts.length - 1]);
  while (out.length < n) out.push(pts[pts.length - 1]);
  return out;
}

function distToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function distToPolyline(p, poly) {
  if (poly.length === 1) return dist(p, poly[0]);
  let m = Infinity;
  for (let i = 1; i < poly.length; i++) m = Math.min(m, distToSegment(p, poly[i - 1], poly[i]));
  return m;
}

// Symmetric chamfer distance: how far the child strayed from the model, and how
// much of the model the child covered. Direction-independent.
export function chamfer(child, ref) {
  const c = resample(child, 24), r = resample(ref, 24);
  const a = c.reduce((s, p) => s + distToPolyline(p, ref), 0) / c.length;
  const b = r.reduce((s, p) => s + distToPolyline(p, child), 0) / r.length;
  return (a + b) / 2;
}

// Pointwise distance (start to start), used to tell forward from reversed.
function pointwise(child, ref) {
  const c = resample(child, 20), r = resample(ref, 20);
  return c.reduce((s, p, i) => s + dist(p, r[i]), 0) / c.length;
}

export function bbox(strokes) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of strokes) for (const p of s) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  return { minX, maxX, minY, maxY };
}

const isDotRef = (s) => s.dot;
const isTap = (pts) => pathLength(pts) < 0.3;

/**
 * Check a child's strokes against a letter definition.
 * @param letter   entry from letters.json
 * @param strokes  array of polylines in world units (same coordinate system as the data)
 * @param opts.normalizeX  shift the child's strokes horizontally so their left edge
 *                         matches the model (used when there is no guide to align to)
 * @returns {{stars:number, issues:Array<{type,severity,stroke,cue}>, ok:boolean}}
 */
export function checkLetter(letter, strokes, opts = {}) {
  const issues = [];
  const add = (type, severity, stroke, cue) => issues.push({ type, severity, stroke, cue });
  const refs = letter.strokes;
  const mainCue = letter.cues[0];

  if (strokes.length !== refs.length) {
    add('strokeCount', 'critical', -1, 'followArrows');
    return finish(issues);
  }

  let child = strokes;
  if (opts.normalizeX) {
    const cb = bbox(child);
    const rb = bbox(refs.map((s) => s.points));
    const dx = rb.minX - cb.minX;
    child = child.map((s) => s.map((p) => [p[0] + dx, p[1]]));
  }

  refs.forEach((ref, k) => {
    const c = child[k];
    const start = c[0];
    if (isDotRef(ref)) {
      if (!isTap(c) || dist(c[0], ref.points[0]) > TOL.dot) add('dot', 'major', k, 'followArrows');
      return;
    }
    if (isTap(c)) {
      add('shape', 'critical', k, 'followArrows');
      return;
    }
    // start line + start dot
    const startY = k === 0 ? letter.startY : ref.start[1];
    if (Math.abs(start[1] - startY) > TOL.startY && k === 0) add('startLine', 'critical', k, mainCue);
    else if (dist(start, ref.start) > TOL.startDist) add('startDot', k === 0 ? 'critical' : 'major', k, k === 0 ? mainCue : 'followArrows');

    // which model stroke does this look most like? (stroke order)
    const costs = refs.map((r2) => (isDotRef(r2) ? Infinity : chamfer(c, r2.points)));
    const best = costs.indexOf(Math.min(...costs));
    if (best !== k && costs[best] + 0.08 < costs[k]) add('order', 'critical', k, k === 0 ? mainCue : 'followArrows');

    // shape
    const ch = costs[k];
    if (ch > TOL.shapeBad) add('shape', 'major', k, 'followDots');
    else if (ch > TOL.shapeOk) add('shape', 'minor', k, 'followDots');

    // direction
    const fwd = pointwise(c, ref.points);
    const rev = pointwise([...c].reverse(), ref.points);
    if (rev + 0.12 < fwd && !issues.some((i) => i.stroke === k && i.severity === 'critical')) {
      add('direction', 'critical', k, letter.cues.includes('skydiver') ? 'skydiver' : 'followArrows');
    }

    // tap two clouds: the curve must pass both markers, in order
    if (ref.cloudTaps) {
      const rs = resample(c, 60);
      const idx = ref.cloudTaps.map((t) => rs.findIndex((p) => dist(p, t) <= TOL.tap));
      if (idx.some((i) => i < 0) || idx[0] > idx[1]) add('curveShort', 'major', k, 'twoClouds');
    }
  });

  // zones (all non-dot strokes together)
  const body = child.filter((_, k) => !isDotRef(refs[k]));
  if (body.length) {
    const bb = bbox(body);
    if (letter.group === 'tall') {
      if (bb.minY > TOL.skyReach) add('notSky', 'major', -1, 'tallSky');
      if (bb.maxY > 2 + TOL.grassSlack) add('tooLow', 'major', -1, 'tallSky');
    } else if (letter.group === 'small') {
      if (bb.minY < TOL.smallTop) add('tooTall', 'major', -1, 'smallStay');
      if (bb.maxY > 2 + TOL.grassSlack) add('tooLow', 'major', -1, 'smallStay');
    } else {
      if (bb.maxY < TOL.dirtReach) add('notMuddy', 'major', -1, letter.cues.includes('pBounce') && letter.char === 'p' ? 'pBounce' : 'muddy');
      if (bb.minY < TOL.smallTop) add('tooTall', 'major', -1, 'smallStay');
    }
  }
  return finish(issues);
}

function finish(issues) {
  const crit = issues.some((i) => i.severity === 'critical');
  const majors = issues.filter((i) => i.severity === 'major').length;
  const minors = issues.filter((i) => i.severity === 'minor').length;
  let stars = 3;
  if (crit || majors >= 2) stars = 1;
  else if (majors === 1 || minors >= 2) stars = 2;
  const order = { critical: 0, major: 1, minor: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  return { stars, issues, ok: stars >= 2, hintCue: issues.length ? issues[0].cue : null };
}

// ---------- word spacing ("three clouds") ----------
export const CLOUD_W = 0.4; // width of one cloud, in line units
export const GAP_CLOUDS = 3;

/** Merge the horizontal extents of ink into clusters; return the whitespace between them. */
export function inkGaps(strokes, pad = 0.08) {
  const iv = strokes
    .filter((s) => s.length)
    .map((s) => {
      const xs = s.map((p) => p[0]);
      return [Math.min(...xs) - pad, Math.max(...xs) + pad];
    })
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const v of iv) {
    const last = merged[merged.length - 1];
    if (last && v[0] <= last[1]) last[1] = Math.max(last[1], v[1]);
    else merged.push([v[0], v[1]]);
  }
  const gaps = [];
  for (let i = 1; i < merged.length; i++) {
    const x0 = merged[i - 1][1], x1 = merged[i][0];
    gaps.push({ x0, x1, width: x1 - x0, clouds: (x1 - x0) / CLOUD_W });
  }
  return { clusters: merged, gaps };
}

export function judgeGap(gap) {
  const n = Math.floor(gap.clouds + 1e-6);
  if (gap.clouds >= GAP_CLOUDS && gap.clouds <= GAP_CLOUDS * 2.2) return { status: 'good', clouds: n };
  if (gap.clouds > GAP_CLOUDS * 2.2) return { status: 'wide', clouds: n };
  return { status: 'tight', clouds: n };
}

/** Pick the gap closest to a circled x-range. */
export function gapForCircle(gaps, circle) {
  const cx = (circle.minX + circle.maxX) / 2;
  let best = null, bd = Infinity;
  for (const g of gaps) {
    if (g.width < 0.05) continue;
    const d = cx >= g.x0 && cx <= g.x1 ? 0 : Math.min(Math.abs(cx - g.x0), Math.abs(cx - g.x1));
    if (d < bd) { bd = d; best = g; }
  }
  return bd <= Math.max(0.5, (circle.maxX - circle.minX) / 2) ? best : null;
}
