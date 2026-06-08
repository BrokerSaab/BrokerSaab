import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Palette, Radius, Spacing, Shadow } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  bordered?: boolean;
  glass?: boolean;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = false,
  bordered = true,
  glass = false,
  padding = Spacing.md,
}) => {
  return (
    <View
      style={[
        styles.base,
        { padding },
        bordered && styles.bordered,
        elevated && Shadow.md,
        glass && styles.glass,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
  },
  bordered: {
    borderWidth: 1,
    borderColor: Palette.border,
  },
  glass: {
    backgroundColor: 'rgba(11, 31, 58, 0.7)',
  },
});
