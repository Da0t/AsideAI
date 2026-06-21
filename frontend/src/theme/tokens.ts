import { Platform } from 'react-native';

export const colors = {
  bgApp: '#0a0610',
  bgRaised: '#120a14',
  surfaceCard: '#3d1225',
  surfaceCard2: '#5a1a30',
  surfaceHot: '#8b1a2b',
  surfaceInput: '#1a0e18',

  borderHairline: 'rgba(255, 80, 80, 0.12)',
  borderStrong: 'rgba(255, 80, 80, 0.25)',
  borderGlow: 'rgba(255, 77, 61, 0.40)',

  textPrimary: '#f8f0f2',
  textSecondary: 'rgba(255, 220, 220, 0.70)',
  textMuted: 'rgba(255, 180, 180, 0.45)',
  textOnBrand: '#1a0508',

  brand: '#ff4d3d',
  brandBright: '#ff6a5b',
  brandDeep: '#c9261a',
  brandInk: '#1a0508',
  brandGlow: 'rgba(255, 77, 61, 0.50)',
  brandSoft: 'rgba(255, 77, 61, 0.15)',

  live: '#ff4d3d',
  success: '#3fb36b',
  warn: '#f5a524',
  info: '#3f9bff',

  white: '#ffffff',
  transparent: 'transparent',
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
  11: 80,
  12: 96,
  screenPad: 20,
  gutter: 12,
  tapMin: 44,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  xxl: 24,
  pill: 999,
  button: 14,
  input: 14,
  cue: 20,
  card: 24,
} as const;

export const fonts = {
  display800: 'BricolageGrotesque_800ExtraBold',
  display700: 'BricolageGrotesque_700Bold',
  sans400: 'HankenGrotesk_400Regular',
  sans500: 'HankenGrotesk_500Medium',
  sans600: 'HankenGrotesk_600SemiBold',
  sans700: 'HankenGrotesk_700Bold',
  sans800: 'HankenGrotesk_800ExtraBold',
  mono700: 'SpaceMono_700Bold',
} as const;

export const textSize = {
  '2xs': 11,
  xs: 12,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
  '5xl': 64,
} as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 380,
  pressScale: 0.96,
  livePulseDuration: 1400,
  eqDuration: 900,
  glowBreatheDuration: 3200,
} as const;

type ShadowLevel = 'sm' | 'md' | 'lg' | 'xl';

export function shadow(level: ShadowLevel, color = '#000000') {
  if (Platform.OS === 'android') {
    const elevations: Record<ShadowLevel, number> = { sm: 2, md: 6, lg: 12, xl: 20 };
    return { elevation: elevations[level] };
  }
  const configs: Record<ShadowLevel, { offset: { width: number; height: number }; opacity: number; radius: number }> = {
    sm: { offset: { width: 0, height: 1 }, opacity: 0.4, radius: 2 },
    md: { offset: { width: 0, height: 8 }, opacity: 0.50, radius: 24 },
    lg: { offset: { width: 0, height: 16 }, opacity: 0.60, radius: 40 },
    xl: { offset: { width: 0, height: 28 }, opacity: 0.6, radius: 70 },
  };
  const c = configs[level];
  return {
    shadowColor: color,
    shadowOffset: c.offset,
    shadowOpacity: c.opacity,
    shadowRadius: c.radius,
  };
}

export function glowShadow(accentColor: string, radius = 28) {
  if (Platform.OS === 'android') {
    return { elevation: 8 };
  }
  return {
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: radius,
  };
}
