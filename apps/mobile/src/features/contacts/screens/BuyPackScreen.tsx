import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../../shared/navigation/types';
import { Colors, Palette, Spacing, Radius, Shadow } from '../../../shared/theme';
import { BrokerSaabLogo } from '../../../shared/components';
import { contactRepository } from '../../../shared/api';
import { useUiStore } from '../../../shared/store';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../shared/api/apiClient';

type Props = NativeStackScreenProps<ProfileStackParamList, 'BuyPack'>;

const BASE    = 99;
const ORIG    = 999;
const CGST    = Math.round(BASE * 0.09 * 100) / 100;
const SGST    = Math.round(BASE * 0.09 * 100) / 100;
const TOTAL   = Math.round((BASE + CGST + SGST) * 100) / 100;
const CREDITS = 20;
const DISC    = Math.round((1 - BASE / ORIG) * 100);

const WHAT_YOU_GET = [
  { icon: '👁️', text: `Reveal ${CREDITS} verified advisor contacts (phone + email)` },
  { icon: '⏰', text: '1-year validity — use credits any time within 12 months' },
  { icon: '🛡️', text: 'Every advisor is KYC-verified by our review team' },
  { icon: '📞', text: 'Call or WhatsApp directly — skip the booking queue' },
  { icon: '⚡', text: 'Credits appear in your account instantly after payment' },
  { icon: '✅', text: 'First advisor contact is always FREE — no pack needed' },
];

const FAQ = [
  { q: 'Is the first contact free?', a: 'Yes — your very first advisor contact is always free, no pack needed.' },
  { q: "What if I don't use all 20?", a: 'Unused credits expire after 1 year. Refunds available within 7 days if no contact was unlocked.' },
  { q: 'Can I use 1 credit per advisor?', a: 'Exactly — 1 credit reveals one advisor. Mix and match any 20 advisors you like.' },
];

