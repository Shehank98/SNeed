// Generates src/data/letters.json from compact stroke definitions.
// Run: npm run letters
//
// Coordinates: 1 unit = distance between two lines.
//   y = 0 sky line, y = 1 clouds line, y = 2 grass line, y > 2 dirt.
//   x = 0 is the left edge of the letter, x grows to the right.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/letters.json');
const r = (n) => Math.round(n * 1000) / 1000;
const rad = (d) => (d * Math.PI) / 180;

// ---- path helpers (all return arrays of [x, y]) ----
const line = (a, b, n = 8) =>
  Array.from({ length: n + 1 }, (_, i) => [r(a[0] + ((b[0] - a[0]) * i) / n), r(a[1] + ((b[1] - a[1]) * i) / n)]);
const poly = (...pts) => pts.reduce((acc, p, i) => (i === 0 ? [p] : acc.concat(line(pts[i - 1], p, 8).slice(1))), []);
const cubic = (p0, p1, p2, p3, n = 14) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [0, 1].map((k) => r(u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]));
  });
// Angles in degrees on screen: 0 = right, 90 = bottom, 180 = left, 270/-90 = top.
// Decreasing angle = counter-clockwise (how c, a, d, o, g, q are written).
const arc = (cx, cy, rx, ry, a0, a1, n = 28) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    return [r(cx + rx * Math.cos(a)), r(cy + ry * Math.sin(a))];
  });
const at = (cx, cy, rx, ry, a) => [r(cx + rx * Math.cos(rad(a))), r(cy + ry * Math.sin(rad(a)))];
const join = (...parts) => parts.reduce((acc, p) => acc.concat(acc.length ? p.slice(1) : p), []);

// Standard round body: width 0.8 (x 0..0.8), clouds line to grass line.
const B = { cx: 0.4, cy: 1.5, rx: 0.4, ry: 0.5 };
const body = (a0, a1) => arc(B.cx, B.cy, B.rx, B.ry, a0, a1);
// "Tap two clouds" markers sit on the left side of a c-curve.
const TAPS = [at(B.cx, B.cy, B.rx, B.ry, -140), at(B.cx, B.cy, B.rx, B.ry, -220)];
const stroke = (pts, extra = {}) => ({ pts, ...extra });
const dot = (x, y) => ({ pts: [[x, y]], dot: true });
const cCurve = (end = -320) => stroke(body(-45, end), { taps: TAPS });
const hump = (x0, x1) =>
  join(cubic([x0, 1.45], [x0 + 0.05, 1.0], [x1, 1.0], [x1, 1.5]), line([x1, 1.5], [x1, 2.0], 4));

