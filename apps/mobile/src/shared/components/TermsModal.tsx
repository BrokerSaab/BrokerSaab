import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../theme';

const TC_CLAUSES = [
  {
    color: '#ef4444',
    title: 'No Liability for Fraud or Misconduct',
    body: 'BrokerSaab is a third-party technology marketplace. We are NOT responsible for any fraudulent activity, misrepresentation, or financial harm caused by any advisor listed on this platform. Users engage professionals entirely at their own risk.',
  },
  {
    color: '#f59e0b',
    title: 'Disputes — Indian Judiciary',
    body: 'All disputes arising from use of BrokerSaab shall be subject exclusively to the jurisdiction of the competent courts of India. BrokerSaab is not a party to disputes between users and advisors.',
  },
  {
    color: '#10b981',
    title: 'Escrow Payment Protection',
    body: 'Payments are held in escrow until consultation completion. BrokerSaab does NOT guarantee the quality, accuracy, or outcome of any professional advice or service.',
  },
  {
    color: '#3b82f6',
    title: 'User Responsibilities',
    body: "You are responsible for independently verifying any professional's credentials before acting on their advice. BrokerSaab's internal verification is not a government certification.",
  },
  {
    color: '#8b5cf6',
    title: 'Platform Role',
    body: 'BrokerSaab is a neutral intermediary only. No fiduciary duty or professional liability is created with BrokerSaab by using this platform.',
  },
];

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose, onAgree }) => {
  const [scrolledToBottom, setScrolledToBottom] = React.useState(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 30) {
      setScrolledToBottom(true);
    }
  };

  const handleAgree = () => {
    onAgree();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Scrollable content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️  By using BrokerSaab, you agree to the following terms. Read each clause carefully.
            </Text>
          </View>

          {TC_CLAUSES.map((clause) => (
            <View key={clause.title} style={[styles.clauseCard, { borderLeftColor: clause.color }]}>
              <Text style={[styles.clauseTitle, { color: clause.color }]}>
                {clause.title.toUpperCase()}
              </Text>
              <Text style={styles.clauseBody}>{clause.body}</Text>
            </View>
          ))}

          <View style={styles.govBox}>
            <Text style={styles.govText}>
              ⚖️  Governing Law: All matters are subject to the laws of India and the jurisdiction of Indian courts.
            </Text>
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        {/* Bottom action */}
        <View style={styles.footer}>
          {!scrolledToBottom && (
            <Text style={styles.scrollHint}>↓ Scroll down to read all terms</Text>
          )}
          <LinearGradient
            colors={scrolledToBottom ? ['#FFE082', '#D4AF37', '#B48C22'] : ['#e2e8f0', '#cbd5e1', '#cbd5e1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.agreeBtnGradient}
          >
            <TouchableOpacity
              style={styles.agreeBtnInner}
              onPress={scrolledToBottom ? handleAgree : undefined}
              activeOpacity={scrolledToBottom ? 0.85 : 1}
            >
              <Text style={[styles.agreeBtnText, !scrolledToBottom && styles.agreeBtnTextDisabled]}>
                I Agree & Continue
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.navy[800],
    textAlign: 'center',
  },
  closeBtn: {
    width: 40,
    alignItems: 'flex-end',
  },
  closeText: {
    fontSize: 18,
    color: Colors.slate[500],
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.slate[200],
    marginHorizontal: Spacing.lg,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.md },

  warningBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  warningText: { fontSize: 13, color: '#b91c1c', lineHeight: 19 },

  clauseCard: {
    borderLeftWidth: 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.slate[50],
    padding: Spacing.md,
    gap: 6,
  },
  clauseTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  clauseBody: { fontSize: 13, color: Colors.slate[600], lineHeight: 19 },

  govBox: {
    backgroundColor: 'rgba(79,70,229,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.2)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  govText: { fontSize: 13, color: '#4f46e5', lineHeight: 19 },

  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.slate[200],
    backgroundColor: Colors.white,
  },
  scrollHint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.slate[400],
    letterSpacing: 0.3,
  },
  agreeBtnGradient: { borderRadius: Radius.lg, overflow: 'hidden' },
  agreeBtnInner: { paddingVertical: 16, alignItems: 'center' },
  agreeBtnText: { fontSize: 16, fontWeight: '800', color: Colors.navy[900], letterSpacing: 0.3 },
  agreeBtnTextDisabled: { color: Colors.slate[400] },
});
