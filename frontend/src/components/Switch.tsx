import { View, Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, fonts, textSize } from '../theme/tokens';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  accentColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

const TRACK_W = 50;
const TRACK_H = 30;
const KNOB = 24;
const TRAVEL = TRACK_W - KNOB - 6;

export default function Switch({ checked, onChange, label, accentColor = colors.brand, disabled = false, style }: SwitchProps) {
  const knobX = useRef(new Animated.Value(checked ? TRAVEL : 0)).current;

  useEffect(() => {
    Animated.spring(knobX, { toValue: checked ? TRAVEL : 0, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [checked, knobX]);

  const toggle = () => { if (!disabled) onChange(!checked); };

  const track = (
    <Pressable onPress={toggle} style={[styles.track, { backgroundColor: checked ? accentColor : colors.surfaceCard, opacity: disabled ? 0.5 : 1 }]}>
      <Animated.View style={[styles.knob, { transform: [{ translateX: knobX }] }]} />
    </Pressable>
  );

  if (!label) return <View style={style}>{track}</View>;

  return (
    <Pressable onPress={toggle} style={[styles.row, style]}>
      <Text style={styles.label}>{label}</Text>
      {track}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  label: {
    fontFamily: fonts.sans600,
    fontSize: textSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
