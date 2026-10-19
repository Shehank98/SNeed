// Everything lives in localStorage (key sneed.v1). No accounts, no network.
const KEY = 'sneed.v1';

const defaults = () => ({
  v: 1,
  lang: 'en', // 'en' | 'si'
  voice: true,
  pinHash: null,
  currentId: null,
  profiles: [],
});

export const PROFILE_DEFAULTS = {
  lineSize: 'medium', // small | medium | large  (chosen per child, kept consistent)
  showZones: true, // coloured sky/cloud zones + art
  showDirt: true, // brown dirt zone
  highlightGrass: false, // thick glowing grass line
  threeLine: true, // dotted cloud line (off = two-line ruler)
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.v === 1) return { ...defaults(), ...raw };
  } catch (e) { /* ignore */ }
  return defaults();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  listeners.forEach((f) => f(state));
}

export const store = {
  get: () => state,
  subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
  set(patch) { Object.assign(state, patch); save(); },

  profile(id = state.currentId) { return state.profiles.find((p) => p.id === id) || null; },
  addProfile(name, avatar) {
    const p = {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name: name.trim() || 'Me', avatar, created: Date.now(),
      ...PROFILE_DEFAULTS,
      letters: {}, // char -> {plays, best, trace, copy, last, needs:{cue:n}}
      streak: { count: 0, last: null },
      totalStars: 0,
      sizeTest: null,
    };
    state.profiles.push(p);
    state.currentId = p.id;
    save();
    return p;
  },
  removeProfile(id) {
    state.profiles = state.profiles.filter((p) => p.id !== id);
    if (state.currentId === id) state.currentId = state.profiles[0]?.id || null;
    save();
  },
  select(id) { state.currentId = id; save(); },
  update(id, patch) { Object.assign(store.profile(id), patch); save(); },

  /** Record one finished attempt at a letter. */
  record(char, mode, stars, issues = []) {
    const p = store.profile();
    if (!p) return;
    const e = (p.letters[char] ||= { plays: 0, best: 0, trace: 0, copy: 0, last: 0, needs: {} });
    e.plays++;
    e.last = Date.now();
    e.best = Math.max(e.best, stars);
    if (mode === 'trace' || mode === 'copy') e[mode] = Math.max(e[mode], stars);
    for (const i of issues) if (i.cue) e.needs[i.cue] = (e.needs[i.cue] || 0) + 1;
    p.totalStars += stars;
    const today = new Date().toISOString().slice(0, 10);
    if (p.streak.last !== today) {
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      p.streak.count = p.streak.last === y ? p.streak.count + 1 : 1;
      p.streak.last = today;
    }
    save();
  },
  letterStatus(p, char) {
    const e = p?.letters[char];
    if (!e) return 'new';
    if (e.copy >= 2) return 'done';
    if (e.trace >= 2) return 'tracing';
    return 'started';
  },
  resetProgress(id) {
    const p = store.profile(id);
    Object.assign(p, { letters: {}, streak: { count: 0, last: null }, totalStars: 0 });
    save();
  },

  // Teacher PIN. A light gate for kids, not real security (data is local anyway).
  hashPin: (pin) => { let h = 5381; for (const c of 'sneed:' + pin) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return String(h); },
  hasPin: () => !!state.pinHash,
  setPin(pin) { state.pinHash = store.hashPin(pin); save(); },
  checkPin: (pin) => store.hashPin(pin) === state.pinHash,
};

export const SIZE_FACTOR = { small: 0.62, medium: 0.8, large: 1 };
