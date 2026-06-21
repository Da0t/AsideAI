import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import SegmentedControl from './SegmentedControl';
import { colors, fonts, textSize } from '../theme/tokens';
import { ModeData } from '../data/personalities';

interface ModeSwitcherProps {
  value: string;
  onChange: (value: string) => void;
  modes: ModeData[];
  accentColor?: string;
  style?: ViewStyle;
}

export default function ModeSwitcher({
  value,
  onChange,
  modes,
  accentColor,
  style,
}: ModeSwitcherProps) {
  const current = modes.find((m) => m.value === value) ?? modes[0];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>Narration intensity</Text>
        {current?.hint && <Text style={styles.hint}>{current.hint}</Text>}
      </View>
      <SegmentedControl
        options={modes}
        value={value}
        onChange={onChange}
        accentColor={accentColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  hint: {
    fontFamily: fonts.sans400,
    fontSize: textSize.xs,
    color: colors.textMuted,
    flexShrink: 1,
  },
});
