import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { PersonalityTheme, getTheme } from './personalities';
import { personalities, liveLines, PersonalityData } from '../data/personalities';
import * as backend from '../api/backend';
import { AudioManager } from '../audio/AudioManager';

export interface LineEntry {
  id: string;
  text: string;
  slug: string;
  at: number;
}

interface ThemeContextValue {
  activeSlug: string;
  setActiveSlug: (slug: string) => void;
  activePersonality: PersonalityData;
  activeTheme: PersonalityTheme;
  /** Active personality's narration mode. */
  mode: string;
  /** Set the active personality's mode. */
  setMode: (mode: string) => void;
  /** Read any personality's mode. */
  modeFor: (slug: string) => string;
  /** Set a specific personality's mode. */
  setModeFor: (slug: string, mode: string) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  allPersonalities: PersonalityData[];
  addPersonality: (p: PersonalityData) => void;
  /** True while the WebSocket to the backend is open. */
  connected: boolean;
  /** Latest narration line pushed by the backend (null until one arrives). */
  liveLine: string | null;
  /** Rolling log of narration lines (the conversation tracker). */
  lineHistory: LineEntry[];
  /** Latest camera frame from the wearable, as a data URI (null until one arrives). */
  cameraFrame: string | null;
  /** Fire a manual cue (tells the backend + plays the local SFX). */
  fireCue: (cueId: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_MODE = 'chatty';

// Builder voice display-name -> Deepgram Aura voice id (best-effort mapping).
const VOICE_TO_DEEPGRAM: Record<string, string> = {
  asteria: 'aura-asteria-en',
  orion: 'aura-orion-en',
  luna: 'aura-luna-en',
  nova: 'aura-hera-en',
  atlas: 'aura-zeus-en',
};

function toBackendBundle(p: PersonalityData): Record<string, unknown> {
  return {
    name: p.name,
    slug: p.slug,
    claude_system_prompt:
      `You are "${p.name}", narrating whatever a chest-mounted bodycam sees and its ` +
      `mic overhears, as an outside observer. Character: ${p.sampleLine} ` +
      `Narrate the moment in third person — never address anyone or say "you". ` +
      `ONE short line. No preamble.`,
    deepgram_voice: VOICE_TO_DEEPGRAM[p.voice.toLowerCase()] ?? 'aura-asteria-en',
    sound_cues: {},
  };
}

// A few recent entries so the conversation tracker looks alive before any
// backend lines arrive. Frontend-only demo seed.
function seedHistory(): LineEntry[] {
  const now = Date.now();
  const picks: { slug: string; text: string; agoMin: number }[] = [
    { slug: 'goth-mommy', text: liveLines['goth-mommy'][0], agoMin: 2 },
    { slug: 'hype-man', text: liveLines['hype-man'][1], agoMin: 7 },
    { slug: 'epic-quest-narrator', text: liveLines['epic-quest-narrator'][0], agoMin: 16 },
    { slug: 'goth-mommy', text: liveLines['goth-mommy'][2], agoMin: 31 },
  ];
  return picks.map((p, i) => ({ id: `seed-${i}`, text: p.text, slug: p.slug, at: now - p.agoMin * 60000 }));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [allPersonalities, setAllPersonalities] = useState<PersonalityData[]>(personalities);
  const [activeSlug, setActiveSlugLocal] = useState('goth-mommy');
  const [modeBySlug, setModeBySlug] = useState<Record<string, string>>(() =>
    Object.fromEntries(personalities.map((p) => [p.slug, DEFAULT_MODE])),
  );
  const [playing, setPlayingLocal] = useState(true);
  const [connected, setConnected] = useState(false);
  const [liveLine, setLiveLine] = useState<string | null>(null);
  const [lineHistory, setLineHistory] = useState<LineEntry[]>(seedHistory);
  const [cameraFrame, setCameraFrame] = useState<string | null>(null);

  // Refs so socket handlers/setters read the latest without re-subscribing.
  const playingRef = useRef(playing);
  const activeSlugRef = useRef(activeSlug);
  const modeRef = useRef(modeBySlug);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { activeSlugRef.current = activeSlug; }, [activeSlug]);
  useEffect(() => { modeRef.current = modeBySlug; }, [modeBySlug]);

  // One backend connection + audio engine, set up on mount.
  useEffect(() => {
    const audio = AudioManager.getInstance();
    void audio.init();
    backend.connect({
      onStatus: setConnected,
      onState: (s) => {
        if (s.personality) setActiveSlugLocal(s.personality);
        if (s.mode) {
          const slug = s.personality ?? activeSlugRef.current;
          setModeBySlug((prev) => ({ ...prev, [slug]: s.mode as string }));
        }
        if (typeof s.running === 'boolean') setPlayingLocal(s.running);
      },
      onLine: (l) => {
        setLiveLine(l.text);
        const slug = l.personality ?? activeSlugRef.current;
        setLineHistory((prev) =>
          [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text: l.text, slug, at: Date.now() }, ...prev].slice(0, 50),
        );
      },
      onFrame: (uri) => setCameraFrame(uri),
      onCue: (name) => {
        void audio.fireCue(name);
      },
      onVoice: (b64, mime) => {
        void audio.playVoice(b64, mime);
      },
    });
    return () => backend.disconnect();
  }, []);

  const activePersonality =
    allPersonalities.find((p) => p.slug === activeSlug) ?? allPersonalities[0];
  const activeTheme = getTheme(activePersonality.theme);
  const mode = modeBySlug[activeSlug] ?? DEFAULT_MODE;

  const modeFor = useCallback((slug: string) => modeRef.current[slug] ?? DEFAULT_MODE, []);

  const setModeFor = useCallback((slug: string, m: string) => {
    setModeBySlug((prev) => ({ ...prev, [slug]: m }));
    if (slug === activeSlugRef.current) backend.setMode(m);
  }, []);

  const setActiveSlug = useCallback((slug: string) => {
    setActiveSlugLocal(slug);
    backend.setActivePersonality(slug);
    backend.setMode(modeRef.current[slug] ?? DEFAULT_MODE);
  }, []);

  const setMode = useCallback((m: string) => {
    setModeFor(activeSlugRef.current, m);
  }, [setModeFor]);

  const setPlaying = useCallback((p: boolean) => {
    setPlayingLocal(p);
    backend.setRunning(p);
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying(!playingRef.current);
  }, [setPlaying]);

  const fireCue = useCallback((cueId: string) => {
    backend.manualCue(cueId);
    void AudioManager.getInstance().fireCue(cueId);
  }, []);

  const addPersonality = useCallback((p: PersonalityData) => {
    setAllPersonalities((list) => [...list, p]);
    setModeBySlug((prev) => ({ ...prev, [p.slug]: DEFAULT_MODE }));
    setActiveSlugLocal(p.slug);
    backend.createCustomPersonality(toBackendBundle(p));
    backend.setActivePersonality(p.slug);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        activeSlug,
        setActiveSlug,
        activePersonality,
        activeTheme,
        mode,
        setMode,
        modeFor,
        setModeFor,
        playing,
        setPlaying,
        togglePlaying,
        allPersonalities,
        addPersonality,
        connected,
        liveLine,
        lineHistory,
        cameraFrame,
        fireCue,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
