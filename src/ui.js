import { h } from './lib/dom.js';
import { icon } from './lib/icons.js';
import { cues } from './lib/letters.js';
import { cueText } from './lib/i18n.js';
import { speak } from './lib/speech.js';
import { unlockAudio, sfx } from './lib/sfx.js';

/** Big touch button: icon on top, one short label. */
export function btn({ ico, label, cls = '', onClick, disabled = false, title }) {
  const b = h('button', { class: `btn ${cls}`, type: 'button', title: title || label || '', 'aria-label': label || title || ico, onclick: (e) => { unlockAudio(); if (!b.disabled) onClick?.(e); } },
    ico ? icon(ico) : null, label ? h('span', { class: 'lbl' }, label) : null);
  b.disabled = disabled;
  return b;
}

export function starsEl(n, max = 3, cls = '') {
  return h('span', { class: `stars ${cls}` }, Array.from({ length: max }, (_, i) => h('span', { class: `star ${i < n ? 'on' : ''}`, style: { '--i': i } }, '★')));
}

export function backBtn(onClick) { return btn({ ico: 'back', label: null, cls: 'round', onClick, title: 'Back' }); }

/** Animated cue card (short text, spoken aloud, tap to hear again). */
const FIG = {
  sky: ['☁️', '⬇️'], clouds: ['☁️', '⬇️'], arrow: ['👉'], bossy: ['👑', '🗣️'], dreamer: ['💭', '☁️'],
  skydiver: ['🪂'], twoClouds: ['☁️', '☁️'], pBounce: ['⚽'], muddy: ['🐷', '💦'],
};
export function cueCard(key, { autoSpeak = false } = {}) {
  const c = cues[key];
  if (!c) return null;
  const fig = h('div', { class: `cue-fig ${c.anim}` }, (FIG[c.anim] || ['⭐']).map((e, i) => h('span', { style: { '--k': i } }, e)));
  const card = h('button', { class: `cue-card ${c.anim}`, type: 'button', onclick: (e) => { unlockAudio(); e.stopPropagation(); speak(cueText(key)); } },
    fig, h('span', { class: 'cue-text' }, cueText(key)), icon('hear', 'small'));
  if (autoSpeak) speak(cueText(key));
  return card;
}

export function toast(msg, ms = 1800) {
  const el = h('div', { class: 'toast' }, msg);
  document.body.append(el);
  setTimeout(() => el.remove(), ms);
}

export { sfx };
