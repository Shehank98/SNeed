// Draws the four zones: Sky (top line), Clouds (dotted), Grass (baseline), Dirt (below).
// Coordinates: y=0 sky, y=1 clouds, y=2 grass, y>2 dirt; px = ox + x*L, py = oy + y*L.
import { t } from './i18n.js';

export const COLORS = {
  sky: '#2f8fe8', cloud: '#9aa9bd', grass: '#2fb84f', ink: '#3d2a7a',
  dirtTop: '#b98a5a', dirtBottom: '#8a5a32',
};

export function drawCloud(ctx, x, y, s, fill = '#fff', stroke = 'rgba(120,150,190,.55)') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.arc(-0.5, 0.05, 0.32, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(-0.2, -0.22, 0.34, Math.PI, Math.PI * 1.95);
  ctx.arc(0.28, -0.18, 0.3, Math.PI * 1.1, Math.PI * 2.1);
  ctx.arc(0.5, 0.05, 0.28, Math.PI * 1.5, Math.PI * 2.5);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 0.05;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}

function tuft(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.quadraticCurveTo(x - s * 0.7, y - s * 1.4, x - s * 0.9, y - s * 1.6);
  ctx.quadraticCurveTo(x - s * 0.2, y - s * 1.1, x, y);
  ctx.quadraticCurveTo(x + s * 0.1, y - s * 1.8, x + s * 0.2, y - s * 2);
  ctx.quadraticCurveTo(x + s * 0.7, y - s * 1.2, x + s * 0.5, y);
  ctx.quadraticCurveTo(x + s * 1.0, y - s * 1.1, x + s * 1.3, y - s * 1.3);
  ctx.quadraticCurveTo(x + s * 1.2, y - s * 0.5, x + s * 1.0, y);
  ctx.closePath();
  ctx.fill();
}

/**
 * @param lay   {W,H,L,ox,oy}
 * @param opt   {showZones, showDirt, highlightGrass, threeLine, labels}
 */
export function drawScene(ctx, lay, opt) {
  const { W, H, L, oy } = lay;
  const Y = (y) => oy + y * L;
  const lw = Math.max(3, L * 0.04);
  const paper = '#fffdf6';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  if (opt.showZones) {
    const g = ctx.createLinearGradient(0, 0, 0, Y(0));
    g.addColorStop(0, '#69bdfd');
    g.addColorStop(1, '#bfe6ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, Y(0));
    ctx.fillStyle = '#e4f4ff';
    ctx.fillRect(0, Y(0), W, Y(1) - Y(0));
    ctx.fillStyle = '#fffbea';
    ctx.fillRect(0, Y(1), W, Y(2) - Y(1));
    // sky art: small clouds above the sky line
    const cs = Math.max(26, L * 0.5);
    [[0.12, 0.35, 1], [0.42, 0.62, 0.8], [0.74, 0.3, 1.1], [0.93, 0.7, 0.7]].forEach(([fx, fy, k]) => {
      const cy = Math.max(cs * 0.6, Y(0) - L * 1.0 * fy - cs * 0.2);
      drawCloud(ctx, W * fx, cy, cs * k);
    });
  }
  if (opt.showDirt) {
    const g = ctx.createLinearGradient(0, Y(2), 0, H);
    g.addColorStop(0, COLORS.dirtTop);
    g.addColorStop(1, COLORS.dirtBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, Y(2), W, H - Y(2));
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    [[0.1, 2.5], [0.3, 2.85], [0.55, 2.4], [0.8, 2.75], [0.92, 3.1], [0.45, 3.25]].forEach(([fx, y]) => {
      ctx.beginPath(); ctx.ellipse(W * fx, Y(y), L * 0.07, L * 0.045, 0, 0, 7); ctx.fill();
    });
    ctx.font = `${Math.max(18, L * 0.34)}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('🪱', W * 0.84, Y(2.55));
  }

  // sky line (solid blue)
  ctx.lineCap = 'round';
  ctx.lineWidth = lw * 1.2;
  ctx.strokeStyle = COLORS.sky;
  line(ctx, 10, Y(0), W - 10, Y(0));

  // clouds line (dotted, with cloud icons at both ends)
  if (opt.threeLine) {
    ctx.strokeStyle = opt.showZones ? '#aab6c6' : COLORS.cloud;
    ctx.lineWidth = lw * 1.2;
    ctx.setLineDash([0.01, Math.max(9, L * 0.13)]);
    line(ctx, 10 + L * 0.5, Y(1), W - 10 - L * 0.5, Y(1));
    ctx.setLineDash([]);
    const cs = Math.max(16, L * 0.26);
    drawCloud(ctx, 10 + cs * 0.9, Y(1), cs);
    drawCloud(ctx, W - 10 - cs * 0.9, Y(1), cs);
  }

  // grass line (solid green) + tufts
  if (opt.highlightGrass) {
    ctx.strokeStyle = 'rgba(255,214,10,.55)';
    ctx.lineWidth = lw * 5;
    line(ctx, 0, Y(2), W, Y(2));
  }
  ctx.strokeStyle = COLORS.grass;
  ctx.lineWidth = lw * (opt.highlightGrass ? 2.2 : 1.6);
  line(ctx, 10, Y(2), W - 10, Y(2));
  if (opt.showZones || opt.highlightGrass) {
    ctx.fillStyle = '#23a043';
    const step = Math.max(34, L * 0.5);
    for (let x = step * 0.5, i = 0; x < W; x += step, i++) tuft(ctx, x + (i % 3) * 5, Y(2) + lw * 0.2, Math.max(5, L * 0.07) * (opt.highlightGrass ? 1.4 : 1));
  }

  // tiny word labels on the left edge (kept small: the colours do the teaching)
  if (opt.labels !== false && L >= 56) {
    ctx.font = `700 ${Math.max(11, Math.min(15, L * 0.14))}px system-ui, sans-serif`;
    ctx.textBaseline = 'bottom';
    const lab = (txt, y, col) => {
      ctx.fillStyle = col;
      ctx.fillText(txt, 8, y - lw * 1.5);
    };
    lab(t('sky'), Y(0), COLORS.sky);
    if (opt.threeLine) lab(t('clouds'), Y(1), '#7d8da3');
    lab(t('grass'), Y(2), '#1f8f3a');
    if (opt.showDirt) { ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(t('dirt'), 8, Y(2) + lw * 3); }
  }
}

function line(ctx, x0, y0, x1, y1) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}
