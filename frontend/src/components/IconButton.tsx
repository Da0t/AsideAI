import { Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { usePress } from './usePress';
import { colors, radii, glowShadow } from '../theme/tokens';

type IconButtonVariant = 'surface' | 'ghost' | 'accent' | 'brand';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  active?: boolean;
  disabled?: boolean;
  round?: boolean;
  accentColor?: string;
  onPress?: () => void;
  children: ReactNode;
  style?: ViewStyle;
}

const dims: Record<IconButtonSize, number> = { sm: 36, md: 44, lg: 56 };

function getVariantStyle(variant: IconButtonVariant, accentColor?: string) {
  switch (variant) {
    case 'surface':
      return { bg: colors.surfaceCard, fg: colors.textMuted, border: colors.borderHairline };
    case 'ghost':
      return { bg: 'transparent', fg: colors.textMuted, border: 'transparent' };
    case 'accent':
      return { bg: accentColor ?? colors.brand, fg: colors.white, border: 'transparent' };
    case 'brand':
      return { bg: colors.brand, fg: colors.brandInk, border: 'transparent' };
  }
}

export default function IconButton({ size = 'md', variant = 'surface', active = false, disabled = false, round = false, accentColor, onPress, children, style }: IconButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePress(0.92);
  const d = dims[size];
  const v = getVariantStyle(variant, accentColor);

  return (
    <Animated.View style={[animatedStyle, active ? glowShadow(accentColor ?? colors.brand, 20) : undefined, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[
          styles.base,
          {
            width: d,
            height: d,
            borderRadius: round ? 999 : radii.md,
            backgroundColor: v.bg,
            borderColor: v.border,
            borderWidth: v.border !== 'transparent' ? 1 : 0,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
