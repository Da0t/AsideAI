import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { useState } from 'react';
import { colors, fonts, textSize, radii, spacing } from '../theme/tokens';

interface TextareaProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  accentColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Textarea({
  label,
  value,
  onChangeText,
  placeholder,
  rows = 4,
  maxLength,
  accentColor = colors.brand,
  disabled = false,
  style,
}: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const len = value.length;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          {
            borderColor: focused ? accentColor : colors.borderStrong,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { minHeight: rows * 22 }]}
        />
      </View>
      {maxLength != null && (
        <Text
          style={[
            styles.counter,
            len > maxLength * 0.9 && { color: colors.warn },
          ]}
        >
          {len}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing[2],
    width: '100%',
  },
  label: {
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  field: {
    padding: 14,
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.input,
    borderWidth: 1,
  },
  input: {
    color: colors.textPrimary,
    fontFamily: fonts.sans500,
    fontSize: textSize.base,
    lineHeight: 22,
    padding: 0,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: fonts.mono700,
    fontSize: textSize['2xs'],
    color: colors.textMuted,
  },
});
