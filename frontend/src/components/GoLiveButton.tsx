import { View, Text, Pressable, Animated, StyleSheet, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react-native';
import { usePress } from './usePress';
import { colors, fonts, textSize, glowShadow } from '../theme/tokens';

interface GoLiveButtonProps {
  playing: boolean;
  narrating: boolean;
  sharing: boolean;
  onPress: () => void;
}

function SignalArc({ delay, size }: { delay: number; size: number }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.5, duration: 400, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(scale, { toValue: 0.7, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: colors.brand,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

function StatusFlank({ label, value, align }: { label: string; value: string; align: 'left' | 'right' }) {
  return (
    <View style={[styles.flank, { alignItems: align === 'left' ? 'flex-start' : 'flex-end' }]}>
      <Text style={styles.flankLabel}>{label}</Text>
      <Text style={styles.flankValue}>{value}</Text>
    </View>
  );
}

export default function GoLiveButton({ playing, narrating, sharing, onPress }: GoLiveButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePress();

  return (
    <View style={styles.container}>
      <StatusFlank label="Narrating" value={narrating ? 'ON' : 'OFF'} align="left" />

      <View style={styles.center}>
        <View style={styles.arcsWrap} pointerEvents="none">
          <SignalArc delay={0} size={92} />
          <SignalArc delay={600} size={92} />
        </View>
        <Animated.View style={[animatedStyle, glowShadow(colors.brand, 36)]}>
          <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.button}>
            {playing ? (
              <Pause size={26} color={colors.white} fill={colors.white} />
            ) : (
              <Play size={26} color={colors.white} fill={colors.white} style={{ marginLeft: 2 }} />
            )}
          </Pressable>
        </Animated.View>
      </View>

      <StatusFlank label="Sharing" value={sharing ? 'ACTIVE' : 'OFF'} align="right" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    height: 92,
  },
  arcsWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    height: 92,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flank: {
    gap: 3,
    minWidth: 64,
  },
  flankLabel: {
    fontFamily: fonts.mono700,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  flankValue: {
    fontFamily: fonts.sans700,
    fontSize: textSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
