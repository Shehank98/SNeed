import { h } from '../lib/dom.js';
import { store } from '../lib/store.js';
import { t, LANGS } from '../lib/i18n.js';
import { speak } from '../lib/speech.js';
import { icon } from '../lib/icons.js';
import { letterSVG } from '../lib/guide.js';
import { byChar } from '../lib/letters.js';
import { starsEl } from '../ui.js';

export default function home({ go }) {
  const p = store.profile();
  const tile = (cls, ico, label, to, extra) =>
    h('button', { class: `tile ${cls}`, type: 'button', onclick: () => go(to) }, extra || icon(ico, 'xl'), h('span', { class: 'tile-lbl' }, label));
  const lang = h('button', { class: 'btn round pill', type: 'button', title: t('language'), onclick: () => { store.set({ lang: store.get().lang === 'en' ? 'si' : 'en' }); location.reload(); } },
    store.get().lang === 'en' ? LANGS.si : LANGS.en);
  const voice = h('button', { class: `btn round ${store.get().voice ? '' : 'off'}`, type: 'button', title: t('voice'), onclick: (e) => { const v = !store.get().voice; store.set({ voice: v }); e.currentTarget.classList.toggle('off', !v); if (v) speak(t('hello')); } }, icon('hear'));
  const el = h('div', { class: 'screen home' },
    h('div', { class: 'topbar' },
      h('button', { class: 'who', type: 'button', onclick: () => go('profiles') }, h('span', { class: 'avatar' }, p.avatar), h('span', { class: 'who-name' }, p.name), starsEl(Math.min(3, Math.ceil(p.totalStars / 30)), 3, 'small')),
      h('div', { class: 'spacer' }), lang, voice,
      h('button', { class: 'btn round', type: 'button', title: t('teacher'), onclick: () => go('teacher') }, icon('gear'))),
    h('div', { class: 'hero' }, h('div', { class: 'title' }, t('appName')),
      h('div', { class: 'hero-letters' }, ['b', 'd', 'p'].map((c) => letterSVG(byChar[c], { lines: false })))),
    h('div', { class: 'tiles' },
      tile('t-letters', null, t('letters'), 'letters', letterSVG(byChar.a, { lines: false })),
      tile('t-games', 'game', t('games'), 'games'),
      tile('t-words', 'book', t('words'), 'words'),
      tile('t-bd', null, t('bd'), 'bd', h('div', { class: 'bd' }, letterSVG(byChar.b), letterSVG(byChar.d)))));
  return { el, mounted() { speak(`${t('hello')} ${p.name}!`); } };
}
