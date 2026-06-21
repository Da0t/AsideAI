import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Info, Bell, Plus } from 'lucide-react-native';
import PersonalityCard from '../components/PersonalityCard';
import ModeCard from '../components/ModeCard';
import TabBar from '../components/TabBar';
import GoLiveButton from '../components/GoLiveButton';
import SettingsSheet from '../components/SettingsSheet';
import InfoSheet from '../components/InfoSheet';
import IconButton from '../components/IconButton';
import Logo from '../components/Logo';
import { useTheme } from '../theme/ThemeContext';
import { modes } from '../data/personalities';
import { getTheme } from '../theme/personalities';
import { colors, fonts, textSize, radii, spacing } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

function modeLabel(value: string): string {
  return modes.find((m) => m.value === value)?.label ?? value;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {
    allPersonalities,
    activeSlug,
    setActiveSlug,
    modeFor,
    setModeFor,
    playing,
    togglePlaying,
    lineHistory,
  } = useTheme();

  const [tabIndex, setTabIndex] = useState(0);
  const [settingsSlug, setSettingsSlug] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const openSettings = (slug: string) => {
    setSettingsSlug(slug);
    setSettingsOpen(true);
  };

  const settingsPersonality = allPersonalities.find((p) => p.slug === settingsSlug) ?? null;

  return (
    <View style={styles.root}>
      {/* Big red gradient wash bleeding from the top */}
      <LinearGradient
        colors={['#240811', '#b41d33', '#5e1320', colors.bgApp]}
        locations={[0, 0.34, 0.64, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />

      <View style={{ paddingTop: insets.top }}>
        {/* Top nav bar */}
        <View style={styles.navBar}>
          <View style={styles.navSpacer} />
          <View style={styles.brand}>
            <Logo size={22} />
            <Text style={styles.navTitle}>Aside</Text>
          </View>
          <View style={styles.navRight}>
            <IconButton variant="ghost" onPress={() => setInfoOpen(true)}>
              <Info size={20} color={colors.textPrimary} />
            </IconButton>
            <View>
              <IconButton variant="ghost" onPress={() => setTabIndex(1)}>
                <Bell size={20} color={colors.textPrimary} />
              </IconButton>
              {lineHistory.length > 0 && <View style={styles.bellDot} />}
            </View>
          </View>
        </View>

        {/* Tab bar */}
        <TabBar tabs={['Narrators', 'Recent']} activeIndex={tabIndex} onChange={setTabIndex} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Active narrator + playing toggle */}
        <ModeCard
          modeLabel={modeLabel(modeFor(activeSlug))}
          live={playing}
          onToggleLive={togglePlaying}
          onPressMode={() => openSettings(activeSlug)}
        />

        {tabIndex === 0 ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.sectionLabel}>Your narrators</Text>
              <Pressable style={styles.newBtn} onPress={() => nav.navigate('Builder')}>
                <Plus size={16} color={colors.brand} />
                <Text style={styles.newBtnText}>New</Text>
              </Pressable>
            </View>

            <View style={styles.cardList}>
              {allPersonalities.map((p) => (
                <PersonalityCard
                  key={p.slug}
                  name={p.name}
                  theme={p.theme}
                  voice={p.voice}
                  modeLabel={modeLabel(modeFor(p.slug))}
                  active={p.slug === activeSlug}
                  onPress={() => openSettings(p.slug)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.recentWrap}>
            <Text style={styles.sectionLabel}>Conversation</Text>
            {lineHistory.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyText}>No narration yet.</Text>
                <Text style={styles.emptyHint}>Press play to start the conversation.</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {lineHistory.map((entry) => {
                  const p = allPersonalities.find((x) => x.slug === entry.slug);
                  const t = getTheme(p?.theme ?? 'custom');
                  return (
                    <View key={entry.id} style={styles.logItem}>
                      <View style={[styles.logDot, { backgroundColor: t.accent }]} />
                      <View style={styles.logBody}>
                        <Text style={styles.logText}>{'"'}{entry.text}{'"'}</Text>
                        <View style={styles.logMetaRow}>
                          <Text style={[styles.logName, { color: t.accent }]}>
                            {p?.name ?? entry.slug}
                          </Text>
                          <Text style={styles.logTime}>{timeAgo(entry.at)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom play control with status flanks */}
      <View style={[styles.bottomDock, { paddingBottom: insets.bottom + 14 }]}>
        <GoLiveButton
          playing={playing}
          narrating={playing}
          sharing={playing}
          onPress={() => nav.navigate('Live')}
        />
      </View>

      {/* Per-narrator settings sheet */}
      <SettingsSheet
        personality={settingsPersonality}
        visible={settingsOpen}
        mode={settingsSlug ? modeFor(settingsSlug) : 'chatty'}
        active={settingsSlug === activeSlug}
        onChangeMode={(m) => settingsSlug && setModeFor(settingsSlug, m)}
        onSetActive={() => settingsSlug && setActiveSlug(settingsSlug)}
        onClose={() => setSettingsOpen(false)}
      />

      {/* App info sheet */}
      <InfoSheet
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
        narratorCount={allPersonalities.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 560,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    height: 52,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  navSpacer: {
    width: 92,
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: '#3a0a14',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    gap: 16,
    paddingTop: 4,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  newBtnText: {
    fontFamily: fonts.sans700,
    fontSize: textSize.xs,
    fontWeight: '700',
    color: colors.brand,
  },
  cardList: {
    gap: 10,
  },
  recentWrap: {
    gap: 12,
  },
  logItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    padding: 14,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  logBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  logText: {
    fontFamily: fonts.sans500,
    fontSize: textSize.base,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logName: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logTime: {
    fontFamily: fonts.mono700,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  bottomDock: {
    paddingTop: 14,
    backgroundColor: colors.bgApp,
    borderTopWidth: 1,
    borderTopColor: colors.borderHairline,
  },
  emptyTab: {
    alignItems: 'center',
    paddingTop: 50,
    gap: 8,
  },
  emptyText: {
    fontFamily: fonts.sans600,
    fontSize: textSize.base,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontFamily: fonts.sans400,
    fontSize: textSize.sm,
    color: colors.textMuted,
  },
});