// ---- letter definitions ----
// start = [line, offset]; cues are keys into the "cues" table below (first = main start cue).
const L = [
  { c: 'a', g: 'small', start: ['clouds', 0.15], cues: ['startClouds', 'twoClouds'], strokes: [cCurve(-320), stroke(line([0.8, 1.0], [0.8, 2.0]))] },
  { c: 'b', g: 'tall', start: ['sky', 0], cues: ['bossy', 'startSky'], strokes: [stroke(line([0, 0], [0, 2.0], 14)), stroke(arc(0.4, 1.5, 0.4, 0.5, 180, 515))] },
  { c: 'c', g: 'small', start: ['clouds', 0.15], cues: ['startClouds', 'twoClouds'], strokes: [cCurve(-315)] },
  { c: 'd', g: 'tall', start: ['clouds', 0.15], cues: ['dreamer', 'twoClouds', 'startClouds'], strokes: [cCurve(-320), stroke(line([0.8, 0], [0.8, 2.0], 14))] },
  { c: 'e', g: 'small', start: ['clouds', 0.4], cues: ['startUnderClouds'], strokes: [stroke(join(line([0.01, 1.4], [0.78, 1.4], 8), arc(0.4, 1.5, 0.4, 0.5, -11.5, -320)))] },
  {
    c: 'f', g: 'tall', start: ['sky', 0.22], cues: ['startBelowSky', 'tallSky'],
    strokes: [stroke(join(cubic([0.66, 0.22], [0.6, 0.02], [0.36, 0.0], [0.36, 0.4]), line([0.36, 0.4], [0.36, 2.0], 12))), stroke(line([0.0, 1.0], [0.72, 1.0]))],
  },
  {
    c: 'g', g: 'dirt', start: ['clouds', 0.15], cues: ['startClouds', 'twoClouds', 'muddy'],
    strokes: [cCurve(-320), stroke(join(line([0.8, 1.0], [0.8, 2.55], 10), cubic([0.8, 2.55], [0.8, 3.1], [0.3, 3.1], [0.04, 2.8])))],
  },
  { c: 'h', g: 'tall', start: ['sky', 0], cues: ['startSky', 'tallSky'], strokes: [stroke(line([0, 0], [0, 2.0], 14)), stroke(hump(0, 0.78))] },
  { c: 'i', g: 'small', start: ['clouds', 0], cues: ['skydiver', 'startClouds'], strokes: [stroke(line([0.3, 1.0], [0.3, 2.0])), dot(0.3, 0.55)] },
  {
    c: 'j', g: 'dirt', start: ['clouds', 0], cues: ['skydiver', 'muddy'],
    strokes: [stroke(join(line([0.3, 1.0], [0.3, 2.5], 10), cubic([0.3, 2.5], [0.3, 3.1], [0.1, 3.1], [0.0, 2.85]))), dot(0.3, 0.55)],
  },
  { c: 'k', g: 'tall', start: ['sky', 0], cues: ['startSky', 'tallSky'], strokes: [stroke(line([0, 0], [0, 2.0], 14)), stroke(line([0.72, 1.0], [0.05, 1.62])), stroke(line([0.25, 1.4], [0.8, 2.0]))] },
  { c: 'l', g: 'tall', start: ['sky', 0], cues: ['skydiver', 'startSky'], strokes: [stroke(line([0, 0], [0, 2.0], 14))] },
  {
    c: 'm', g: 'small', start: ['clouds', 0], cues: ['startClouds'],
    strokes: [stroke(line([0, 1.0], [0, 2.0])), stroke(hump(0, 0.5)), stroke(hump(0.5, 1.0))],
  },
  { c: 'n', g: 'small', start: ['clouds', 0], cues: ['startClouds'], strokes: [stroke(line([0, 1.0], [0, 2.0])), stroke(hump(0, 0.7))] },
  { c: 'o', g: 'small', start: ['clouds', 0.07], cues: ['startClouds', 'twoClouds'], strokes: [stroke(body(-60, -420, 36), { taps: TAPS })] },
  {
    c: 'p', g: 'dirt', start: ['clouds', 0], cues: ['pBounce', 'muddy'],
    strokes: [stroke(join(line([0, 1.0], [0, 3.0], 16), line([0, 3.0], [0, 1.55], 12), arc(0.4, 1.5, 0.4, 0.5, 180, 515)))],
  },
  { c: 'q', g: 'dirt', start: ['clouds', 0.15], cues: ['startClouds', 'twoClouds', 'muddy'], strokes: [cCurve(-320), stroke(line([0.8, 1.0], [0.8, 3.0], 14))] },
  { c: 'r', g: 'small', start: ['clouds', 0], cues: ['startClouds'], strokes: [stroke(line([0, 1.0], [0, 2.0])), stroke(cubic([0, 1.5], [0.1, 1.1], [0.3, 1.0], [0.52, 1.12]))] },
  {
    c: 's', g: 'small', start: ['clouds', 0.12], cues: ['startClouds'],
    strokes: [stroke(join(cubic([0.6, 1.12], [0.45, 0.92], [0.08, 1.0], [0.12, 1.25]), cubic([0.12, 1.25], [0.16, 1.45], [0.62, 1.5], [0.62, 1.76]), cubic([0.62, 1.76], [0.62, 2.06], [0.15, 2.06], [0.0, 1.84])))],
  },
  {
    c: 't', g: 'tall', start: ['sky', 0], cues: ['skydiver', 'startSky'],
    strokes: [stroke(join(line([0.35, 0], [0.35, 1.75], 12), cubic([0.35, 1.75], [0.35, 2.05], [0.55, 2.05], [0.68, 1.92]))), stroke(line([0.0, 1.0], [0.72, 1.0]))],
  },
  {
    c: 'u', g: 'small', start: ['clouds', 0], cues: ['startClouds'],
    strokes: [stroke(join(line([0, 1.0], [0, 1.55], 6), cubic([0, 1.55], [0, 2.08], [0.7, 2.08], [0.7, 1.55]), line([0.7, 1.55], [0.7, 1.0], 6))), stroke(line([0.7, 1.0], [0.7, 2.0]))],
  },
  { c: 'v', g: 'small', start: ['clouds', 0], cues: ['startClouds'], strokes: [stroke(poly([0, 1.0], [0.35, 2.0], [0.7, 1.0]))] },
  { c: 'w', g: 'small', start: ['clouds', 0], cues: ['startClouds'], strokes: [stroke(poly([0, 1.0], [0.25, 2.0], [0.5, 1.2], [0.75, 2.0], [1.0, 1.0]))] },
  { c: 'x', g: 'small', start: ['clouds', 0], cues: ['startClouds'], strokes: [stroke(line([0, 1.0], [0.7, 2.0])), stroke(line([0.7, 1.0], [0, 2.0]))] },
  { c: 'y', g: 'dirt', start: ['clouds', 0], cues: ['startClouds', 'muddy'], strokes: [stroke(line([0, 1.0], [0.35, 2.0])), stroke(line([0.7, 1.0], [0.0, 3.0], 14))] },
  { c: 'z', g: 'small', start: ['clouds', 0], cues: ['startClouds'], strokes: [stroke(poly([0, 1.0], [0.7, 1.0], [0, 2.0], [0.7, 2.0]))] },
];

