# Letter Heroes (SNeed)

A mobile-first handwriting practice web app (PWA) for young children learning **lowercase English letters**, based on the *Handwriting Heroes* three-line method. The child draws with a finger. The app teaches **where each letter starts** and **how big it is** using four zones:

| Zone | Where | Picture |
|------|-------|---------|
| **Sky** | top line | solid blue line, sky background, small clouds above |
| **Clouds** | middle line | dotted line, cloud icons at both ends |
| **Grass** | baseline | solid green line with grass tufts |
| **Dirt** | below the grass | brown filled zone (with a worm) |

Vite + vanilla JS, no UI framework, one runtime dependency pair (`express`, `compression`) for the tiny server. Works offline after the first visit.

## Features

* **26 playable letters** (`src/data/letters.json`), each with ordered strokes, start dot, direction, size group, cues.
* **Modes**
  1. **Watch** – animated pen writes the letter, start dot pulses, arrows and numbers show stroke order, the cue card plays (and is spoken). Skydiver animation for **l t i**, mud splash bounce for **p**, two cloud markers for **c a d o g q**.
  2. **Trace** – dotted guide on the lines and a pulsing start dot for the next stroke.
  3. **Copy** – no guide, only the lines and a small model in the corner.
  4. **Cover game** – a letter block sits on the lines: *Tall or small?* and *Sits on the grass or goes in the dirt?* then the letter is revealed.
  5. **Word blocks (hangman)** – blocks show each letter's height and dirt tail. Guess a letter, answer the two questions, then write it in its block. Wrong guesses pop a balloon (friendly, no gallows).
  6. **Words & sentences** – write on the lines and keep **three clouds** between words. Press *Check gaps*, or switch on *Circle the gaps* and circle a space to self-check. Cloud icons show how many fit.
  7. **b or d?** mini lesson (*B is very bossy* / *D is a dreamer*, side by side) and a mini game.
