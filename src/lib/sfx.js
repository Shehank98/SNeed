// Tiny WebAudio sound effects (no audio files needed, so it works offline).
let ctx = null;
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { /* audio not available */ }
}
function tone(freq, t0, dur, type = 'sine', vol = 0.18) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + t0);
  o.stop(ctx.currentTime + t0 + dur + 0.05);
}
export const sfx = {
  pop: () => tone(660, 0, 0.12, 'triangle'),
  good: (stars = 3) => [523, 659, 784, 1047].slice(0, stars + 1).forEach((f, i) => tone(f, i * 0.11, 0.25, 'triangle')),
  oops: () => { tone(330, 0, 0.18, 'sine', 0.14); tone(262, 0.16, 0.25, 'sine', 0.14); },
  tick: () => tone(880, 0, 0.06, 'square', 0.05),
};
