import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkLetter, inkGaps, judgeGap } from '../src/lib/geometry.js';

const data = JSON.parse(fs.readFileSync(new URL('../src/data/letters.json', import.meta.url)));
const L = Object.fromEntries(data.letters.map((l) => [l.char, l]));
const own = (l) => l.strokes.map((s) => s.points.map((p) => [...p]));
// deterministic hand wobble
const wobble = (strokes, amt = 0.07) =>
  strokes.map((s, i) => s.map((p, j) => (s.length === 1 ? p : [p[0] + Math.sin(j * 1.7 + i) * amt, p[1] + Math.cos(j * 2.3 + i) * amt])));
const shift = (strokes, dx, dy = 0) => strokes.map((s) => s.map((p) => [p[0] + dx, p[1] + dy]));

test('groups and start points match the spec', () => {
  const g = (k) => data.letters.filter((l) => l.group === k).map((l) => l.char).join('');
  assert.equal(g('small'), 'aceimnorsuvwxz');
  assert.equal(g('tall'), 'bdfhklt');
  assert.equal(g('dirt'), 'gjpqy');
  assert.equal(data.letters.filter((l) => l.startsAt === 'skyline').map((l) => l.char).join(''), 'bhklt');
  assert.equal(L.e.startsAt, 'underClouds');
  assert.equal(L.f.startsAt, 'belowSky');
});

test('every letter: its own model (with wobble) earns 3 stars', () => {
  for (const l of data.letters) {
    const r = checkLetter(l, wobble(own(l)));
    assert.equal(r.stars, 3, `${l.char}: ${JSON.stringify(r.issues)}`);
  }
});

test('without a guide the x position is normalised', () => {
  for (const l of data.letters) {
    const r = checkLetter(l, shift(wobble(own(l)), 1.7), { normalizeX: true });
    assert.equal(r.stars, 3, `${l.char}: ${JSON.stringify(r.issues)}`);
  }
});

test('b started at the clouds (like d) is caught with the bossy cue', () => {
  const b = L.b;
  const wrong = [own(b)[0].map(([x, y]) => [x, y + 1]), own(b)[1]]; // stem shifted down: starts at clouds
  const r = checkLetter(b, wrong);
  assert.ok(r.stars < 3);
  assert.equal(r.hintCue, 'bossy');
});

test('stem drawn upwards is a direction/start error', () => {
  const l = L.l;
  const r = checkLetter(l, [own(l)[0].reverse()]);
  assert.equal(r.stars, 1);
});

test('tall letter that stays short does not reach the sky', () => {
  const r = checkLetter(L.h, [own(L.h)[0].map(([x, y]) => [x, 1 + y / 2]), own(L.h)[1]]);
  assert.ok(r.issues.some((i) => i.type === 'notSky' || i.type === 'startLine'));
});

test('dirt letter that stays on the grass is not muddy', () => {
  const y = L.y;
  const flat = own(y).map((s) => s.map(([x, yy]) => [x, Math.min(yy, 2)]));
  const r = checkLetter(y, flat);
  assert.ok(r.issues.some((i) => i.type === 'notMuddy'));
  assert.equal(r.issues.find((i) => i.type === 'notMuddy').cue, 'muddy');
});

test('short c curve misses the two clouds', () => {
  const c = L.c;
  const half = [own(c)[0].slice(0, 10)];
  const r = checkLetter(c, half);
  assert.ok(r.issues.some((i) => i.type === 'curveShort'));
});

test('o drawn clockwise is flagged', () => {
  const o = L.o;
  const cw = own(o)[0];
  const rev = [cw[0], ...[...cw].slice(1).reverse()];
  const r = checkLetter(o, [rev]);
  assert.ok(r.stars < 3);
});

test('three clouds gap checker', () => {
  const word = (x0, x1) => [[x0, 1.2], [x1, 1.8]];
  const { gaps } = inkGaps([word(0, 1), word(2.4, 3.4)]);
  assert.equal(gaps.length, 1);
  assert.equal(judgeGap(gaps[0]).status, 'good');
  const tight = inkGaps([word(0, 1), word(1.7, 2.7)]).gaps[0];
  assert.equal(judgeGap(tight).status, 'tight');
});
