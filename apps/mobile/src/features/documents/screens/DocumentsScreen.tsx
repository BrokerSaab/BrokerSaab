import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { DocumentsStackParamList } from '../../../shared/navigation/types';
import { Colors, Palette, Spacing, Radius, Shadow } from '../../../shared/theme';
import { useAuthStore } from '../../../shared/store';
import { Avatar } from '../../../shared/components';
import { ticketRepository } from '../../../shared/api/repositories/ticketRepository';

type Props = NativeStackScreenProps<DocumentsStackParamList, 'DocumentsScreen'>;

// Document types that advisors typically request in education/visa consulting
const REQUIRED_DOC_TYPES = [
  { key: 'passport',     label: 'Passport',           labelHindi: 'पासपोर्ट',    icon: '📋', category: 'Passport' },
  { key: 'ielts',        label: 'IELTS / TOEFL',      labelHindi: 'स्कोरकार्ड',  icon: '🎓', category: 'Scorecards' },
  { key: 'transcripts',  label: 'Academic Transcripts',labelHindi: 'ट्रांसक्रिप्ट',icon: '📚', category: 'Scorecards' },
  { key: 'sop',          label: 'Statement of Purpose',labelHindi: 'एसओपी',       icon: '✍️', category: 'SOP' },
  { key: 'bank',         label: 'Bank Statement',      labelHindi: 'बैंक स्टेटमेंट',icon: '🏦', category: 'Financial' },
  { key: 'photo',        label: 'Passport Size Photo', labelHindi: 'फोटो',         icon: '🖼️', category: 'Passport' },
];

const FILTERS = ['All', 'Passport', 'Scorecards', 'SOP', 'Financial'];

