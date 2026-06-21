import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PersonalityTheme, getTheme } from './personalities';
import { personalities, PersonalityData } from '../data/personalities';

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
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [allPersonalities, setAllPersonalities] = useState<PersonalityData[]>(personalities);
  const [activeSlug, setActiveSlug] = useState('goth-mommy');
  const [mode, setMode] = useState('chatty');
  const [playing, setPlaying] = useState(true);

  const activePersonality = allPersonalities.find((p) => p.slug === activeSlug) ?? allPersonalities[0];
  const activeTheme = getTheme(activePersonality.theme);

  const togglePlaying = useCallback(() => setPlaying((p) => !p), []);

  const addPersonality = useCallback((p: PersonalityData) => {
    setAllPersonalities((list) => [...list, p]);
    setActiveSlug(p.slug);
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
