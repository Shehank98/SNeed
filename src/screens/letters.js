import { h } from '../lib/dom.js';
import { store } from '../lib/store.js';
import { letters } from '../lib/letters.js';
import { letterSVG } from '../lib/guide.js';
import { t } from '../lib/i18n.js';
import { btn } from '../ui.js';

export default function lettersScreen({ go }) {
  const p = store.profile();
  const cells = letters.map((l) => {
    const st = store.letterStatus(p, l.char);
    return h('button', { class: `cell ${l.group} ${st}`, type: 'button', onclick: () => go(`practice/${l.char}/${st === 'new' ? 'watch' : st === 'done' ? 'copy' : 'trace'}`) },
      letterSVG(l, { lines: true }),
      h('span', { class: 'badge' }, st === 'done' ? '★' : st === 'tracing' ? '½' : ''));
  });
  const el = h('div', { class: 'screen picker' },
    h('div', { class: 'topbar' }, btn({ ico: 'back', cls: 'round', title: t('back'), onClick: () => go('home') }), h('div', { class: 'title small' }, t('pickLetter'))),
    h('div', { class: 'scroll grid' }, cells));
  return { el };
}
