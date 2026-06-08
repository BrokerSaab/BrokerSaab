import React from 'react';
import { View, Text, Image, ViewStyle, StyleSheet } from 'react-native';
import { Palette, Radius } from '../theme';
import { initials } from '../utils/format';

interface AvatarProps {
  uri?: string | null;
  fallbackName?: string | null;
  size?: number;
  style?: ViewStyle;
  showBorder?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  fallbackName,
  size = 44,
  style,
  showBorder = false,
}) => {
  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          { width: size, height: size, borderRadius } as any,
          showBorder && (styles.border as any),
          style as any,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: Palette.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        showBorder && styles.border,
        style,
      ]}
    >
      <Text
        style={{
          color: Palette.primary,
          fontWeight: '700',
          fontSize: size * 0.38,
        }}
      >
        {initials(fallbackName)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  border: {
    borderWidth: 2,
    borderColor: Palette.borderStrong,
  },
});
