import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { radii } from '../theme/tokens';

const BAR_HEIGHTS = [0.5, 0.85, 0.35, 1, 0.6, 0.9, 0.45, 0.75];

interface WaveformProps {
  bars?: number;
  active?: boolean;
  color?: string;
  height?: number;
  gap?: number;
  barWidth?: number;
}

function Bar({ active, color, barWidth, index }: { active: boolean; color: string; barWidth: number; index: number }) {
  const scaleY = useRef(new Animated.Value(0.18)).current;
  const targetHeight = BAR_HEIGHTS[index % BAR_HEIGHTS.length];

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleY, { toValue: targetHeight, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true, delay: index * 80 }),
          Animated.timing(scaleY, { toValue: 0.25, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    } else {
      Animated.timing(scaleY, { toValue: 0.18, duration: 300, useNativeDriver: true }).start();
    }
  }, [active, index, scaleY, targetHeight]);

  return (
    <Animated.View
      style={{
        width: barWidth,
        height: '100%',
        borderRadius: radii.pill,
        backgroundColor: color,
        opacity: active ? 1 : 0.4,
        transform: [{ scaleY }],
      }}
    />
  );
}

export default function Waveform({ bars = 5, active = true, color = '#ff4d3d', height = 22, gap = 3, barWidth = 3 }: WaveformProps) {
  return (
    <View style={[styles.container, { height, gap }]}>
      {Array.from({ length: bars }).map((_, i) => (
        <Bar key={i} active={active} color={color} barWidth={barWidth} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
