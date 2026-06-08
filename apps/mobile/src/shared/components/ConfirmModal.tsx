import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Palette, Radius, Spacing, Typography } from '../theme';
import { Button } from './Button';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) => (
  <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
      <View style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        <View style={styles.actions}>
          <Button
            label={cancelLabel}
            onPress={onCancel}
            variant="ghost"
            style={styles.btn}
          />
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            variant={destructive ? 'danger' : 'primary'}
            style={styles.btn}
          />
        </View>
      </View>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: Spacing.sm,
  },
  title: { ...Typography.subheading, textAlign: 'center' },
  body: { ...Typography.caption, textAlign: 'center', lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  btn: { flex: 1 },
});