export const BuyPackScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invoice, setInvoice] = useState('');
  const [error, setError] = useState('');

  const handleDevActivate = async () => {
    setDevLoading(true);
    setError('');
    try {
      const r = await apiClient.post('/contacts/dev-activate');
      if (r.data?.success) {
        setInvoice(`DEV-${Date.now().toString().slice(-8)}`);
        setSuccess(true);
        qc.invalidateQueries({ queryKey: ['contact-credits'] });
        qc.invalidateQueries({ queryKey: ['contact-status'] });
      } else {
        setError(r.data?.message || 'Dev activation failed.');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Activation error. Please try again.');
    } finally {
      setDevLoading(false);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const od = await contactRepository.createOrder();
      if (!od.success) {
        setError(od.message || 'Could not create order. Please try again.');
        return;
      }
      showToast('info', 'Razorpay payment coming soon. Use Test Mode for now.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.successSafe} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />
        <ScrollView contentContainerStyle={styles.successContent}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Pack Activated!</Text>
          <Text style={styles.successSubtitle}>
            <Text style={{ fontWeight: '800', color: Colors.navy[800] }}>{CREDITS} contacts</Text>
            {' '}added to your account. Valid 1 year.
          </Text>

          <View style={styles.invoiceCard}>
            {[
              ['Invoice', invoice],
              ['Credits', `${CREDITS} contacts`],
              ['Validity', '1 Year'],
              ['Amount Paid', `₹${TOTAL.toFixed(2)}`],
            ].map(([k, v]) => (
              <View key={k} style={styles.invoiceRow}>
                <Text style={styles.invoiceKey}>{k}</Text>
                <Text style={styles.invoiceVal}>{v}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('ContactsUnlocked')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>👁️ Browse Advisors Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <BrokerSaabLogo size="sm" variant="light" />
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.discBadge}>
            <Text style={styles.discBadgeText}>⭐ {DISC}% Off — Limited Offer</Text>
          </View>
          <Text style={styles.pageTitle}>Contact Pack</Text>
          <Text style={styles.pageSubtitle}>
            Reveal direct phone & email of {CREDITS} verified advisors. Call them instantly.
          </Text>
        </View>

        {/* Pricing card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingHeader}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>🏆 Best Value</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.origPrice}>₹{ORIG}</Text>
              <Text style={styles.totalPrice}>₹{TOTAL.toFixed(2)}</Text>
            </View>
            <Text style={styles.priceMeta}>Incl. 18% GST · One-time payment</Text>
          </View>

          <View style={styles.pricingBody}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{CREDITS}</Text>
              <Text style={styles.heroStatLabel}>Advisor Contacts</Text>
              <Text style={styles.heroStatSub}>Valid for 12 months</Text>
            </View>

            <View style={styles.breakdown}>
              {[
                { label: 'Base Price',                        val: `₹${BASE}.00`,            color: Colors.slate[600] },
                { label: `Discount (${DISC}% off ₹${ORIG})`, val: `– ₹${ORIG - BASE}.00`,   color: Colors.emerald[600] },
                { label: 'CGST @ 9%',                        val: `₹${CGST.toFixed(2)}`,    color: Colors.slate[400] },
                { label: 'SGST @ 9%',                        val: `₹${SGST.toFixed(2)}`,    color: Colors.slate[400] },
              ].map((r) => (
                <View key={r.label} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: r.color }]}>{r.label}</Text>
                  <Text style={[styles.breakdownVal, { color: r.color }]}>{r.val}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalAmount}>₹{TOTAL.toFixed(2)}</Text>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* Pay button */}
            <TouchableOpacity
              style={[styles.payBtn, loading && styles.btnDisabled]}
              onPress={handlePay}
              disabled={loading || devLoading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.navy[800]} size="small" />
                : <Text style={styles.payBtnText}>💳 Pay ₹{TOTAL.toFixed(2)} Securely</Text>}
            </TouchableOpacity>

            {/* Dev mode test button */}
            <TouchableOpacity
              style={[styles.devBtn, devLoading && styles.btnDisabled]}
              onPress={handleDevActivate}
              disabled={loading || devLoading}
              activeOpacity={0.85}
            >
              {devLoading
                ? <ActivityIndicator color={Colors.indigo[600]} size="small" />
                : <Text style={styles.devBtnText}>🧪 Test Mode — Simulate Payment</Text>}
            </TouchableOpacity>

            {/* Trust badges */}
            <View style={styles.trustRow}>
              <Text style={styles.trustItem}>🔒 Encrypted</Text>
              <Text style={styles.trustDot}>·</Text>
              <Text style={styles.trustItem}>🛡️ Razorpay</Text>
              <Text style={styles.trustDot}>·</Text>
              <Text style={styles.trustItem}>↩️ Refundable</Text>
            </View>
          </View>
        </View>

        {/* What's included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT'S INCLUDED</Text>
          <View style={styles.featuresList}>
            {WHAT_YOU_GET.map((f) => (
              <View key={f.text} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>{f.icon}</Text>
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMON QUESTIONS</Text>
          <View style={styles.faqList}>
            {FAQ.map((item) => (
              <View key={item.q} style={styles.faqItem}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Text style={styles.faqA}>{item.a}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  body: { flex: 1, backgroundColor: Palette.background },

  navbar: {
    backgroundColor: Colors.navy[800],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: Spacing.lg,
  },
  backText: { fontSize: 14, color: Colors.navy[200], fontWeight: '500' },

  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.xl },

  // Header
  headerSection: { gap: Spacing.sm, alignItems: 'flex-start' },
  discBadge: {
    backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  discBadgeText: { fontSize: 11, color: Colors.gold[700], fontWeight: '700', letterSpacing: 0.5 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.navy[800], letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 14, color: Colors.slate[500], lineHeight: 20 },

  // Pricing card
  pricingCard: {
    borderRadius: Radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    ...Shadow.md, shadowColor: Colors.gold[500],
  },
  pricingHeader: {
    backgroundColor: Colors.navy[800],
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
  },
  bestValueBadge: {
    backgroundColor: 'rgba(212,175,55,0.2)', borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  bestValueText: { fontSize: 11, color: Colors.gold[500], fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  origPrice: { fontSize: 14, color: 'rgba(255,255,255,0.3)', textDecorationLine: 'line-through' },
  totalPrice: { fontSize: 32, fontWeight: '900', color: Colors.white },
  priceMeta: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  pricingBody: { backgroundColor: Colors.white, padding: Spacing.lg, gap: Spacing.md },

  heroStat: {
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 2,
  },
  heroStatNum: { fontSize: 40, fontWeight: '900', color: Colors.gold[700] },
  heroStatLabel: { fontSize: 14, fontWeight: '700', color: Colors.navy[800] },
  heroStatSub: { fontSize: 11, color: Colors.slate[500] },

  breakdown: { gap: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 12 },
  breakdownVal: { fontSize: 12, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 2, borderTopColor: Colors.slate[200], paddingTop: Spacing.sm, marginTop: 2,
  },
  totalLabel: { fontSize: 14, fontWeight: '800', color: Colors.navy[800] },
  totalAmount: { fontSize: 14, fontWeight: '900', color: Colors.gold[700] },

  errorBox: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  errorText: { fontSize: 13, color: '#DC2626' },

  payBtn: {
    backgroundColor: Colors.gold[500], borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
  },
  payBtnText: { fontSize: 16, fontWeight: '800', color: Colors.navy[900] },

  devBtn: {
    borderWidth: 1.5, borderColor: 'rgba(99,102,241,0.4)',
    borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  devBtnText: { fontSize: 13, fontWeight: '600', color: Colors.indigo[600] },

  btnDisabled: { opacity: 0.5 },

  trustRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  trustItem: { fontSize: 10, color: Colors.slate[400] },
  trustDot: { fontSize: 12, color: Colors.slate[300] },

  // What's included
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: Colors.gold[600],
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  featuresList: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.slate[200], overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.slate[100],
  },
  featureIcon: {
    width: 34, height: 34, borderRadius: Radius.md, backgroundColor: '#FFFBEB',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureIconText: { fontSize: 16 },
  featureText: { flex: 1, fontSize: 13, color: Colors.slate[600], lineHeight: 19 },

  // FAQ
  faqList: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.slate[200], padding: Spacing.md, gap: Spacing.md,
  },
  faqItem: { gap: 4, borderBottomWidth: 1, borderBottomColor: Colors.slate[100], paddingBottom: Spacing.md },
  faqQ: { fontSize: 13, fontWeight: '700', color: Colors.navy[800] },
  faqA: { fontSize: 12, color: Colors.slate[500], lineHeight: 18 },

  // Success screen
  successSafe: { flex: 1, backgroundColor: Palette.background },
  successContent: {
    flexGrow: 1, padding: Spacing.lg, paddingTop: Spacing.xxl,
    alignItems: 'center', gap: Spacing.lg,
  },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 2, borderColor: 'rgba(212,175,55,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  successEmoji: { fontSize: 36 },
  successTitle: { fontSize: 24, fontWeight: '900', color: Colors.navy[800] },
  successSubtitle: { fontSize: 14, color: Colors.slate[500], textAlign: 'center', lineHeight: 21 },

  invoiceCard: {
    width: '100%', backgroundColor: '#FFFBEB',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm,
  },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  invoiceKey: { fontSize: 13, color: Colors.slate[500] },
  invoiceVal: { fontSize: 13, fontWeight: '700', color: Colors.navy[800] },

  primaryBtn: {
    width: '100%', backgroundColor: Colors.navy[800], borderRadius: Radius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  primaryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  outlineBtn: {
    width: '100%', borderWidth: 1.5, borderColor: Colors.slate[200],
    borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center',
  },
  outlineBtnText: { fontSize: 14, color: Colors.slate[600], fontWeight: '600' },
});
