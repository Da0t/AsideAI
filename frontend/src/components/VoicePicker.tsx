import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Play } from 'lucide-react-native';
import { colors, fonts, textSize, radii } from '../theme/tokens';
import { VoiceData } from '../data/personalities';

interface VoicePickerProps {
  voices: VoiceData[];
  value: string;
  onChange: (id: string) => void;
  onPreview?: (id: string) => void;
  accentColor?: string;
  style?: ViewStyle;
}

export default function VoicePicker({
  voices,
  value,
  onChange,
  onPreview,
  accentColor = colors.brand,
  style,
}: VoicePickerProps) {
  return (
    <View style={[styles.container, style]}>
      {voices.map((v) => {
        const selected = v.id === value;
        return (
          <Pressable
            key={v.id}
            onPress={() => onChange(v.id)}
            style={[
              styles.row,
              {
                backgroundColor: selected ? accentColor + '24' : colors.surfaceCard,
                borderColor: selected ? accentColor : colors.borderHairline,
              },
            ]}
          >
            <View
              style={[
                styles.radio,
                { borderColor: selected ? accentColor : colors.borderStrong },
              ]}
            >
              {selected && (
                <View style={[styles.radioDot, { backgroundColor: accentColor }]} />
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{v.name}</Text>
              <Text style={styles.character} numberOfLines={1}>
                {v.character}
              </Text>
            </View>
            <Pressable
              onPress={() => onPreview?.(v.id)}
              style={styles.preview}
              hitSlop={8}
            >
              <Play size={13} color={colors.textMuted} fill={colors.textMuted} />
            </Pressable>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingRight: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.sans700,
    fontSize: textSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  character: {
    fontFamily: fonts.sans400,
    fontSize: textSize.sm,
    color: colors.textMuted,
  },
  preview: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceCard2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
