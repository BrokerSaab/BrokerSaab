import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ViewStyle,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Palette, Radius, Spacing, Typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureToggle?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  secureToggle = false,
  containerStyle,
  secureTextEntry,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeft : null,
            (rightIcon || secureToggle) ? styles.inputWithRight : null,
          ]}
          placeholderTextColor={Palette.textMuted}
          selectionColor={Palette.primary}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {secureToggle ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRight}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    ...Typography.label,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
  },
  inputWrapperFocused: {
    borderColor: Palette.inputBorderFocus,
  },
  inputWrapperError: {
    borderColor: Palette.error,
  },
  input: {
    flex: 1,
    color: Palette.text,
    fontSize: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 48,
  },
  inputWithLeft: { paddingLeft: Spacing.xs },
  inputWithRight: { paddingRight: Spacing.xs },
  iconLeft: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    justifyContent: 'center',
  },
  iconRight: {
    paddingRight: Spacing.md,
    paddingLeft: Spacing.xs,
    justifyContent: 'center',
  },
  toggleText: {
    color: Palette.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  error: { color: Palette.error, fontSize: 11, marginTop: 4 },
  hint: { color: Palette.textMuted, fontSize: 11, marginTop: 4 },
});
