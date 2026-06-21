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
  glyph: string;
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
    glyph: '⚡',
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
    glyph: '🦧',
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
    glyph: '⚔️',
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