// How the letter is spoken (letter names) and a picture word.
const SPEAK = 'ay bee see dee ee eff jee aitch eye jay kay el em en oh pee kyoo ar ess tee yoo vee double-you ex why zee'.split(' ');
const WORDS = [
  ['apple', '🍎'], ['ball', '⚽'], ['cat', '🐱'], ['dog', '🐶'], ['egg', '🥚'], ['fish', '🐟'], ['goat', '🐐'], ['hat', '🎩'], ['ice', '🧊'],
  ['juice', '🧃'], ['kite', '🪁'], ['lion', '🦁'], ['moon', '🌙'], ['nut', '🥜'], ['octopus', '🐙'], ['pig', '🐷'], ['queen', '👑'],
  ['rabbit', '🐰'], ['sun', '☀️'], ['tiger', '🐯'], ['umbrella', '☂️'], ['van', '🚐'], ['whale', '🐳'], ['box', '📦'], ['yacht', '⛵'], ['zebra', '🦓'],
];

// ---- cue cards (short, spoken aloud). text/audio are per UI language. ----
const cues = {
  startSky: { anim: 'sky', text: { en: 'Start at the sky!', si: 'අහසෙන් පටන් ගන්න!' } },
  startClouds: { anim: 'clouds', text: { en: 'Start at the clouds!', si: 'වලාකුළුවලින් පටන් ගන්න!' } },
  startUnderClouds: { anim: 'clouds', text: { en: 'E starts just under the clouds.', si: 'E පටන් ගන්නේ වලාකුළු යටින්.' } },
  startBelowSky: { anim: 'sky', text: { en: 'F starts a tad below the sky line.', si: 'F පටන් ගන්නේ අහස් ඉරට ටිකක් පහළින්.' } },
  bossy: { anim: 'bossy', text: { en: 'B is very bossy! He starts at the top, in the sky.', si: 'B ගොඩක් අණ කරනවා! ඔහු පටන් ගන්නේ උඩම, අහසෙන්.' } },
  dreamer: { anim: 'dreamer', text: { en: 'D is a dreamer. His head is in the clouds!', si: 'D හීන දකින කෙනෙක්. ඔහුගේ හිස වලාකුළුවල!' } },
  skydiver: { anim: 'skydiver', text: { en: 'Skydivers l, t and i jump DOWN from the sky. They do not grow up from the grass like trees!', si: 'l, t, i අකුරු අහසෙන් පහළට පනිනවා. ගස් වගේ තණකොළෙන් උඩට වැවෙන්නේ නැහැ!' } },
  twoClouds: { anim: 'twoClouds', text: { en: 'Tap two clouds! Make the top curve long.', si: 'වලාකුළු දෙකක් ඇල්ලුවා! උඩ වක්‍රය දිගට අඳින්න.' } },
  pBounce: { anim: 'pBounce', text: { en: 'P starts at the clouds, drops into the dirt, bounces back up and around!', si: 'P වලාකුළුවලින් පටන් ගෙන, පස් තුළට වැටී, උඩට පැනලා වටේට යනවා!' } },
  muddy: { anim: 'muddy', text: { en: 'Dirt letters like to get muddy!', si: 'පස් අකුරු මඩ වෙන්න කැමතියි!' } },
  tallSky: { anim: 'sky', text: { en: 'Tall letters reach up to the sky.', si: 'උස අකුරු අහසට ළඟා වෙනවා.' } },
  smallStay: { anim: 'clouds', text: { en: 'Small letters stay between the clouds and the grass.', si: 'කුඩා අකුරු වලාකුළු සහ තණකොළ අතර රැඳෙනවා.' } },
  followArrows: { anim: 'arrow', text: { en: 'Follow the arrows and numbers.', si: 'ඊතල සහ අංක අනුව යන්න.' } },
  followDots: { anim: 'arrow', text: { en: 'Follow the dotted path.', si: 'තිත් පාර අනුව යන්න.' } },
  threeClouds: { anim: 'twoClouds', text: { en: 'Leave three clouds between words.', si: 'වචන අතර වලාකුළු තුනක් තබන්න.' } },
};
for (const [k, v] of Object.entries(cues)) v.audio = 'cue_' + k;

