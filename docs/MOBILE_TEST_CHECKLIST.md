# Mobile test checklist

Test on a **real phone/tablet** over HTTPS (the Railway URL), not only desktop emulation.
Tick each box on **Chrome (Android)** and **Safari (iOS)**. Note device + OS version at the top of your copy.

Device: ____________  OS/browser version: ____________  Date: ________

| # | Check | Chrome Android | Safari iOS |
|---|-------|:---:|:---:|
| **Install / offline** | | | |
| 1 | Opens over `https://`, first-run asks for a child name + avatar | ☐ | ☐ |
| 2 | "Add to Home screen" / "Install app" works; icon is the blue **b** on the lines | ☐ | ☐ |
| 3 | Launched from the icon it opens full screen (no browser bar) | ☐ | ☐ |
| 4 | After one online visit, turn on airplane mode, reopen: app still works, letters can be drawn | ☐ | ☐ |
| **Drawing** | | | |
| 5 | Practice > Copy: one finger draws a smooth, thick, rounded line that follows the finger with no lag | ☐ | ☐ |
| 6 | Strokes stay sharp on a high-DPI screen (no blur/pixelation) | ☐ | ☐ |
| 7 | A quick tap makes a round dot (needed for the dots on **i** and **j**) | ☐ | ☐ |
| 8 | Draw fast diagonal/vertical strokes: the page **does not scroll**, rubber-band, or refresh (pull-to-refresh) | ☐ | ☐ |
| 9 | Draw with two fingers / rest the palm: page does **not zoom**, stroke is not broken | ☐ | ☐ |
| 10 | Double-tap on the canvas does not zoom | ☐ | ☐ |
| 11 | Long-press on the canvas does not open a context menu / text selection / magnifier | ☐ | ☐ |
| 12 | Drawing near the screen edge or over the buttons' edge does not trigger back-swipe gestures unintentionally | ☐ | ☐ |
| 13 | Apple Pencil / stylus (if available) draws like a finger | ☐ | ☐ |
| **Buttons** | | | |
| 14 | **Undo** removes only the last stroke (repeat several times) | ☐ | ☐ |
| 15 | **Clear** wipes everything, start dot goes back to stroke 1 | ☐ | ☐ |
| 16 | **Next** goes to the next letter (a > b > ...), **Back** returns to the letter grid | ☐ | ☐ |
| 17 | **Hear it** speaks the letter name and cue (tap once; iOS needs a tap before sound) | ☐ | ☐ |
| 18 | All buttons are easy to hit with a small finger (about 56 px or bigger) | ☐ | ☐ |
| **Rotation** | | | |
| 19 | Rotate portrait > landscape on the practice screen: lines/letter re-fit, nothing cut off, side buttons appear | ☐ | ☐ |
| 20 | Rotate while a half-finished letter is on screen: the strokes stay in the right place on the lines | ☐ | ☐ |
| 21 | Rotate back to portrait: layout is restored; no blank/white canvas | ☐ | ☐ |
| **Modes** | | | |
| 22 | Watch: pen writes the letter, green start dot pulses, arrows + numbers show, cue is spoken (**b**, **d**, **t**, **p**, **g**) | ☐ | ☐ |
| 23 | **t / l / i**: a skydiver falls down the stroke | ☐ | ☐ |
| 24 | **c a d o g q**: two cloud markers are shown on the curve | ☐ | ☐ |
| 25 | Trace: dotted guide + pulsing start dot for the next stroke | ☐ | ☐ |
| 26 | Wrong start (e.g. **b** from the clouds) gives 1 star + "B is very bossy" hint, then replays the Watch demo | ☐ | ☐ |
| 27 | Correct letter gives 3 stars, sound and confetti | ☐ | ☐ |
| 28 | Cover game, Word blocks, b/d lesson + game, Words (three clouds check) all complete without errors | ☐ | ☐ |
| **Teacher** | | | |
| 29 | Teacher PIN can be created and used; wrong PIN is rejected | ☐ | ☐ |
| 30 | Line size small/medium/large changes the practice lines; setting is remembered per child after closing the app | ☐ | ☐ |
| 31 | Toggles (colour zones, grass highlight, dirt zone, cloud line) change the picture immediately | ☐ | ☐ |
| 32 | "Find best size" runs 3 rounds and saves the chosen size | ☐ | ☐ |
| 33 | Printable summary opens the print dialog / PDF preview | ☐ | ☐ |
| **Language / voice** | | | |
| 34 | English <-> Sinhala toggle switches all labels and cue cards | ☐ | ☐ |
| 35 | Voice off button silences all speech | ☐ | ☐ |
| **Performance** | | | |
| 36 | On a low-end Android: drawing feels smooth, no visible lag, watch animation is not choppy | ☐ | ☐ |

## Known platform quirks
- **iOS Safari** only allows speech and sound after a tap; the first tap on the page unlocks them.
- **iOS** keeps site data (and so child profiles) separate between the Safari tab and the installed Home-screen app.
- Sinhala (si-LK) text-to-speech depends on the device having a Sinhala voice; otherwise the cue text is shown and the device default voice reads it.
- Clearing site data deletes child profiles and the teacher PIN (they live only in `localStorage`).
