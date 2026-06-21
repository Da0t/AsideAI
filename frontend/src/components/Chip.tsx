import { View, Text, Animated, StyleSheet, ViewStyle, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, fonts, textSize, radii } from '../theme/tokens';

type ChipVariant = 'outline' | 'solid' | 'brand' | 'accent';

interface ChipProps {
  variant?: ChipVariant;
  live?: boolean;
  accentColor?: string;
  children: string;
  style?: ViewStyle;
}

function LiveDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color, opacity }} />
  );
}

const variantStyles: Record<ChipVariant, { bg: string; fg: string; border: string }> = {
  outline: { bg: 'transparent', fg: colors.textSecondary, border: colors.borderStrong },
  solid: { bg: colors.surfaceCard2, fg: colors.textPrimary, border: colors.borderHairline },
  brand: { bg: colors.brand, fg: colors.brandInk, border: 'transparent' },
  accent: { bg: 'transparent', fg: colors.textSecondary, border: colors.borderStrong },
};

export default function Chip({ variant = 'outline', live = false, accentColor, children, style }: ChipProps) {
  const v = variant === 'accent' && accentColor
    ? { bg: accentColor + '2E', fg: accentColor, border: accentColor + '66' }
    : variantStyles[variant];

  return (
    <View style={[styles.container, { backgroundColor: v.bg, borderColor: v.border }, style]}>
      {live && <LiveDot color={v.fg} />}
      <Text style={[styles.text, { color: v.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  text: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
});
