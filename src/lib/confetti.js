// Lightweight confetti: one canvas, ~70 particles, removed when finished.
export function confetti(count = 70) {
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  c.width = W * dpr; c.height = H * dpr;
  document.body.append(c);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#ff5d8f', '#ffb703', '#3ddc97', '#4cc9f0', '#9b5de5', '#ff7b00'];
  const ps = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
    s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= 0.99;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
    if (++frames < 110) requestAnimationFrame(tick); else c.remove();
  })();
}
