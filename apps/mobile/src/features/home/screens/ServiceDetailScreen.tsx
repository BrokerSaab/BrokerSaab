import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { Button } from '../../../shared/components';

type Props = NativeStackScreenProps<HomeStackParamList, 'ServiceDetail'>;

// Sub-services per module slug
const SUB_SERVICES: Record<string, string[]> = {
  m1: ['Birth Certificate', 'Death Certificate', 'Marriage Certificate', 'Marriage Registration', 'Divorce Certificate'],
  m2: ['Aadhaar Card', 'PAN Card', 'Voter ID', 'Ration Card', 'Driving License'],
  m3: ['Income Certificate', 'Caste Certificate', 'Domicile Certificate', 'Residence Certificate', 'OBC Certificate'],
  m4: ['Land Registration', 'Property Mutation', 'Encumbrance Certificate', 'Property Tax', 'Sale Deed'],
  m5: ['Income Tax Return', 'GST Registration', 'GST Filing', 'TDS Return', 'Tax Advisory'],
  m6: ['Pvt Ltd Company', 'LLP Registration', 'Sole Proprietorship', 'Partnership Deed', 'MSME Registration'],
  m7: ['Trademark Registration', 'Copyright', 'Patent Filing', 'Logo Protection', 'IP Advisory'],
  m8: ['Home Loan', 'Personal Loan', 'Business Loan', 'Credit Score', 'Loan Settlement'],
  m9: ['Life Insurance', 'Health Insurance', 'Vehicle Insurance', 'Term Plan', 'Claim Assistance'],
  m10: ['RC Transfer', 'NOC', 'Fitness Certificate', 'Driving License Renewal', 'Hypothecation Removal'],
  m11: ['Civil Court', 'Consumer Forum', 'High Court', 'Family Court', 'Legal Notice'],
  m12: ['EPF Withdrawal', 'ESIC', 'Labour Dispute', 'Salary Certificate', 'PF Transfer'],
  m13: ['School TC', 'Migration Certificate', 'Scholarship', 'Degree Certificate', 'Marksheet Verification'],
  m14: ['Old Age Pension', 'Widow Pension', 'PM Awas Yojana', 'Ayushman Bharat', 'Govt Scheme Enrollment'],
  m15: ['Mutual Funds', 'FD Advisory', 'SIP Planning', 'Portfolio Review', 'Retirement Planning'],
  m16: ['Passport Application', 'Visa Assistance', 'OCI Card', 'Travel Insurance', 'Embassy Documents'],
  m17: ['New Connection', 'Bill Dispute', 'Name Transfer', 'Load Enhancement', 'Meter Complaint'],
  m18: ['Kisan Credit Card', 'PM Kisan', 'Soil Testing', 'Crop Insurance', 'Agri Subsidy'],
  m19: ['Form Filling', 'Document Scanning', 'Notary', 'Affidavit', 'Apostille'],
  m20: ['PM Awas', 'Ujjwala Yojana', 'Jan Dhan', 'Sukanya Samriddhi', 'Atal Pension'],
  m21: ['University Application', 'SOP Writing', 'Scholarship Search', 'Visa Counseling', 'Test Prep'],
  m22: ['NEET Counseling', 'JEE Advisory', 'Management Admission', 'Medical Seat', 'Engineering College'],
  m23: ['Resume Writing', 'Interview Prep', 'Job Portal', 'Campus Placement', 'Career Counseling'],
  m24: ['PR Application', 'Spouse Visa', 'Work Permit', 'Student Visa', 'Dependent Visa'],
  m25: ['Custom Service', 'Document Assistance', 'Translation', 'Affidavit', 'Other'],
  m26: ['Domestic Tour', 'International Tour', 'Honeymoon Package', 'Hotel Booking', 'Pilgrimage'],
  m27: ['Doctor Visits', 'Sample Distribution', 'Product Detailing', 'Hospital Coverage', 'Pharma Marketing'],
  m28: ['FMCG Distribution', 'Pharma Distributors', 'Agri Distributors', 'Wholesale Stockist', 'Last Mile Delivery'],
};

const MODULE_ICONS: Record<string, string> = {
  m1: '📜', m2: '🪪', m3: '📋', m4: '🏠', m5: '🧾', m6: '🏢', m7: '™️', m8: '🏦',
  m9: '🛡️', m10: '🚗', m11: '⚖️', m12: '👷', m13: '🎓', m14: '👴', m15: '💰',
  m16: '✈️', m17: '⚡', m18: '🌾', m19: '💻', m20: '🏛️', m21: '🌍', m22: '📚',
  m23: '💼', m24: '🛂', m25: '✨', m26: '🗺️', m27: '🩺', m28: '📦',
};

export const ServiceDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { moduleId, moduleName } = route.params;
  const subServices = SUB_SERVICES[moduleId] ?? [];
  const icon = MODULE_ICONS[moduleId] ?? '📋';

  const handleFindAdvisors = (sub?: string) => {
    // Navigate to advisor list in the parent TabNavigator — use navigate to advisors tab
    // Since we're in Home stack, we navigate up then to advisors
    // We'll use the root navigation via casting
    navigation.navigate('AdvisorList', { category: moduleId, subService: sub });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Module header */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>{icon}</Text>
          <Text style={styles.heroTitle}>{moduleName}</Text>
          <Text style={styles.heroSub}>
            Browse verified advisors who specialise in this area
          </Text>
        </View>

        <Button
          label={`Find All ${moduleName} Advisors`}
          onPress={() => handleFindAdvisors()}
          variant="primary"
          fullWidth
          size="lg"
        />

        {subServices.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>SPECIFIC SERVICES</Text>
            <View style={styles.subList}>
              {subServices.map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={styles.subItem}
                  activeOpacity={0.75}
                  onPress={() => handleFindAdvisors(sub)}
                >
                  <Text style={styles.subText}>{sub}</Text>
                  <Text style={styles.subArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },

  hero: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  heroIcon: { fontSize: 52 },
  heroTitle: { ...Typography.heading, textAlign: 'center' },
  heroSub: { ...Typography.caption, textAlign: 'center', lineHeight: 20 },

  sectionTitle: { ...Typography.label },
  subList: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  subItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  subText: { ...Typography.body },
  subArrow: { color: Palette.textSecondary, fontSize: 16 },
});
