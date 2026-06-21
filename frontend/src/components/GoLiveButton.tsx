import { View, Text, Pressable, Animated, StyleSheet, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { usePress } from './usePress';
import { colors, fonts, textSize, glowShadow } from '../theme/tokens';

interface GoLiveButtonProps {
  narrating: boolean;
  sharing: boolean;
  onPress: () => void;
}

function SignalArc({ delay, size }: { delay: number; size: number }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.6, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 600, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [delay, opacity]);

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
      }}
    />
  );
}

function StatusFlank({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flank}>
      <Text style={styles.flankLabel}>{label}</Text>
      <Text style={styles.flankValue}>{value}</Text>
    </View>
  );
}

export default function GoLiveButton({ narrating, sharing, onPress }: GoLiveButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePress();

  return (
    <View style={styles.container}>
      <StatusFlank label="Narrating" value={narrating ? 'ON' : 'OFF'} />

      <View style={styles.center}>
        <View style={styles.arcsWrap}>
          <SignalArc delay={0} size={96} />
          <SignalArc delay={300} size={112} />
        </View>
        <Animated.View style={[animatedStyle, glowShadow(colors.brand, 40)]}>
          <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.button}>
            <Text style={styles.buttonLabel}>ASIDE</Text>
          </Pressable>
        </Animated.View>
        <Text style={styles.goLiveText}>GO LIVE</Text>
      </View>

      <StatusFlank label="Sharing" value={sharing ? 'ACTIVE' : 'OFF'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  center: {
    alignItems: 'center',
    gap: 8,
  },
  arcsWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    top: -24,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: fonts.mono700,
    fontSize: textSize.xs,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.white,
  },
  goLiveText: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  flank: {
    alignItems: 'center',
    gap: 4,
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
    fontFamily: fonts.sans600,
    fontSize: textSize['2xs'],
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
