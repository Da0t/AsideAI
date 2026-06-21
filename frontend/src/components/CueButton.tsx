import { View, Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import { usePress } from './usePress';
import { colors, fonts, textSize, radii } from '../theme/tokens';

interface CueButtonProps {
  label: string;
  hint?: string;
  icon?: ReactNode;
  kind?: 'music' | 'sfx';
  accentColor?: string;
  surfaceColor?: string;
  surface2Color?: string;
  inkColor?: string;
  onFire?: () => void;
  style?: ViewStyle;
}

export default function CueButton({ label, hint, icon, kind = 'sfx', accentColor = colors.brand, surfaceColor, surface2Color, inkColor = colors.textPrimary, onFire, style }: CueButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePress(0.985);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFire?.();
  };

  const iconBg = accentColor + '38';

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View>
        <Text style={[styles.label, { color: inkColor }]}>{label}</Text>
        {hint && <Text style={[styles.hint, { color: inkColor }]}>{hint}</Text>}
      </View>
    </>
  );

  if (kind === 'music' && surfaceColor && surface2Color) {
    return (
      <Animated.View style={[animatedStyle, styles.outer, style]}>
        <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <LinearGradient colors={[surface2Color, surfaceColor]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.inner}>
            {content}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, styles.outer, { backgroundColor: colors.surfaceCard }, style]}>
      <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.inner}>
        {content}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radii.cue,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderHairline,
    width: '100%',
  },
  inner: {
    minHeight: 104,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.display700,
    fontSize: textSize.md,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  hint: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.55,
    marginTop: 2,
  },
});
