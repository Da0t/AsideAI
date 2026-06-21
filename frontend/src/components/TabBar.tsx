import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, textSize } from '../theme/tokens';

interface TabBarProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export default function TabBar({ tabs, activeIndex, onChange }: TabBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab, i) => (
        <View key={tab} style={styles.tabWrap}>
          {i > 0 && <Text style={styles.dot}>·</Text>}
          <Pressable onPress={() => onChange(i)} hitSlop={8}>
            <Text
              style={[
                styles.tabText,
                i === activeIndex ? styles.active : styles.inactive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  tabWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    color: colors.textMuted,
    fontSize: textSize.base,
    marginHorizontal: 4,
  },
  tabText: {
    fontFamily: fonts.sans600,
    fontSize: textSize.sm,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  active: {
    color: colors.textPrimary,
  },
  inactive: {
    color: colors.textMuted,
  },
});
