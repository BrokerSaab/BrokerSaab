import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { Palette, Radius, Spacing } from '../theme';

interface SkeletonLineProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

const SkeletonLine: React.FC<SkeletonLineProps> = ({ width = '100%', height = 14, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: Palette.card,
          borderRadius: Radius.sm,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface SkeletonLoaderProps {
  lines?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ lines = 3, style }) => (
  <View style={[styles.container, style]}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine
        key={i}
        width={i === lines - 1 ? '60%' : '100%'}
        style={{ marginBottom: Spacing.sm }}
      />
    ))}
  </View>
);

export { SkeletonLine };

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
});
