import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing } from '../theme';
import { useUiStore } from '../store/uiStore';

const colorMap = {
  success: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171' },
  info: { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#818cf8' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24' },
};

export const ToastBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { toasts, dismissToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + Spacing.sm }]}>
      {toasts.map((toast) => {
        const c = colorMap[toast.type];
        return (
          <TouchableOpacity
            key={toast.id}
            onPress={() => dismissToast(toast.id)}
            style={[styles.toast, { backgroundColor: c.bg, borderLeftColor: c.border }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.message, { color: c.text }]}>{toast.message}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    gap: Spacing.xs,
  },
  toast: {
    borderLeftWidth: 3,
    borderRadius: Radius.md,
    padding: Spacing.md,
    paddingLeft: Spacing.md + 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
});
