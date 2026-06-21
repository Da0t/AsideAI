import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Switch from './Switch';
import { colors, fonts, textSize, radii, spacing } from '../theme/tokens';

interface ModeCardProps {
  modeLabel: string;
  live: boolean;
  onToggleLive: (live: boolean) => void;
  onPressMode?: () => void;
  accentColor?: string;
}

export default function ModeCard({
  modeLabel,
  live,
  onToggleLive,
  onPressMode,
  accentColor = colors.brand,
}: ModeCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.label}>Narration Mode</Text>
        <Pressable onPress={onPressMode} style={styles.modeChip}>
          <Text style={styles.modeText}>{modeLabel}</Text>
          <ChevronDown size={14} color={colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>Live</Text>
        <Switch checked={live} onChange={onToggleLive} accentColor={accentColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceHot,
    borderRadius: radii.xl,
    padding: spacing[4],
    paddingHorizontal: spacing[5],
  },
  left: {
    gap: 8,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  label: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeText: {
    fontFamily: fonts.sans700,
    fontSize: textSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
