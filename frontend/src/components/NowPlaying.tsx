import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pause, Play } from 'lucide-react-native';
import Waveform from './Waveform';
import Chip from './Chip';
import { colors, fonts, textSize, radii, shadow } from '../theme/tokens';
import { PersonalityTheme } from '../theme/personalities';

interface NowPlayingProps {
  name: string;
  theme: PersonalityTheme;
  voice?: string;
  mode?: string;
  playing?: boolean;
  ducking?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  style?: ViewStyle;
}

export default function NowPlaying({
  name,
  theme,
  voice,
  mode,
  playing = true,
  ducking = false,
  onToggle,
  onOpen,
  style,
}: NowPlayingProps) {
  return (
    <LinearGradient
      colors={[colors.surfaceHot, colors.surfaceCard]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, shadow('lg'), style]}
    >
      <Pressable onPress={onToggle} style={[styles.playBtn, { backgroundColor: theme.accent }]}>
        {playing ? (
          <Pause size={18} color={colors.white} fill={colors.white} />
        ) : (
          <Play size={18} color={colors.white} fill={colors.white} />
        )}
      </Pressable>

      <Pressable onPress={onOpen} style={styles.info}>
        <View style={styles.topRow}>
          <Chip variant="brand" live>
            LIVE
          </Chip>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={styles.metaRow}>
          {mode && <Text style={styles.meta}>{mode}</Text>}
          {voice && <Text style={styles.meta}>· {voice}</Text>}
          {ducking && (
            <Text style={[styles.meta, { color: theme.accent, opacity: 1 }]}>
              · music ducked
            </Text>
          )}
        </View>
      </Pressable>

      <Waveform bars={6} active={playing} height={26} color={theme.accent} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    paddingRight: 14,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: fonts.display800,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.15,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  meta: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
});
