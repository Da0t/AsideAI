import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Menu, Info, Bell, Plus } from 'lucide-react-native';
import PersonalityCard from '../components/PersonalityCard';
import ModeCard from '../components/ModeCard';
import TabBar from '../components/TabBar';
import GoLiveButton from '../components/GoLiveButton';
import Chip from '../components/Chip';
import IconButton from '../components/IconButton';
import { useTheme } from '../theme/ThemeContext';
import { modes } from '../data/personalities';
import { colors, fonts, textSize, spacing } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {
    allPersonalities,
    activeSlug,
    setActiveSlug,
    activeTheme,
    mode,
    setMode,
    playing,
    togglePlaying,
  } = useTheme();

  const [tabIndex, setTabIndex] = useState(0);
  const currentMode = modes.find((m) => m.value === mode) ?? modes[0];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top nav bar */}
      <View style={styles.navBar}>
        <IconButton variant="ghost">
          <Menu size={22} color={colors.textMuted} />
        </IconButton>
        <Text style={styles.navTitle}>Aside</Text>
        <View style={styles.navRight}>
          <IconButton variant="ghost">
            <Info size={20} color={colors.textMuted} />
          </IconButton>
          <IconButton variant="ghost">
            <Bell size={20} color={colors.textMuted} />
          </IconButton>
        </View>
      </View>

      {/* Tab bar */}
      <TabBar
        tabs={['Narrators', 'Recent']}
        activeIndex={tabIndex}
        onChange={setTabIndex}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode card */}
        <ModeCard
          modeLabel={currentMode.label}
          live={playing}
          onToggleLive={togglePlaying}
          accentColor={activeTheme.accent}
        />

        {/* Mode chips (tap to switch narration intensity) */}
        <View style={styles.chipsRow}>
          {modes.map((m) => (
            <Pressable key={m.value} onPress={() => setMode(m.value)}>
              <Chip
                variant={mode === m.value ? 'solid' : 'outline'}
                style={mode === m.value ? { backgroundColor: colors.surfaceCard2 } : undefined}
              >
                {m.label}
              </Chip>
            </Pressable>
          ))}
          <IconButton size="sm" variant="ghost" onPress={() => nav.navigate('Builder')}>
            <Plus size={18} color={colors.textMuted} />
          </IconButton>
        </View>

        {/* Hint text */}
        <Text style={styles.hint}>
          Swipe Card {'◀◀'} to Forget • Swipe {'▶▶'} to Remember
        </Text>

        {/* Personality card list */}
        <View style={styles.cardList}>
          {allPersonalities.map((p) => (
            <PersonalityCard
              key={p.slug}
              name={p.name}
              theme={p.theme}
              glyph={p.glyph}
              voice={p.voice}
              tagline={p.tagline}
              active={p.slug === activeSlug}
              onSelect={() => setActiveSlug(p.slug)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCta, { paddingBottom: insets.bottom + 16 }]}>
        <GoLiveButton
          narrating={playing}
          sharing={playing}
          onPress={() => nav.navigate('Live')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    height: 52,
  },
  navTitle: {
    fontFamily: fonts.display700,
    fontSize: textSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  navRight: {
    flexDirection: 'row',
    gap: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    gap: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontFamily: fonts.sans500,
    fontSize: textSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cardList: {
    gap: 10,
  },
  bottomCta: {
    paddingTop: 12,
    backgroundColor: colors.bgApp,
  },
});
