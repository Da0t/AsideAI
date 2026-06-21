import { Pressable, Text, View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { usePress } from './usePress';
import { colors, fonts, textSize, radii, shadow } from '../theme/tokens';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  accentColor?: string;
  onPress?: () => void;
  children: string;
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { h: 36, px: 14, fs: textSize.sm, gap: 6, iconSize: 16 },
  md: { h: 48, px: 20, fs: textSize.base, gap: 8, iconSize: 18 },
  lg: { h: 58, px: 26, fs: textSize.md, gap: 10, iconSize: 20 },
} as const;

function getVariantStyle(variant: ButtonVariant, accentColor?: string) {
  switch (variant) {
    case 'primary':
      return { bg: colors.brand, fg: colors.brandInk, borderColor: 'transparent', ...shadow('md', colors.brand) };
    case 'accent':
      return { bg: accentColor ?? colors.brand, fg: colors.white, borderColor: 'transparent', ...shadow('md', accentColor ?? colors.brand) };
    case 'secondary':
      return { bg: colors.surfaceCard, fg: colors.textPrimary, borderColor: colors.borderStrong };
    case 'ghost':
      return { bg: 'transparent', fg: colors.textSecondary, borderColor: 'transparent' };
  }
}

export default function Button({ variant = 'primary', size = 'md', fullWidth = false, disabled = false, icon, accentColor, onPress, children, style }: ButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePress();
  const s = sizeConfig[size];
  const v = getVariantStyle(variant, accentColor);

  return (
    <Animated.View style={[animatedStyle, fullWidth ? { width: '100%' } : undefined, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[
          styles.base,
          {
            height: s.h,
            paddingHorizontal: s.px,
            gap: s.gap,
            backgroundColor: v.bg,
            borderColor: v.borderColor,
            borderWidth: v.borderColor !== 'transparent' ? 1 : 0,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        {icon && <View style={{ width: s.iconSize, height: s.iconSize }}>{icon}</View>}
        <Text style={[styles.label, { fontSize: s.fs, color: v.fg }]}>{children}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
  },
  label: {
    fontFamily: fonts.sans700,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
});