export const DocumentsScreen: React.FC<Props> = () => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Fetch tickets to derive which documents are linked to active cases
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets-docs'],
    queryFn: () => ticketRepository.list(),
    staleTime: 2 * 60 * 1000,
  });

  const tickets = ticketsData?.data ?? [];
  const hasActiveCases = tickets.some((t) =>
    t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'AWAITING_CONFIRM',
  );

  // Build required document list: all standard types, mark as "linked" if case exists
  const documents = REQUIRED_DOC_TYPES.map((doc) => ({
    ...doc,
    status: hasActiveCases ? ('required' as const) : ('info' as const),
  }));

  const filtered = documents.filter((d) => {
    const matchFilter = activeFilter === 'All' || d.category === activeFilter;
    const matchSearch = search === '' || d.label.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleUpload = async (docType: string, docLabel: string) => {
    Alert.alert(
      `Upload ${docLabel}`,
      'Choose a file to upload (PDF, JPG, PNG — Max 5MB)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select File',
          onPress: async () => {
            // In a real app you'd use expo-document-picker or expo-image-picker here
            // For now we show a placeholder confirmation
            Alert.alert(
              'Upload',
              'Please use expo-document-picker to select your file. This flow is ready to connect — install expo-document-picker and replace this alert.',
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navBrand}>
          <Text style={styles.navIcon}>🏛️</Text>
          <Text style={styles.navTextBroker}>Broker</Text>
          <Text style={styles.navTextSaab}>Saab</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
          <Avatar uri={user?.avatarUrl} fallbackName={user?.fullName} size={36} showBorder />
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Case banner */}
        {tickets.length > 0 && (
          <View style={styles.caseBanner}>
            <Text style={styles.caseBannerIcon}>💼</Text>
            <View style={styles.caseBannerText}>
              <Text style={styles.caseBannerTitle}>
                {tickets.length} active {tickets.length === 1 ? 'case' : 'cases'}
              </Text>
              <Text style={styles.caseBannerSub}>
                Documents below are required for your ongoing cases.
              </Text>
            </View>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents... / दस्तावेज़ खोजें..."
            placeholderTextColor={Colors.slate[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f === 'All' ? 'All / सभी' : f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color={Colors.navy[800]} style={{ marginTop: Spacing.lg }} />
        ) : (
          <View style={styles.docList}>
            {filtered.map((doc) => (
              <View key={doc.key} style={styles.docCard}>
                <View style={styles.docRow}>
                  <View style={styles.docIconWrap}>
                    <Text style={styles.docIcon}>{doc.icon}</Text>
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>{doc.label}</Text>
                    <Text style={styles.docTitleHindi}>{doc.labelHindi}</Text>
                    {hasActiveCases && (
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(239,68,68,0.1)', marginTop: 4 }]}>
                        <Text style={[styles.statusText, { color: Colors.red[500] }]}>
                          Required / आवश्यक
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => handleUpload(doc.key, doc.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.uploadBtnText}>Upload</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Case-linked documents info */}
        {tickets.length > 0 && (
          <View style={styles.caseDocsInfo}>
            <Text style={styles.caseDocsTitle}>📁 Case-Linked Documents</Text>
            <Text style={styles.caseDocsSub}>
              Documents shared by your advisor or uploaded within a work ticket are accessible through the My Cases tab.
            </Text>
            <View style={styles.caseDocsList}>
              {tickets.slice(0, 3).map((ticket) => (
                <View key={ticket.id} style={styles.caseDocItem}>
                  <Text style={styles.caseDocIcon}>🎫</Text>
                  <View>
                    <Text style={styles.caseDocTitle}>
                      {ticket.advisor.fullName} · #{ticket.ticketNumber}
                    </Text>
                    <Text style={styles.caseDocMeta}>
                      {ticket.comments.length} messages · {ticket.stages.length} stages
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Upload section */}
        <TouchableOpacity
          style={styles.uploadCard}
          activeOpacity={0.8}
          onPress={() => handleUpload('general', 'Document')}
        >
          <Text style={styles.uploadMainIcon}>☁️</Text>
          <Text style={styles.uploadTitle}>Tap to upload documents</Text>
          <Text style={styles.uploadTitleHindi}>दस्तावेज़ अपलोड करने के लिए टैप करें</Text>
          <Text style={styles.uploadHint}>Supports PDF, JPG, PNG (Max 5MB)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  body: { flex: 1, backgroundColor: Palette.background },
  container: { paddingBottom: Spacing.xxl },

  navbar: {
    backgroundColor: Colors.navy[800],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navIcon: { fontSize: 22 },
  navTextBroker: { fontSize: 20, fontWeight: '900', color: Colors.white },
  navTextSaab: { fontSize: 20, fontWeight: '900', color: Colors.gold[400] },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bellBtn: { padding: 4 },
  bellIcon: { fontSize: 22 },

  caseBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1, borderColor: Colors.indigo[300],
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    padding: Spacing.md,
  },
  caseBannerIcon: { fontSize: 22 },
  caseBannerText: { flex: 1, gap: 2 },
  caseBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.indigo[700] },
  caseBannerSub: { fontSize: 12, color: Colors.indigo[600], lineHeight: 16 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.slate[200],
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    gap: Spacing.sm, ...Shadow.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.navy[800] },

  filterRow: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.slate[200],
  },
  filterChipActive: { backgroundColor: Colors.navy[800], borderColor: Colors.navy[800] },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.slate[600] },
  filterTextActive: { color: Colors.white },

  docList: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  docCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.slate[200], borderLeftWidth: 4,
    borderLeftColor: Colors.gold[400], overflow: 'hidden', ...Shadow.sm,
  },
  docRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.md, alignItems: 'center' },
  docIconWrap: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.slate[100], alignItems: 'center', justifyContent: 'center',
  },
  docIcon: { fontSize: 20 },
  docInfo: { flex: 1, gap: 2 },
  docTitle: { fontSize: 14, fontWeight: '700', color: Colors.navy[800] },
  docTitleHindi: { fontSize: 11, color: Colors.slate[500] },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  uploadBtn: {
    backgroundColor: Colors.navy[800], borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  uploadBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },

  caseDocsInfo: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md, ...Shadow.sm,
  },
  caseDocsTitle: { fontSize: 15, fontWeight: '800', color: Colors.navy[800] },
  caseDocsSub: { fontSize: 12, color: Colors.slate[500], lineHeight: 18 },
  caseDocsList: { gap: Spacing.sm },
  caseDocItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.slate[100],
  },
  caseDocIcon: { fontSize: 18 },
  caseDocTitle: { fontSize: 13, fontWeight: '700', color: Colors.navy[800] },
  caseDocMeta: { fontSize: 11, color: Colors.slate[500] },

  uploadCard: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    borderWidth: 1.5, borderColor: Colors.indigo[300], borderStyle: 'dashed',
    borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(99,102,241,0.03)',
  },
  uploadMainIcon: { fontSize: 36 },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: Colors.navy[800] },
  uploadTitleHindi: { fontSize: 13, color: Colors.slate[500] },
  uploadHint: { fontSize: 11, color: Colors.slate[400] },
});
