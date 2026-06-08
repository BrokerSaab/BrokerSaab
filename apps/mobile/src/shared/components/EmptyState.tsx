import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Spacing, Typography } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon,
}) => (
  <View style={styles.container}>
    {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {actionLabel && onAction ? (
      <Button label={actionLabel} onPress={onAction} variant="outline" style={styles.action} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  iconWrap: { marginBottom: Spacing.sm },
  title: { ...Typography.subheading, textAlign: 'center' },
  subtitle: { ...Typography.caption, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: Spacing.md },
});
