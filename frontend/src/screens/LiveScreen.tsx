import { View, Text, Pressable, Animated, StyleSheet, Easing } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Eye, Pause, Play } from 'lucide-react-native';
import Waveform from '../components/Waveform';
import Chip from '../components/Chip';
import CueButton from '../components/CueButton';
import CueIcon from '../components/CueIcon';
import IconButton from '../components/IconButton';
import { useTheme } from '../theme/ThemeContext';
import { getTheme } from '../theme/personalities';
import { liveLines } from '../data/personalities';
import { colors, fonts, textSize } from '../theme/tokens';

export default function LiveScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { activePersonality, playing, togglePlaying, liveLine, fireCue } = useTheme();

  const t = getTheme(activePersonality.theme);
  const lines = liveLines[activePersonality.slug] ?? [activePersonality.sampleLine];
  const [lineIdx, setLineIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const useBackendLine = liveLine != null;
  const displayLine = liveLine ?? lines[lineIdx];

  useEffect(() => {
    if (useBackendLine || !playing) return;
    intervalRef.current = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setLineIdx((i) => (i + 1) % lines.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      });
    }, 4200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [useBackendLine, playing, lines.length, fadeAnim]);

  useEffect(() => {
    if (liveLine == null) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [liveLine, fadeAnim]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgApp }]}>
      <LinearGradient
        colors={[colors.surfaceHot, colors.bgApp]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={styles.heroWash}
      />
      <LinearGradient
        colors={[t.accent + '4D', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <IconButton variant="ghost" onPress={() => nav.goBack()}>
          <ChevronDown size={24} color={colors.textPrimary} />
        </IconButton>
        <Chip variant="brand" live>
          Playing
        </Chip>
        <IconButton variant="ghost" onPress={() => nav.navigate('Vision')}>
          <Eye size={22} color={colors.textPrimary} />
        </IconButton>
      </View>

      <View style={styles.center}>
        <Waveform bars={9} active={playing} height={34} barWidth={4} gap={5} color={t.accent} />

        <View style={styles.lineContainer}>
          <Animated.Text style={[styles.line, { opacity: fadeAnim }]}>
            {'"'}{displayLine}{'"'}
          </Animated.Text>
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.name}>{activePersonality.name}</Text>
          <Text style={styles.meta}>Voice -- {activePersonality.voice} -- music ducked</Text>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 26 }]}>
        <View style={styles.cueRow}>
          {activePersonality.cues.map((c) => (
            <View key={c.id} style={styles.cueItem}>
              <CueButton
                label={c.label}
                hint={c.hint}
                kind={c.kind}
                accentColor={t.accent}
                surfaceColor={colors.surfaceCard}
                surface2Color={colors.surfaceCard2}
                inkColor={colors.textPrimary}
                icon={<CueIcon name={c.icon} size={20} color={t.accent} />}
                onFire={() => fireCue(c.id)}
              />
            </View>
          ))}
        </View>

        <View style={styles.transportRow}>
          <Pressable onPress={togglePlaying} style={[styles.transportBtn, { backgroundColor: t.accent }]}>
            {playing ? (
              <Pause size={22} color={colors.white} fill={colors.white} />
            ) : (
              <Play size={22} color={colors.white} fill={colors.white} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  heroWash: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, zIndex: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, gap: 22, zIndex: 5 },
  lineContainer: { minHeight: 140, justifyContent: 'center', alignItems: 'center' },
  line: { fontFamily: fonts.display700, fontSize: 28, fontWeight: '700', lineHeight: 33, letterSpacing: -0.15, textAlign: 'center', color: colors.textPrimary },
  nameBlock: { alignItems: 'center' },
  name: { fontFamily: fonts.display800, fontSize: 30, fontWeight: '800', letterSpacing: -0.5, color: colors.textPrimary },
  meta: { fontFamily: fonts.mono700, fontSize: textSize['2xs'], fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase', color: colors.textMuted, marginTop: 6 },
  bottom: { paddingHorizontal: 18, gap: 14, zIndex: 10 },
  cueRow: { flexDirection: 'row', gap: 10 },
  cueItem: { flex: 1 },
  transportRow: { alignItems: 'center' },
  transportBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
