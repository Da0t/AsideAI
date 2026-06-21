import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { useState, ReactNode } from 'react';
import { colors, fonts, textSize, radii, spacing } from '../theme/tokens';

interface InputProps {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accentColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Input({
  label,
  hint,
  icon,
  value,
  onChangeText,
  placeholder,
  accentColor = colors.brand,
  disabled = false,
  style,
}: InputProps) {
  const [focused, setFocused] = useState(false);

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
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surfaceInput,
    borderRadius: radii.input,
    borderWidth: 1,
  },
  iconWrap: {
    width: 18,
    height: 18,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.sans500,
    fontSize: textSize.base,
    padding: 0,
  },
  hint: {
    fontSize: textSize.xs,
    color: colors.textMuted,
    fontFamily: fonts.sans400,
  },
});
