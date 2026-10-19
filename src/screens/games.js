import { h } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { btn } from '../ui.js';
import { icon } from '../lib/icons.js';
import { letterSVG } from '../lib/guide.js';
import { byChar } from '../lib/letters.js';

export default function games({ go }) {
  const tile = (cls, content, label, to) => h('button', { class: `tile ${cls}`, type: 'button', onclick: () => go(to) }, content, h('span', { class: 'tile-lbl' }, label));
  const el = h('div', { class: 'screen' },
    h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('home') }), h('div', { class: 'title small' }, t('games'))),
    h('div', { class: 'scroll game-tiles' },
      tile('t-games', h('span', { class: 'block-q' }, '?'), t('cover'), 'cover'),
      tile('t-words', h('span', { class: 'block-q' }, '🎈'), t('hangman'), 'hangman'),
      tile('t-bd', h('div', { class: 'bd', style: { height: '80px' } }, letterSVG(byChar.b), letterSVG(byChar.d)), t('bd'), 'bd')));
  return { el };
}
