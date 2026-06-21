import { View, Text, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import SegmentedControl from './SegmentedControl';
import Button from './Button';
import Chip from './Chip';
import { colors, fonts, textSize, spacing } from '../theme/tokens';
import { modes, PersonalityData } from '../data/personalities';
import { getTheme } from '../theme/personalities';

interface SettingsSheetProps {
  personality: PersonalityData | null;
  visible: boolean;
  mode: string;
  active: boolean;
  onChangeMode: (mode: string) => void;
  onSetActive: () => void;
  onClose: () => void;
}

export default function SettingsSheet({
  personality,
  visible,
  mode,
  active,
  onChangeMode,
  onSetActive,
  onClose,
}: SettingsSheetProps) {
  const t = personality ? getTheme(personality.theme) : getTheme('custom');
  const currentMode = modes.find((m) => m.value === mode) ?? modes[0];

  return (
    <Sheet visible={visible} onClose={onClose}>
      {personality && (
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: t.accent }]} />
            <View style={styles.headerText}>
              <Text style={styles.name}>{personality.name}</Text>
              <Text style={styles.voice}>VOICE · {personality.voice}</Text>
            </View>
            {active && <Chip variant="brand" live>PLAYING</Chip>}
          </View>

          {/* Mode selector */}
          <Text style={styles.label}>Narration intensity</Text>
          <SegmentedControl
            options={modes}
            value={mode}
            onChange={onChangeMode}
            accentColor={t.accent}
          />
          <Text style={styles.hint}>{currentMode.hint}</Text>

          {/* Primary action */}
          <View style={styles.actions}>
            {active ? (
              <Button variant="secondary" size="lg" fullWidth onPress={onClose}>
                Done
              </Button>
            ) : (
              <Button
                variant="accent"
                size="lg"
                fullWidth
                accentColor={t.accent}
                onPress={() => {
                  onSetActive();
                  onClose();
                }}
              >
                Set as active narrator
              </Button>
            )}
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontFamily: fonts.display800,
    fontSize: textSize.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  voice: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  label: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: 6,
  },
  hint: {
    fontFamily: fonts.sans400,
    fontSize: textSize.sm,
    color: colors.textMuted,
  },
  actions: {
    marginTop: 8,
  },
});
