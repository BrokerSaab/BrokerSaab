import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Colors, Palette, Radius, Spacing } from '../theme';

interface OtpInputProps {
  length?: number;
  onFill: (otp: string) => void;
  onChangeText?: (otp: string) => void;
  disabled?: boolean;
  value?: string; // external value for auto-fill
  darkMode?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  onFill,
  onChangeText,
  disabled = false,
  value,
  darkMode = false,
}) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(TextInput | null)[]>([]);

  // Sync external value (e.g. auto-fill from dev OTP)
  useEffect(() => {
    if (value !== undefined) {
      const chars = value.slice(0, length).split('');
      const padded = [...chars, ...Array(length - chars.length).fill('')];
      setValues(padded);
      if (value.length === length) onFill(value);
      onChangeText?.(value);
    }
  }, [value]);

  const handleChange = (text: string, index: number) => {
    const char = text.slice(-1);
    const newValues = [...values];
    newValues[index] = char;
    setValues(newValues);

    const otp = newValues.join('');
    onChangeText?.(otp);

    if (char && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
    if (newValues.every((v) => v !== '')) {
      onFill(otp);
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      const newValues = [...values];
      newValues[index - 1] = '';
      setValues(newValues);
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          style={[
            styles.cell,
            darkMode && styles.cellDark,
            values[i] ? (darkMode ? styles.cellFilledDark : styles.cellFilled) : null,
          ]}
          value={values[i]}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="numeric"
          maxLength={1}
          textAlign="center"
          selectionColor={Colors.gold[500]}
          editable={!disabled}
          caretHidden={Platform.OS === 'android'}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  cell: {
    width: 46,
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.slate[200],
    color: Colors.navy[800],
    fontSize: 22,
    fontWeight: '800',
  },
  cellFilled: {
    borderColor: Colors.gold[500],
    backgroundColor: '#FFFBEB',
  },
  cellDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    color: Colors.white,
  },
  cellFilledDark: {
    borderColor: Colors.gold[500],
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
});
