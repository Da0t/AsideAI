import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { PersonalityTheme, getTheme } from './personalities';
import { personalities, PersonalityData } from '../data/personalities';
import * as backend from '../api/backend';
import { AudioManager } from '../audio/AudioManager';

interface ThemeContextValue {
  activeSlug: string;
  setActiveSlug: (slug: string) => void;
  activePersonality: PersonalityData;
  activeTheme: PersonalityTheme;
  mode: string;
  setMode: (mode: string) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  allPersonalities: PersonalityData[];
  addPersonality: (p: PersonalityData) => void;
  /** True while the WebSocket to the backend is open. */
  connected: boolean;
  /** Latest narration line pushed by the backend (null until one arrives). */
  liveLine: string | null;
  /** Fire a manual cue (tells the backend + plays the local SFX). */
  fireCue: (cueId: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Builder voice display-name -> Deepgram Aura voice id (best-effort mapping).
const VOICE_TO_DEEPGRAM: Record<string, string> = {
  asteria: 'aura-asteria-en',
  orion: 'aura-orion-en',
  luna: 'aura-luna-en',
  nova: 'aura-hera-en',
  atlas: 'aura-zeus-en',
};

// Build a backend personality bundle from the UI's PersonalityData.
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [allPersonalities, setAllPersonalities] = useState<PersonalityData[]>(personalities);
  const [activeSlug, setActiveSlugLocal] = useState('goth-mommy');
  const [mode, setModeLocal] = useState('chatty');
  const [playing, setPlayingLocal] = useState(true);
  const [connected, setConnected] = useState(false);
  const [liveLine, setLiveLine] = useState<string | null>(null);

  // Mirror `playing` into a ref so togglePlaying reads the latest without deps.
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // One backend connection + audio engine, set up on mount.
  useEffect(() => {
    const audio = AudioManager.getInstance();
    void audio.init();
    backend.connect({
      onStatus: setConnected,
      onState: (s) => {
        // Sync from the backend WITHOUT echoing back (avoids feedback loops).
        if (s.personality) setActiveSlugLocal(s.personality);
        if (s.mode) setModeLocal(s.mode);
        if (typeof s.running === 'boolean') setPlayingLocal(s.running);
      },
      onLine: (l) => setLiveLine(l.text),
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

  // User-facing setters update local state AND tell the backend.
  const setActiveSlug = useCallback((slug: string) => {
    setActiveSlugLocal(slug);
    backend.setActivePersonality(slug);
  }, []);

  const setMode = useCallback((m: string) => {
    setModeLocal(m);
    backend.setMode(m);
  }, []);

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
        playing,
        setPlaying,
        togglePlaying,
        allPersonalities,
        addPersonality,
        connected,
        liveLine,
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