const dirOf = (pts, dotFlag) => {
  if (dotFlag) return 'tap';
  const a = pts[0], b = pts[pts.length - 1];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (Math.hypot(dx, dy) < 0.25) return 'around';
  const straight = pts.every((p) => {
    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)) < 0.1;
  });
  const main = Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 'down' : 'up') : dx > 0 ? 'right' : 'left';
  return straight ? main : 'curve-' + main;
};

const letters = L.map((d, idx) => {
  const startY = (d.start[0] === 'sky' ? 0 : 1) + d.start[1];
  const strokes = d.strokes.map((s, i) => ({
    order: i + 1,
    start: s.pts[0],
    dir: dirOf(s.pts, s.dot),
    dot: !!s.dot,
    ...(s.taps ? { cloudTaps: s.taps } : {}),
    points: s.pts,
  }));
  const xs = strokes.flatMap((s) => s.points.map((p) => p[0]));
  return {
    char: d.c,
    audio: 'letter_' + d.c,
    speak: { en: SPEAK[d.c.charCodeAt(0) - 97] },
    word: { text: WORDS[idx][0], emoji: WORDS[idx][1] },
    group: d.g, // small | tall | dirt
    startLine: { line: d.start[0], offset: d.start[1] }, // sky|clouds plus offset (e, f)
    startY: r(startY),
    startsAt: d.start[0] === 'sky' && d.start[1] === 0 ? 'skyline' : d.start[0] === 'sky' ? 'belowSky' : d.start[1] > 0.2 ? 'underClouds' : 'clouds',
    width: r(Math.max(...xs) - Math.min(...xs)),
    cues: d.cues,
    strokes,
  };
});

const doc = {
  schema: 1,
  script: 'latin-lowercase',
  coordinateSystem: {
    unit: '1 unit = distance between two neighbouring lines (also the unit for x)',
    y: { sky: 0, clouds: 1, grass: 2, dirtMin: 2, dirtMax: 3.2 },
    x: '0 = left edge of the letter; grows to the right',
    zones: { small: 'y 1..2', tall: 'y 0..2', dirt: 'body y 1..2, tail below y 2 into the dirt' },
  },
  cues,
  letters,
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(doc));
console.log(`wrote ${letters.length} letters -> ${path.relative(process.cwd(), out)}`);
