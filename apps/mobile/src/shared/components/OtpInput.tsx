import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Palette, Radius, Spacing } from '../theme';

interface OtpInputProps {
  length?: number;
  onFill: (otp: string) => void;
  onChangeText?: (otp: string) => void;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  onFill,
  onChangeText,
  disabled = false,
}) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(TextInput | null)[]>([]);

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
          style={[styles.cell, values[i] ? styles.cellFilled : null]}
          value={values[i]}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="numeric"
          maxLength={1}
          textAlign="center"
          selectionColor={Palette.primary}
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
    height: 54,
    backgroundColor: Palette.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.inputBorder,
    color: Palette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  cellFilled: {
    borderColor: Palette.borderStrong,
    backgroundColor: Palette.primaryLight,
  },
});
