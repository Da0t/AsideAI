import { View, Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { usePress } from './usePress';
import Chip from './Chip';
import { colors, fonts, textSize, radii, shadow } from '../theme/tokens';
import { getTheme } from '../theme/personalities';

interface PersonalityCardProps {
  name: string;
  theme?: string;
  voice?: string;
  modeLabel?: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function PersonalityCard({
  name,
  theme = 'custom',
  voice,
  modeLabel,
  active = false,
  onPress,
  style,
}: PersonalityCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePress(0.98);
  const t = getTheme(theme);

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.card,
        {
          backgroundColor: active ? colors.surfaceHot : colors.surfaceCard,
          borderColor: active ? colors.borderGlow : colors.borderHairline,
        },
        active ? shadow('md', colors.brand) : undefined,
        style,
      ]}
    >
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: t.accent }]} />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {active && <Chip variant="brand" live>PLAYING</Chip>}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {voice ? `VOICE · ${voice}` : ''}
          </Text>
        </View>

        <View style={styles.right}>
          {modeLabel && (
            <View style={[styles.modePill, { borderColor: t.accent + '55' }]}>
              <Text style={[styles.modeText, { color: t.accent }]}>{modeLabel}</Text>
            </View>
          )}
          <SlidersHorizontal size={18} color={colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: fonts.display700,
    fontSize: textSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  meta: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modePill: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
