export interface CueData {
  id: string;
  label: string;
  hint: string;
  kind: 'music' | 'sfx';
  icon: string;
}

export interface PersonalityData {
  slug: string;
  theme: string;
  name: string;

  voice: string;
  tagline: string;
  sampleLine: string;
  cues: CueData[];
}

export interface VoiceData {
  id: string;
  name: string;
  character: string;
}

export interface ModeData {
  value: string;
  label: string;
  hint: string;
}

export const personalities: PersonalityData[] = [
  {
    slug: 'hype-man',
    theme: 'hype',
    name: 'Hype Man',

    voice: 'Nova',
    tagline: 'Championship energy for every moment',
    sampleLine: "AYO they're BACK and they brought the FUEL, let's GOOO!",
    cues: [
      { id: 'entrance', label: 'Entrance', hint: 'Air-raid intro', kind: 'music', icon: 'Music4' },
      { id: 'laugh', label: 'Laugh', hint: 'Crowd roar', kind: 'sfx', icon: 'Laugh' },
      { id: 'sting', label: 'Air Horn', hint: 'Punctuate', kind: 'sfx', icon: 'Zap' },
    ],
  },
  {
    slug: 'goth-mommy',
    theme: 'goth',
    name: 'Goth Mommy',

    voice: 'Asteria',
    tagline: 'Darkly glamorous, fiercely comforting',
    sampleLine: 'Look at you, my little raven — returning with your potion of warmth.',
    cues: [
      { id: 'entrance', label: 'Entrance', hint: 'Velvet drift', kind: 'music', icon: 'Music4' },
      { id: 'laugh', label: 'Laugh', hint: 'Soft chuckle', kind: 'sfx', icon: 'Laugh' },
      { id: 'sting', label: 'Tender Swell', hint: 'Reassure', kind: 'sfx', icon: 'Sparkles' },
    ],
  },
  {
    slug: 'epic-quest-narrator',
    theme: 'quest',
    name: 'Epic Quest Narrator',

    voice: 'Orion',
    tagline: 'Your day, reframed as a grand saga',
    sampleLine: 'Lo! The hero returns from the Bean Mines, sacred elixir in hand.',
    cues: [
      { id: 'entrance', label: 'Entrance', hint: 'Royal fanfare', kind: 'music', icon: 'Music4' },
      { id: 'laugh', label: 'Laugh', hint: 'Tavern cheer', kind: 'sfx', icon: 'Laugh' },
      { id: 'sting', label: 'Quest Chime', hint: 'Complete', kind: 'sfx', icon: 'Sparkles' },
    ],
  },
];

export const voices: VoiceData[] = [
  { id: 'asteria', name: 'Asteria', character: 'Warm, velvety, slow — a comforting presence' },
  { id: 'orion', name: 'Orion', character: 'Booming, theatrical — an epic narrator' },
  { id: 'nova', name: 'Nova', character: 'High-energy, loud, relentlessly enthusiastic' },
  { id: 'luna', name: 'Luna', character: 'Soft, dreamy, intimate — close to the ear' },
  { id: 'atlas', name: 'Atlas', character: 'Deep, steady, grounded — calm authority' },
];

export const modes: ModeData[] = [
  { value: 'chill', label: 'Chill', hint: 'Speaks rarely. Lets moments breathe.' },
  { value: 'chatty', label: 'Chatty', hint: 'A steady running commentary.' },
  { value: 'punchy', label: 'Punchy', hint: 'Loud, frequent, every beat hit hard.' },
];

export const liveLines: Record<string, string[]> = {
  'hype-man': [
    "AYO they're BACK and they brought the FUEL, let's GOOO!",
    'THAT coffee refill? ELITE. CHAMPIONSHIP behavior right there!',
    'Stapler located. CLUTCH. The crowd goes ABSOLUTELY WILD!',
  ],
  'goth-mommy': [
    'Look at you, my little raven — returning with your potion of warmth.',
    'Sweet shadow, even the small tasks bend to your quiet power.',
    'Rest your wings, my storm cloud. You are doing so beautifully today.',
  ],
  'epic-quest-narrator': [
    'Lo! The hero returns from the Bean Mines, sacred elixir in hand.',
    'Quest updated: the Stapler of Binding has been recovered at last.',
    'The morning campaign begins anew. Fortune favors the caffeinated.',
  ],
};

export interface VisionThought {
  scene: string;
  heard: string;
  reasoning: string;
}

// What the model "sees / hears / thinks" — the perception → reasoning trace shown
// on the Vision screen. Cycles like liveLines; real data can replace it later.
export const visionThoughts: Record<string, VisionThought[]> = {
  'hype-man': [
    {
      scene: 'Someone strides through the doorway holding a coffee cup.',
      heard: '"Alright, let’s get into it."',
      reasoning: 'Entrance detected. This is a BIG moment — amplify the arrival like a champion walking out to a roaring crowd.',
    },
    {
      scene: 'A person sits at a cluttered desk and opens a laptop.',
      heard: '(keys clacking)',
      reasoning: 'Work is starting. Frame the mundane setup as the opening play of a championship game.',
    },
    {
      scene: 'A hand reaches for a stapler among scattered papers.',
      heard: '(quiet shuffling)',
      reasoning: 'Tiny action, huge energy. Treat finding the stapler as a clutch, game-winning grab.',
    },
  ],
  'goth-mommy': [
    {
      scene: 'A figure returns to a dim room, a warm drink in hand.',
      heard: '"...finally."',
      reasoning: 'A small act of self-care. Validate it tenderly, wrapped in dark, soothing affection.',
    },
    {
      scene: 'Someone rests their head briefly against their hand.',
      heard: '(a soft sigh)',
      reasoning: 'Fatigue noticed. Offer quiet comfort — reassure them they are doing beautifully.',
    },
    {
      scene: 'A candle flickers beside a closed notebook.',
      heard: '(silence)',
      reasoning: 'Calm scene. Speak softly of rest and small victories found in the shadows.',
    },
  ],
  'epic-quest-narrator': [
    {
      scene: 'A hero crosses the threshold bearing a steaming chalice.',
      heard: '"Okay, here we go."',
      reasoning: 'The champion returns from the Bean Mines. Elevate the arrival into legend.',
    },
    {
      scene: 'A wanderer surveys a desk strewn with ancient scrolls.',
      heard: '(parchment rustling)',
      reasoning: 'The quest board awaits. Frame the day’s tasks as a grand campaign.',
    },
    {
      scene: 'A hand grasps a small metal artifact among the clutter.',
      heard: '(a faint clink)',
      reasoning: 'The Stapler of Binding is recovered. Announce the deed with due grandeur.',
    },
  ],
  default: [
    {
      scene: 'A person moves through a softly lit room.',
      heard: '(ambient sound)',
      reasoning: 'Reading the scene and shaping a line that fits the chosen character.',
    },
  ],
};
