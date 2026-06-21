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
          <Pressable onPress={() => onChange(i)} hitSlop={8} style={styles.tab}>
            <Text style={[styles.tabText, i === activeIndex ? styles.active : styles.inactive]}>
              {tab}
            </Text>
            {i === activeIndex && <View style={styles.underline} />}
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
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    color: colors.textMuted,
    fontSize: textSize.base,
    marginHorizontal: 6,
  },
  tabText: {
    fontFamily: fonts.sans700,
    fontSize: textSize.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  active: {
    color: colors.brand,
  },
  inactive: {
    color: colors.textMuted,
  },
  underline: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.brand,
  },
});
