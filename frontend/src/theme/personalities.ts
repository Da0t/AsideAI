export interface PersonalityTheme {
  accent: string;
  accent2: string;
  hot: string;
  surface: string;
  surface2: string;
  ink: string;
  glow: string;
  cardTint: string;
  gradient: readonly [string, string, string];
}

export const themes: Record<string, PersonalityTheme> = {
  hype: {
    accent: '#2e7bff',
    accent2: '#ffc53d',
    hot: '#ff6a1a',
    surface: '#0a1330',
    surface2: '#102047',
    ink: '#eaf1ff',
    glow: 'rgba(46, 123, 255, 0.35)',
    cardTint: 'rgba(46, 123, 255, 0.08)',
    gradient: ['#2e7bff', '#6a3dff', '#ff6a1a'],
  },
  goth: {
    accent: '#a04ddb',
    accent2: '#8a1f43',
    hot: '#c9c6d6',
    surface: '#150a1d',
    surface2: '#211029',
    ink: '#efe6f5',
    glow: 'rgba(160, 77, 219, 0.35)',
    cardTint: 'rgba(160, 77, 219, 0.08)',
    gradient: ['#2a0f33', '#7a1f3d', '#a04ddb'],
  },
  quest: {
    accent: '#2fa866',
    accent2: '#d8b24a',
    hot: '#e8dcc0',
    surface: '#0a190f',
    surface2: '#102619',
    ink: '#efe7d2',
    glow: 'rgba(216, 178, 74, 0.35)',
    cardTint: 'rgba(47, 168, 102, 0.08)',
    gradient: ['#0c2a18', '#1f7a4d', '#d8b24a'],
  },
  custom: {
    accent: '#7b82a0',
    accent2: '#aab0c8',
    hot: '#c8cde0',
    surface: '#12131a',
    surface2: '#1b1d28',
    ink: '#e7e9f0',
    glow: 'rgba(123, 130, 160, 0.35)',
    cardTint: 'rgba(123, 130, 160, 0.08)',
    gradient: ['#1a1c26', '#2c2f3e', '#565c74'],
  },
} as const;

export function getTheme(themeKey: string): PersonalityTheme {
  return themes[themeKey] ?? themes.custom;
}
