import { View, Text, Image, ScrollView, Animated, StyleSheet, Easing } from 'react-native';
import { useEffect, useRef, useState, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, Eye, Ear, Brain, MessageSquare } from 'lucide-react-native';
import Chip from '../components/Chip';
import IconButton from '../components/IconButton';
import Waveform from '../components/Waveform';
import { useTheme } from '../theme/ThemeContext';
import { getTheme } from '../theme/personalities';
import { liveLines, visionThoughts } from '../data/personalities';
import { colors, fonts, textSize, radii, spacing } from '../theme/tokens';

const VIEWPORT_H = 220;

function ThoughtStep({
  icon,
  label,
  accent,
  text,
  accessory,
  last,
  fade,
}: {
  icon: ReactNode;
  label: string;
  accent: string;
  text: string;
  accessory?: ReactNode;
  last?: boolean;
  fade: Animated.Value;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.rail}>
        <View style={[styles.stepIcon, { backgroundColor: accent + '24', borderColor: accent + '55' }]}>
          {icon}
        </View>
        {!last && <View style={styles.railLine} />}
      </View>
      <View style={styles.stepBody}>
        <View style={styles.stepLabelRow}>
          <Text style={[styles.stepLabel, { color: accent }]}>{label}</Text>
          {accessory}
        </View>
        <Animated.Text style={[styles.stepText, { opacity: fade }]}>{text}</Animated.Text>
      </View>
    </View>
  );
}

export default function VisionScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { activePersonality, activeTheme, playing, liveLine, cameraFrame, mode } = useTheme();

  const t = getTheme(activePersonality.theme);
  const thoughts = visionThoughts[activePersonality.slug] ?? visionThoughts.default;
  const lines = liveLines[activePersonality.slug] ?? [activePersonality.sampleLine];

  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const scan = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = thoughts[idx % thoughts.length];
  const speakLine = liveLine ?? lines[idx % lines.length];

  // Cycle the perception trace while playing (frozen when paused).
  useEffect(() => {
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setIdx((i) => (i + 1) % thoughts.length);
        Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      });
    }, 4200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, thoughts.length, fade]);

  // Scanline drift over the viewport.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [scan]);

  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, VIEWPORT_H - 2] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.surfaceHot, colors.bgApp]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={styles.heroWash}
      />
      <LinearGradient
        colors={[t.accent + '33', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <IconButton variant="ghost" onPress={() => nav.goBack()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </IconButton>
        <Chip variant="brand" live>
          AI Vision
        </Chip>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Camera viewport */}
        <View style={styles.viewport}>
          {cameraFrame ? (
            <Image source={{ uri: cameraFrame }} style={styles.frame} resizeMode="cover" />
          ) : (
            <View style={styles.framePlaceholder}>
              <Camera size={36} color={colors.textMuted} />
              <Text style={styles.placeholderText}>Waiting for camera feed</Text>
            </View>
          )}

          {/* Scanline */}
          <Animated.View
            pointerEvents="none"
            style={[styles.scanline, { backgroundColor: t.accent, transform: [{ translateY: scanY }] }]}
          />

          {/* Overlays */}
          <View style={styles.feedTag}>
            <Chip variant="brand" live>
              {cameraFrame ? 'Live Feed' : 'No Signal'}
            </Chip>
          </View>
          <View style={styles.recTag}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>REC</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Perception Feed</Text>
          <Text style={styles.metaText}>{activePersonality.name} · {mode}</Text>
        </View>

        {/* Thought process */}
        <Text style={styles.sectionLabel}>Thought Process</Text>
        <View style={styles.timeline}>
          <ThoughtStep
            icon={<Eye size={18} color={t.accent} />}
            label="Sees"
            accent={t.accent}
            text={current.scene}
            fade={fade}
          />
          <ThoughtStep
            icon={<Ear size={18} color={t.accent} />}
            label="Hears"
            accent={t.accent}
            text={current.heard}
            accessory={<Waveform bars={5} active={playing} height={14} color={t.accent} />}
            fade={fade}
          />
          <ThoughtStep
            icon={<Brain size={18} color={t.accent} />}
            label="Thinks"
            accent={t.accent}
            text={current.reasoning}
            fade={fade}
          />
          <ThoughtStep
            icon={<MessageSquare size={18} color={t.accent} />}
            label="Speaks"
            accent={t.accent}
            text={`"${speakLine}"`}
            last
            fade={fade}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgApp },
  heroWash: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    zIndex: 10,
  },
  topSpacer: { width: 44, height: 44 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screenPad, paddingTop: 16, gap: 16 },

  viewport: {
    height: VIEWPORT_H,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.surfaceInput,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    position: 'relative',
  },
  frame: { width: '100%', height: '100%' },
  framePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  scanline: { position: 'absolute', left: 0, right: 0, top: 0, height: 2, opacity: 0.5 },
  feedTag: { position: 'absolute', top: 12, left: 12 },
  recTag: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  recText: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textPrimary,
  },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },

  sectionLabel: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeline: { gap: 0 },

  step: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 38 },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLine: {
    flex: 1,
    width: 2,
    minHeight: 18,
    marginVertical: 4,
    backgroundColor: colors.borderStrong,
  },
  stepBody: { flex: 1, paddingBottom: 22 },
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  stepLabel: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  stepText: {
    fontFamily: fonts.sans500,
    fontSize: textSize.base,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: 4,
  },
});
