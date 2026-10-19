// "Letter blocks": outlines that show a letter's size (tall / small / dirt tail) sitting on the lines.
import { COLORS } from './scene.js';
import { GROUP_COLOR } from './guide.js';
import { blockRange } from './letters.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * @param b {x, w, letter, state:'hidden'|'open'|'filled', strokes?:world strokes already placed, glow?}
 * x/w are world units; the block spans the letter's zone height.
 */
export function drawBlock(ctx, stage, b) {
  const { L } = stage.lay;
  const [y0, y1] = blockRange(b.letter);
  const [px, py] = stage.px(b.x, y0 - 0.04);
  const w = b.w * L, h = (y1 - y0 + 0.08) * L;
  const col = GROUP_COLOR[b.letter.group];
  ctx.save();
  rr(ctx, px, py, w, h, Math.min(16, L * 0.16));
  ctx.fillStyle = b.state === 'filled' ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.5)';
  ctx.fill();
  ctx.lineWidth = Math.max(3, L * 0.05);
  ctx.strokeStyle = col;
  if (b.state !== 'filled') ctx.setLineDash([L * 0.16, L * 0.1]);
  if (b.glow) { ctx.shadowColor = '#ffb703'; ctx.shadowBlur = 16; }
  ctx.stroke();
  ctx.restore();
  if (b.state === 'hidden') {
    ctx.save();
    ctx.fillStyle = col;
    ctx.font = `900 ${Math.max(20, L * 0.7)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', px + w / 2, py + h / 2);
    ctx.restore();
  }
  if (b.strokes) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = COLORS.ink; ctx.fillStyle = COLORS.ink;
    ctx.lineWidth = Math.max(5, L * 0.13);
    for (const s of b.strokes) {
      const pts = s.map((p) => stage.px(p[0], p[1]));
      if (pts.length < 2) { ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], ctx.lineWidth * 0.6, 0, 7); ctx.fill(); continue; }
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** The model letter's strokes, placed so the letter is centred in a block starting at x. */
export function placeModel(letter, x, w) {
  const c = (letter.bbox.minX + letter.bbox.maxX) / 2;
  const dx = x + w / 2 - c;
  return letter.strokes.map((s) => s.points.map((p) => [p[0] + dx, p[1]]));
}

/** Child strokes (already x-normalised to the model) moved into a block. */
export function placeChild(letter, strokes, x, w) {
  const c = (letter.bbox.minX + letter.bbox.maxX) / 2;
  const dx = x + w / 2 - c;
  return strokes.map((s) => s.map((p) => [p[0] + dx, p[1]]));
}

export const blockWidth = (letter) => Math.max(1.0, letter.bbox.maxX - letter.bbox.minX + 0.4);