* **Feedback (pure geometry, no ML)** – start line + start dot, stroke order, direction, zone reached (tall letters reach the sky, dirt letters reach the dirt, small letters stay small), "tap two clouds" curve length, loose shape match. 1–3 stars, sounds, confetti, kind hints using the memory cues. A wrong letter replays the Watch demo.
* **Teacher view (PIN)** – line size small/medium/large, *Find best size* test, colour zones, grass highlight, brown dirt zone, dotted cloud line (two-line to three-line ruler), per-child progress and a printable summary.
* **Child profiles** (name + avatar), stars, day streak, which cues needed repeating – all in `localStorage`.
* **English / Sinhala** UI toggle, Web Speech API voice prompts, offline service worker, installable manifest + icons.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173  (open it on your phone via the LAN address Vite prints)
npm run build        # builds to dist/ and injects the precache list into dist/sw.js
npm start            # serves dist/ with Express on $PORT (default 3000)
npm test             # geometry/feedback unit tests
```

> Camera-free, but **Web Speech, the service worker and "install" need HTTPS** (or `localhost`). To test on a phone use the Railway URL below, or an HTTPS tunnel.

## Project layout

```
index.html               app shell (viewport locks zoom)
public/                  manifest.webmanifest, sw.js (offline), icon.svg, icons/*.png
server.js                Express static server + SPA fallback + /healthz
vite.config.js           build + injects precache file list into dist/sw.js
tools/build-letters.mjs  authoring script that generates src/data/letters.json
tools/make-icons.mjs     dependency-free PNG icon generator
src/data/letters.json    all letter data (separate from code)
src/lib/                 stage (canvas), scene (zones), geometry (feedback), anim, guide, blocks, store, i18n, speech, sfx
src/screens/             home, letters, practice (watch/trace/copy), cover, hangman, words, bd, teacher, findsize, profiles
test/geometry.test.js    unit tests for the checker
docs/MOBILE_TEST_CHECKLIST.md
```

## Coordinate system (letters.json)

All stroke points use **line units**: `1` = the distance between two neighbouring lines. The same unit is used for `x` and `y`, so shapes keep their proportions.

```
y = 0      Sky line     (blue, top)
y = 1      Clouds line  (dotted, middle)
y = 2      Grass line   (green, baseline)
y > 2      Dirt         (brown; letters tails go to about y = 3)

x = 0      left edge of the letter, grows to the right
```

* **small** letters live between y = 1 and 2, **tall** letters between y = 0 and 2, **dirt** letters have a body between 1 and 2 and a tail below 2.
* The app places the letter on screen with `px = ox + x * L`, `py = oy + y * L` where `L` (pixels per unit) comes from the chosen line size and the screen.

### Letter record

```jsonc
{
  "char": "b",
  "audio": "letter_b",                 // audio key (spoken text comes from speak.* / i18n; swap in recordings later)
  "speak": { "en": "bee" },
  "word": { "text": "ball", "emoji": "⚽" },
  "group": "tall",                     // small | tall | dirt
  "startLine": { "line": "sky", "offset": 0 },   // sky | clouds, plus offset (e = clouds+0.4, f = sky+0.22)
  "startY": 0,
  "startsAt": "skyline",               // skyline | clouds | underClouds | belowSky
  "width": 0.8,
  "cues": ["bossy", "startSky"],       // keys into "cues"; the first is the main start cue
  "strokes": [
    { "order": 1, "start": [0, 0], "dir": "down", "dot": false, "points": [[0,0], ...] },
    { "order": 2, "start": [0, 1.5], "dir": "curve-down", "points": [ ... ] }
  ]
  // optional per stroke: "cloudTaps": [[x,y],[x,y]]  (the "tap two clouds" markers)
  // dots (i, j) are strokes with "dot": true and one point
}
```

`cues` at the top of the file holds each cue's `text` per language (`en`, `si`), `audio` key and `anim` (the card animation).

**Editing letters:** change the compact definitions in `tools/build-letters.mjs` and run `npm run letters`. Start offsets, groups and cues are all defined there.

**Adding Sinhala (or other) letters later:** `letters.json` carries `script` and per-language `speak`/`text` objects, so a second file (e.g. `letters-si.json` with the same schema and `"script": "sinhala"`) can be loaded by `src/lib/letters.js` without touching the screens. The line system and checker are script-agnostic; only the zone-group rules (`small/tall/dirt`) in `geometry.js` are Latin-specific.

## How feedback works

`src/lib/geometry.js` (`checkLetter`) compares the child's strokes with the model, in line units:

* **Start** – first point within 0.45 of the start line and 0.6 of the start dot (b starts at the sky, d at the clouds; e under the clouds; f a tad below the sky).
* **Order and direction** – each stroke is matched against all model strokes (chamfer distance); a better match to another stroke means wrong order. Forward vs reversed path distance detects wrong direction.
* **Zones** – tall letters reach y <= 0.45; dirt letters reach y >= 2.6; small letters stay between y 0.55 and 2.45.
* **Tap two clouds** – the curve must pass both cloud markers (0.35 radius) in order.
* **Shape** – loose symmetric distance to the model, only a minor deduction.
* **Stars** – a critical issue (start, order, direction, wrong stroke count) = 1 star, a zone/curve problem = 2 stars, clean = 3. Always kind: at least 1 star, a hint from the cue list, and the Watch demo replays on 1 star.
* Without a guide (Copy mode, games) the child's x-position is normalised to the model, so they can write anywhere on the lines.

Thresholds live in `TOL` at the top of `geometry.js`. `CLOUD_W` (0.4 units) defines the width of one cloud for the **three clouds** rule.

## Settings and data

Stored in `localStorage` key `sneed.v1`: language, voice, PIN hash, child profiles (name, avatar, line size, toggles, per-letter stars for trace/copy, cues that needed repeating, streak, total stars). Nothing leaves the device. The PIN is a light gate to keep kids out of the settings, not real security. If it is forgotten, clear the site data (this also removes the profiles).

## Deploy on Railway

1. **Push to GitHub** (this repo: `Shehank98/SNeed`).
2. In Railway: **New Project > Deploy from GitHub repo** and pick the repo. Railway (Nixpacks) detects Node, runs `npm install`, then the build command from `railway.json` (`npm run build` -> `dist/`), and starts `npm start` (`node server.js`) on `process.env.PORT`.
3. Open the service > **Settings > Networking > Generate Domain**. You get `https://<name>.up.railway.app`.
4. Open that URL on your phone. The health check is `/healthz`.

Notes: `vite` is listed under `dependencies` so it is installed during the Railway build. No environment variables are needed.

### Confirm the service worker and manifest over HTTPS

1. Open the Railway URL in Chrome, DevTools > **Application**:
   * **Manifest** shows name, icons (192, 512, maskable) and no installability warnings.
   * **Service Workers** shows `sw.js` as *activated and running*; **Cache Storage** has `letter-heroes-<hash>` with the app files.
2. Tick **Offline** (Network tab) or use airplane mode and reload: the app must still load and letters must be drawable.
3. `curl -I https://<your-domain>/sw.js` should show `Cache-Control: no-cache`; `manifest.webmanifest` is served as `application/manifest+json`.
4. On Android Chrome use the menu > **Install app**; on iOS Safari use Share > **Add to Home Screen**.
5. After a redeploy, the new service worker installs in the background and takes over on the next launch (each build gets a new cache name).

Then run through [`docs/MOBILE_TEST_CHECKLIST.md`](docs/MOBILE_TEST_CHECKLIST.md) on a real device.

## Notes and limits

* Sinhala UI strings are a first draft; please have a native speaker review them. Sinhala text-to-speech only works if the device has a Sinhala voice.
* Speech/sound start after the first tap (a browser rule, especially on iOS).
* Free-writing words in portrait on a small phone gives small letters; the Words screen suggests turning the device sideways.
* No ML and no handwriting recognition: the checker only tells whether the child followed the method (start, direction, order, size), not whether the letter "looks like" a letter.
