import { store } from './store.js';
import { cues } from './letters.js';

// UI labels. Add another language by adding a key here and to LANGS.
// (Sinhala strings are a first draft: please have a native speaker review them.)
export const LANGS = { en: 'English', si: 'සිංහල' };
const S = {
  en: {
    appName: 'Letter Heroes', hello: 'Hi', letters: 'Letters', games: 'Games', words: 'Words', bd: 'b or d?',
    watch: 'Watch', trace: 'Trace', copy: 'Copy', undo: 'Undo', clear: 'Clear', next: 'Next', back: 'Back', hear: 'Hear it',
    again: 'Try again', replay: 'Watch again', done: 'Done', teacher: 'Teacher', settings: 'Settings',
    sky: 'Sky', clouds: 'Clouds', grass: 'Grass', dirt: 'Dirt',
    tallOrSmall: 'Tall or small?', grassOrDirt: 'Sits on the grass or goes in the dirt?',
    tall: 'Tall', small: 'Small', medium: 'Medium', large: 'Large', onGrass: 'Grass', inDirt: 'Dirt',
    cover: 'Cover game', hangman: 'Word blocks', great: 'Great job!', niceTry: 'Nice try!', superStar: 'Super!',
    pickLetter: 'Pick a letter', whoIsWriting: 'Who is writing?', newChild: 'New child', name: 'Name', save: 'Save', pickAvatar: 'Pick a friend',
    enterPin: 'Enter teacher PIN', createPin: 'Create a 4-digit PIN', confirmPin: 'Type it again', wrongPin: 'Not the same PIN. Try again.',
    lineSize: 'Line size', findBest: 'Find best size', lineSizeHelp: 'Pick the size that is easiest to write in.',
    highlightGrass: 'Highlight the grass line', showDirt: 'Brown dirt zone', showZones: 'Colour zones', threeLine: 'Dotted cloud line',
    progress: 'Progress', printSummary: 'Print summary', changePin: 'Change PIN', resetProgress: 'Reset progress', deleteChild: 'Remove child',
    stars: 'Stars', streak: 'Day streak', lettersDone: 'Letters done', needsRepeat: 'Needed a reminder', voice: 'Voice', language: 'Language',
    checkGaps: 'Check gaps', circleGaps: 'Circle the gaps', threeCloudsRule: 'Leave 3 clouds between words', writeHere: 'Write here',
    good3: 'Three clouds. Perfect!', tight: 'Too close. Add more clouds!', wide: 'A bit far. Try three clouds.', circleSpace: 'Circle the space between two words.',
    small_: 'small', tall_: 'tall', dirt_: 'dirt', guess: 'Pick a letter', lives: 'Balloons', youDidIt: 'You did it!', wordWas: 'The word was',
    bossyQ: 'Which letter is bossy?', dreamerQ: 'Which letter is a dreamer?', startsAtSky: 'Starts at the sky', startsAtClouds: 'Starts at the clouds',
    whichLetter: 'Which letter?', lesson: 'Mini lesson', play: 'Play', round: 'Round',
    nameOrSentence: 'Write this at each size', best: 'Most readable', saved: 'Saved!', sizeTestIntro: 'The child writes the same words at three sizes. Then pick the neatest.',
    rotate: 'Turn the device sideways for more room', start: 'Start', mode: 'Mode', openSettings: 'Teacher settings', notDone: 'Not started', done_: 'Done',
    confirmDelete: 'Remove this child and all their progress?', confirmReset: 'Reset all progress for this child?',
  },
  si: {
    appName: 'අකුරු වීරයෝ', hello: 'හායි', letters: 'අකුරු', games: 'ක්‍රීඩා', words: 'වචන', bd: 'b ද d ද?',
    watch: 'බලන්න', trace: 'සලකුණු', copy: 'පිටපත්', undo: 'ආපසු', clear: 'මකන්න', next: 'ඊළඟ', back: 'ආපසු යන්න', hear: 'අහන්න',
    again: 'නැවත', replay: 'නැවත බලන්න', done: 'ඉවරයි', teacher: 'ගුරුතුමා', settings: 'සැකසුම්',
    sky: 'අහස', clouds: 'වලාකුළු', grass: 'තණකොළ', dirt: 'පස්',
    tallOrSmall: 'උසද කුඩාද?', grassOrDirt: 'තණකොළ මතද, පස් තුළටද?',
    tall: 'උස', small: 'කුඩා', medium: 'මධ්‍යම', large: 'විශාල', onGrass: 'තණකොළ', inDirt: 'පස්',
    cover: 'වසා ක්‍රීඩාව', hangman: 'වචන කොටු', great: 'නියමයි!', niceTry: 'හොඳ උත්සාහයක්!', superStar: 'සුපිරි!',
    pickLetter: 'අකුරක් තෝරන්න', whoIsWriting: 'ලියන්නේ කවුද?', newChild: 'අලුත් දරුවා', name: 'නම', save: 'සුරකින්න', pickAvatar: 'යාළුවෙක් තෝරන්න',
    enterPin: 'ගුරු PIN ඇතුළත් කරන්න', createPin: 'ඉලක්කම් 4 PIN එකක් සාදන්න', confirmPin: 'නැවත ටයිප් කරන්න', wrongPin: 'PIN දෙක වෙනස්. නැවත උත්සාහ කරන්න.',
    lineSize: 'ඉරේ ප්‍රමාණය', findBest: 'හොඳම ප්‍රමාණය සොයන්න', lineSizeHelp: 'ලියන්න පහසුම ප්‍රමාණය තෝරන්න.',
    highlightGrass: 'තණකොළ ඉර උද්දීපනය', showDirt: 'දුඹුරු පස් කලාපය', showZones: 'වර්ණ කලාප', threeLine: 'තිත් වලාකුළු ඉර',
    progress: 'ප්‍රගතිය', printSummary: 'සාරාංශය මුද්‍රණය', changePin: 'PIN වෙනස් කරන්න', resetProgress: 'ප්‍රගතිය මකන්න', deleteChild: 'දරුවා ඉවත් කරන්න',
    stars: 'තරු', streak: 'දින පෙළ', lettersDone: 'ඉවර අකුරු', needsRepeat: 'මතක් කිරීම අවශ්‍ය විය', voice: 'හඬ', language: 'භාෂාව',
    checkGaps: 'පරතරය බලන්න', circleGaps: 'පරතරය වට කරන්න', threeCloudsRule: 'වචන අතර වලාකුළු 3ක් තබන්න', writeHere: 'මෙතන ලියන්න',
    good3: 'වලාකුළු තුනයි. නියමයි!', tight: 'ළඟ වැඩියි. වලාකුළු තව දාන්න!', wide: 'ටිකක් දුරයි. වලාකුළු තුනක් තබන්න.', circleSpace: 'වචන දෙකක් අතර හිස්තැන වට කරන්න.',
    small_: 'කුඩා', tall_: 'උස', dirt_: 'පස්', guess: 'අකුරක් තෝරන්න', lives: 'බැලූන්', youDidIt: 'ඔබ කළා!', wordWas: 'වචනය වූයේ',
    bossyQ: 'අණ කරන අකුර කුමක්ද?', dreamerQ: 'හීන දකින අකුර කුමක්ද?', startsAtSky: 'අහසෙන් පටන් ගනී', startsAtClouds: 'වලාකුළුවලින් පටන් ගනී',
    whichLetter: 'කුමන අකුරද?', lesson: 'කුඩා පාඩම', play: 'සෙල්ලම', round: 'වටය',
    nameOrSentence: 'ප්‍රමාණ තුනෙන්ම මෙය ලියන්න', best: 'වඩාත්ම පැහැදිලි', saved: 'සුරැකුණා!', sizeTestIntro: 'දරුවා එම වචන ප්‍රමාණ තුනකින් ලියයි. පසුව පිරිසිදුම එක තෝරන්න.',
    rotate: 'වැඩි ඉඩකට උපාංගය පැත්තට කරන්න', start: 'පටන්', mode: 'ආකාරය', openSettings: 'ගුරු සැකසුම්', notDone: 'පටන් ගෙන නැත', done_: 'ඉවරයි',
    confirmDelete: 'මෙම දරුවා සහ ඔහුගේ සියලු ප්‍රගතිය ඉවත් කරන්නද?', confirmReset: 'මෙම දරුවාගේ සියලු ප්‍රගතිය මකන්නද?',
  },
};

export const lang = () => store.get().lang;
export function t(key) { return S[lang()]?.[key] ?? S.en[key] ?? key; }
export function cueText(key) { const c = cues[key]; return c ? c.text[lang()] || c.text.en : ''; }
export function letterSpeak(letter) {
  return letter.speak[lang()] || letter.speak.en;
}
