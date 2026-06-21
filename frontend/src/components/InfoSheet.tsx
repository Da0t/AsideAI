import { View, Text, StyleSheet } from 'react-native';
import { Eye, Ear, Brain, MessageSquare } from 'lucide-react-native';
import Sheet from './Sheet';
import { colors, fonts, textSize } from '../theme/tokens';

interface InfoSheetProps {
  visible: boolean;
  onClose: () => void;
  narratorCount: number;
}

const STEPS = [
  { icon: Eye, label: 'Sees', text: 'A chest-mounted camera watches the room in real time.' },
  { icon: Ear, label: 'Hears', text: 'The mic picks up what people around you are saying.' },
  { icon: Brain, label: 'Thinks', text: 'Your chosen narrator interprets the moment in character.' },
  { icon: MessageSquare, label: 'Speaks', text: 'It narrates your life out loud — voice, music, and SFX.' },
];

export default function InfoSheet({ visible, onClose, narratorCount }: InfoSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Text style={styles.title}>How Aside works</Text>
        <Text style={styles.subtitle}>
          Aside narrates your life out loud through a swappable AI personality.
        </Text>

        <View style={styles.steps}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <View key={s.label} style={styles.step}>
                <View style={styles.rail}>
                  <View style={styles.stepIcon}>
                    <Icon size={18} color={colors.brand} />
                  </View>
                  {i < STEPS.length - 1 && <View style={styles.railLine} />}
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepLabel}>{s.label}</Text>
                  <Text style={styles.stepText}>{s.text}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{narratorCount}</Text>
            <Text style={styles.statLabel}>Narrators</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Intensities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>Free</Text>
            <Text style={styles.statLabel}>Forever</Text>
          </View>
        </View>

        <Text style={styles.tip}>
          Tap a narrator to tune its intensity. Press play to go live, then open the
          eye to watch what the AI sees and thinks.
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  title: {
    fontFamily: fonts.display800,
    fontSize: textSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.sans400,
    fontSize: textSize.base,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  steps: {
    marginTop: 6,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
  },
  rail: {
    alignItems: 'center',
    width: 38,
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.brandSoft,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLine: {
    flex: 1,
    width: 2,
    minHeight: 14,
    marginVertical: 4,
    backgroundColor: colors.borderStrong,
  },
  stepBody: {
    flex: 1,
    paddingBottom: 16,
  },
  stepLabel: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.brand,
    minHeight: 38,
    textAlignVertical: 'center',
  },
  stepText: {
    fontFamily: fonts.sans500,
    fontSize: textSize.base,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    paddingVertical: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.display800,
    fontSize: textSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fonts.mono700,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderHairline,
  },
  tip: {
    fontFamily: fonts.sans400,
    fontSize: textSize.sm,
    lineHeight: 19,
    color: colors.textMuted,
  },
});
