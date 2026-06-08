import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette } from '../theme';

interface StarRatingProps {
  score: number;
  count?: number;
  size?: number;
  readonly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  score,
  count,
  size = 14,
  readonly = true,
}) => (
  <View style={styles.row}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Text
        key={star}
        style={{ fontSize: size, color: star <= Math.round(score) ? Palette.primary : Palette.textMuted }}
      >
        ★
      </Text>
    ))}
    {count !== undefined ? (
      <Text style={[styles.count, { fontSize: size - 2 }]}>{count}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  count: { color: Palette.textSecondary, marginLeft: 4 },
});
