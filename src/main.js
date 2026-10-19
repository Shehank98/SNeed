import './style.css';
import { store } from './lib/store.js';
import { stopSpeaking } from './lib/speech.js';
import { unlockAudio } from './lib/sfx.js';

const routes = {
  home: () => import('./screens/home.js'),
  letters: () => import('./screens/letters.js'),
  practice: () => import('./screens/practice.js'),
  games: () => import('./screens/games.js'),
  cover: () => import('./screens/cover.js'),
  hangman: () => import('./screens/hangman.js'),
  words: () => import('./screens/words.js'),
  bd: () => import('./screens/bd.js'),
  profiles: () => import('./screens/profiles.js'),
  teacher: () => import('./screens/teacher.js'),
  findsize: () => import('./screens/findsize.js'),
};

const app = document.getElementById('app');
let current = null;
let token = 0;

export function go(path) { location.hash = '#/' + path; }

async function render() {
  const my = ++token;
  const [name = 'home', ...params] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  let route = routes[name] ? name : 'home';
  if (!store.get().profiles.length && route !== 'profiles' && route !== 'teacher') { go('profiles/new'); return; }
  const mod = await routes[route]();
  if (my !== token) return;
  current?.destroy?.();
  stopSpeaking();
  const screen = mod.default({ params, go });
  current = screen;
  app.replaceChildren(screen.el);
  screen.mounted?.();
}

addEventListener('hashchange', render);
document.addEventListener('pointerdown', unlockAudio, { once: true });

// Never let the page scroll, rubber-band or pinch-zoom (iOS gesture events).
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => { if (!e.target.closest?.('.scroll')) e.preventDefault(); }, { passive: false });

render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
