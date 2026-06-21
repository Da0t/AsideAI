import { View, Text, Pressable, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { colors, fonts, radii } from '../theme/tokens';

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

const heights = { sm: 36, md: 44, lg: 52 } as const;
const fontSizes = { sm: 12, md: 13, lg: 14 } as const;

export default function SegmentedControl({ options, value, onChange, accentColor = colors.brand, size = 'md' }: SegmentedControlProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const itemWidth = containerWidth > 0 ? (containerWidth - 8) / options.length : 0;

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      setContainerWidth(w);
      const iw = (w - 8) / options.length;
      translateX.setValue(selectedIndex * iw);
    },
    [options.length, selectedIndex, translateX],
  );

  const handlePress = (val: string, index: number) => {
    Animated.spring(translateX, { toValue: index * itemWidth, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
    onChange(val);
  };

  return (
    <View style={[styles.container, { height: heights[size] }]} onLayout={onLayout}>
      {itemWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            { width: itemWidth, height: heights[size] - 8, backgroundColor: accentColor, transform: [{ translateX }] },
          ]}
        />
      )}
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <Pressable key={opt.value} onPress={() => handlePress(opt.value, i)} style={[styles.option, { height: heights[size] - 8 }]}>
            <Text style={[styles.optionText, { fontSize: fontSizes[size], color: active ? colors.white : colors.textMuted, fontWeight: active ? '700' : '600' }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    borderRadius: radii.pill,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  optionText: {
    fontFamily: fonts.sans600,
  },
});
