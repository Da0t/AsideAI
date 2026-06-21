import { View, Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useState, useRef } from 'react';
import { Ellipsis, Play, Check, X, Pencil } from 'lucide-react-native';
import { usePress } from './usePress';
import Chip from './Chip';
import { colors, fonts, textSize, radii, shadow } from '../theme/tokens';
import { getTheme } from '../theme/personalities';

interface PersonalityCardProps {
  name: string;
  theme?: string;
  glyph?: string;
  voice?: string;
  tagline?: string;
  active?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
  style?: ViewStyle;
}

function ActionButton({ icon, color, onPress }: { icon: React.ReactNode; color: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionBtn, { backgroundColor: color + '30' }]}>
      {icon}
    </Pressable>
  );
}

export default function PersonalityCard({ name, theme = 'custom', glyph, voice, tagline, active = false, onSelect, onPreview, style }: PersonalityCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePress(0.98);
  const t = getTheme(theme);
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => setExpanded((e) => !e);

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
      <Pressable onPress={onSelect} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.row}>
        <View style={[styles.glyphWrap, { backgroundColor: t.accent + '25' }]}>
          <Text style={styles.glyph}>{glyph}</Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {active && <Chip variant="brand" live>LIVE</Chip>}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {voice ? `VOICE · ${voice}` : tagline}
          </Text>
        </View>

        <Pressable onPress={toggleExpand} hitSlop={12} style={styles.menuBtn}>
          <Ellipsis size={20} color={colors.textMuted} />
        </Pressable>
      </Pressable>

      {expanded && (
        <View style={styles.actions}>
          <ActionButton icon={<X size={18} color={colors.brand} />} color={colors.brand} />
          <ActionButton icon={<Play size={18} color={t.accent} fill={t.accent} />} color={t.accent} onPress={onPreview} />
          <ActionButton icon={<Check size={18} color={colors.success} />} color={colors.success} onPress={onSelect} />
          <ActionButton icon={<Pencil size={18} color={colors.textSecondary} />} color={colors.textMuted} />
        </View>
      )}
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
    padding: 14,
    gap: 14,
  },
  glyphWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 24,
    lineHeight: 30,
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
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 14,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
