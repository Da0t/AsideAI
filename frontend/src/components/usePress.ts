import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { motion } from '../theme/tokens';

export function usePress(scale: number = motion.pressScale) {
  const anim = useRef(new Animated.Value(1)).current;

  const animatedStyle = { transform: [{ scale: anim }] };

  const onPressIn = useCallback(() => {
    Animated.spring(anim, {
      toValue: scale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [anim, scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [anim]);

  return { animatedStyle, onPressIn, onPressOut };
}
