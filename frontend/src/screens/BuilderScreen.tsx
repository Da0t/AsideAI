import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Sparkles, UserRound } from 'lucide-react-native';
import PersonalityCard from '../components/PersonalityCard';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import VoicePicker from '../components/VoicePicker';
import Button from '../components/Button';
import IconButton from '../components/IconButton';
import { useTheme } from '../theme/ThemeContext';
import { voices, type PersonalityData, type CueData } from '../data/personalities';
import { colors, fonts, textSize, spacing } from '../theme/tokens';

const DEFAULT_CUES: CueData[] = [
  { id: 'entrance', label: 'Entrance', hint: 'Walk-on music', kind: 'music', icon: 'Music4' },
  { id: 'laugh', label: 'Laugh', hint: 'Laugh track', kind: 'sfx', icon: 'Laugh' },
  { id: 'sting', label: 'Sting', hint: 'Punctuate', kind: 'sfx', icon: 'Sparkles' },
];

export default function BuilderScreen() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { addPersonality } = useTheme();

  const [name, setName] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [desc, setDesc] = useState('');

  const voice = voices.find((v) => v.id === voiceId);
  const canCreate = name.trim().length > 0 && voiceId.length > 0;

  const handleCreate = () => {
    const slug = 'custom-' + Date.now();
    const p: PersonalityData = {
      slug,
      theme: 'custom',
      name: name.trim(),
      glyph: '✦',
      voice: voice?.name ?? 'Asteria',
      tagline: voice ? `Voice · ${voice.name}` : 'Custom narrator',
      sampleLine: desc || 'Your custom narrator is ready.',
      cues: DEFAULT_CUES,
    };
    addPersonality(p);
    nav.goBack();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton variant="surface" onPress={() => nav.goBack()}>
          <ArrowLeft size={20} color={colors.textMuted} />
        </IconButton>
        <Text style={styles.title}>New narrator</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.previewWrap}>
          <PersonalityCard
            theme="custom"
            name={name || 'Untitled'}
            voice={voice?.name}
            tagline={voice ? `Voice · ${voice.name}` : 'Pick a voice'}
            glyph="✦"
          />
        </View>

        <Input
          label="Name"
          placeholder="Name your narrator"
          value={name}
          onChangeText={setName}
          icon={<UserRound size={18} color={colors.textMuted} />}
        />

        <View style={styles.voiceSection}>
          <Text style={styles.sectionLabel}>Voice</Text>
          <VoicePicker
            voices={voices}
            value={voiceId}
            onChange={setVoiceId}
          />
        </View>

        <Textarea
          label="Describe the character"
          rows={4}
          maxLength={400}
          value={desc}
          onChangeText={setDesc}
          placeholder={'Personality, tone, vocabulary, quirks. e.g. "A calm night coach who reframes every setback as training, speaks in short steady encouragements."'}
        />
      </ScrollView>

      <View style={[styles.dock, { bottom: 18 + insets.bottom }]}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleCreate}
          disabled={!canCreate}
          icon={<Sparkles size={18} color={colors.brandInk} />}
        >
          Create narrator
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: fonts.display800,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    gap: 18,
  },
  previewWrap: {
    maxWidth: 300,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 4,
  },
  voiceSection: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  dock: {
    position: 'absolute',
    left: 18,
    right: 18,
  },
});
