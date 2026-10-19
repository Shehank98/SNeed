// "Watch" mode: an animated pen writes the letter stroke by stroke.
import { resample, pathLength } from './geometry.js';
import { drawPen, drawSkydiver, path } from './guide.js';
import { COLORS } from './scene.js';

const sleep = (ms, ctl) => new Promise((res) => { ctl.timers.push(setTimeout(res, ms)); });

/**
 * Animate the letter on stage.gx. Resolves true when finished, false if cancelled.
 * `onStroke(i)` fires when stroke i begins (start dot pulses first).
 */
export function playWatch(stage, letter, { speed = 1.5, onStroke, skydiverLetters = true, dx = 0, keep = [] } = {}) {
  const ctl = { cancelled: false, timers: [] };
  ctl.cancel = () => { ctl.cancelled = true; ctl.timers.forEach(clearTimeout); cancelAnimationFrame(ctl.raf); };
  const ctx = stage.gx;
  const L = () => stage.lay.L;
  const hasSky = skydiverLetters && letter.cues.includes('skydiver');
  const hasBounce = letter.cues.includes('pBounce');

  const paint = (done, cur, upTo, extra) => {
    ctx.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
    ctx.clearRect(0, 0, stage.lay.W, stage.lay.H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = COLORS.ink; ctx.fillStyle = COLORS.ink;
    ctx.lineWidth = Math.max(7, L() * 0.15);
    for (const pts of keep) drawPts(ctx, stage, pts);
    for (const pts of done) drawPts(ctx, stage, pts);
    if (cur) drawPts(ctx, stage, cur.slice(0, upTo));
    extra?.();
  };

  const run = async () => {
    const done = [];
    for (let i = 0; i < letter.strokes.length; i++) {
      if (ctl.cancelled) return false;
      const s = letter.strokes[i];
      onStroke?.(i);
      paint(done);
      await sleep(i === 0 ? 700 : 450, ctl);
      if (ctl.cancelled) return false;
      const shifted = s.points.map((p) => [p[0] + dx, p[1]]);
      const pts = s.dot ? [shifted[0], shifted[0]] : resample(shifted, 90);
      const len = s.dot ? 0.3 : pathLength(s.points);
      const dur = Math.max(s.dot ? 350 : 600, (len / speed) * 1000);
      const bottom = hasBounce && !s.dot ? pts.reduce((b, p, k) => (p[1] > pts[b][1] ? k : b), 0) : -1;
      await new Promise((resolve) => {
        let last = performance.now(), elapsed = 0, holdLeft = 0, bounced = false;
        const frame = (now) => {
          if (ctl.cancelled) return resolve();
          const dt = now - last;
          last = now;
          if (holdLeft > 0) holdLeft -= dt; else elapsed += dt;
          const t = Math.min(1, elapsed / dur);
          const k = Math.round(t * (pts.length - 1));
          if (bottom >= 0 && !bounced && k >= bottom) { bounced = true; holdLeft = 300; }
          const head = pts[k];
          paint(done, pts, Math.max(2, k + 1), () => {
            const [x, y] = stage.px(head[0], head[1]);
            if (holdLeft > 0) {
              // p drops into the dirt: little mud splash before it bounces back up
              ctx.fillStyle = '#8a5a32';
              for (let d = 0; d < 7; d++) {
                const a = (d / 6) * Math.PI + Math.PI;
                ctx.beginPath(); ctx.arc(x + Math.cos(a) * L() * 0.32, y + Math.sin(a) * L() * 0.24, L() * 0.05, 0, 7); ctx.fill();
              }
            }
            if (hasSky && i === 0) drawSkydiver(ctx, x, y, L() * 0.2);
            else drawPen(ctx, x, y, Math.max(9, L() * 0.13));
          });
          if (t >= 1 && holdLeft <= 0) return resolve();
          ctl.raf = requestAnimationFrame(frame);
        };
        ctl.raf = requestAnimationFrame(frame);
      });
      if (ctl.cancelled) return false;
      done.push(pts);
    }
    paint(done);
    await sleep(450, ctl);
    return !ctl.cancelled;
  };
  ctl.promise = run();
  return ctl;
}

function drawPts(ctx, stage, pts) {
  const px = pts.map((p) => stage.px(p[0], p[1]));
  if (px.length === 2 && px[0][0] === px[1][0] && px[0][1] === px[1][1]) {
    ctx.beginPath(); ctx.arc(px[0][0], px[0][1], ctx.lineWidth * 0.6, 0, 7); ctx.fill();
    return;
  }
  path(ctx, px);
  ctx.stroke();
}
