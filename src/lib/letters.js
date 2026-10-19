import data from '../data/letters.json';
import { bbox } from './geometry.js';

export const cues = data.cues;
export const letters = data.letters;
export const byChar = Object.fromEntries(letters.map((l) => [l.char, l]));
for (const l of letters) l.bbox = bbox(l.strokes.map((s) => s.points));

export const GROUPS = { small: 'aceimnorsuvwxz'.split(''), tall: 'bdfhklt'.split(''), dirt: 'gjpqy'.split('') };

/** Vertical extent of the letter "block" (the cover-game outline). */
export function blockRange(letter) {
  if (letter.group === 'tall') return [0, 2];
  if (letter.group === 'dirt') return [1, 3];
  return [1, 2];
}
export const letterIndex = (c) => letters.findIndex((l) => l.char === c);
export const nextLetter = (c, d = 1) => letters[(letterIndex(c) + d + letters.length) % letters.length].char;
