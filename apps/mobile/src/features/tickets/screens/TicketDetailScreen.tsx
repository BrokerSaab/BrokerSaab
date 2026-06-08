import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { ticketRepository, ServiceTicket, TicketStage } from '../../../shared/api';
import { useAuthStore } from '../../../shared/store/authStore';

type Props = { navigation: any; route: { params: { ticketId: string } } };

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#3B82F6', IN_PROGRESS: '#D97706', AWAITING_CONFIRM: '#7C3AED',
  DISPUTED: '#DC2626', CLOSED: '#6B7280', PAYOUT_RELEASED: '#059669',
};
const STAGE_COLOR: Record<string, string> = {
  PENDING: '#6B7280', IN_PROGRESS: '#D97706', AWAITING_CONFIRM: '#7C3AED', CONFIRMED: '#059669',
};

export const TicketDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { ticketId }  = route.params;
  const { user }      = useAuthStore();
  const isClient      = user?.role === 'CLIENT';
  const isAdvisor     = user?.role === 'ADVISOR';
  const qc            = useQueryClient();
  const scrollRef     = useRef<ScrollView>(null);

  const [comment,   setComment]   = useState('');
  const [stageTitle, setStageTitle] = useState('');
  const [stageDesc, setStageDesc] = useState('');
  const [showAddStage, setShowAddStage] = useState(false);
  const [closingComment, setClosingComment] = useState('');
  const [closeRating, setCloseRating] = useState(0);
  const [closeReview, setCloseReview] = useState('');
  const [showClose, setShowClose] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDispute, setShowDispute] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn:  () => ticketRepository.getById(ticketId),
    refetchInterval: 15000,
  });

  const ticket: ServiceTicket | undefined = data?.data;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ticket', ticketId] });
    qc.invalidateQueries({ queryKey: ['myTickets'] });
  };

  const { mutate: sendComment, isPending: sendingComment } = useMutation({
    mutationFn: (content: string) => ticketRepository.addComment(ticketId, content),
    onSuccess:  () => { setComment(''); invalidate(); },
  });

  const { mutate: addStage, isPending: addingStage } = useMutation({
    mutationFn: () => ticketRepository.addStage(ticketId, { title: stageTitle, description: stageDesc || undefined }),
    onSuccess:  () => { setStageTitle(''); setStageDesc(''); setShowAddStage(false); invalidate(); },
  });

  const { mutate: updateStage, isPending: updatingStage } = useMutation({
    mutationFn: ({ stageId, status }: { stageId: string; status: 'IN_PROGRESS' | 'AWAITING_CONFIRM'; comment?: string }) =>
      ticketRepository.updateStageStatus(ticketId, stageId, { status }),
    onSuccess: invalidate,
  });

  const { mutate: confirmStage, isPending: confirmingStage } = useMutation({
    mutationFn: (stageId: string) => ticketRepository.confirmStage(ticketId, stageId),
    onSuccess:  invalidate,
  });

  const { mutate: closeTicket, isPending: closing } = useMutation({
    mutationFn: () => ticketRepository.closeTicket(ticketId, {
      closingComment, userRating: closeRating, userReview: closeReview || undefined,
    }),
    onSuccess: () => { setShowClose(false); invalidate(); },
  });

  const { mutate: raiseDispute, isPending: disputing } = useMutation({
    mutationFn: () => ticketRepository.raiseDispute(ticketId, disputeReason),
    onSuccess: () => { setShowDispute(false); setDisputeReason(''); invalidate(); },
  });

  if (isLoading || !ticket) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator color={Palette.primary} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const isClosed   = ticket.status === 'CLOSED' || ticket.status === 'PAYOUT_RELEASED';
  const statusColor = STATUS_COLOR[ticket.status] ?? '#6B7280';
  const confirmed   = ticket.stages.filter(st => st.status === 'CONFIRMED').length;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.ticketNum}>{ticket.ticketNumber}</Text>
          <Text style={s.partnerName}>
            {isClient ? ticket.advisor.fullName : ticket.client.fullName}
          </Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
          <Text style={[s.statusTxt, { color: statusColor }]}>{ticket.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={s.scrollContent}>

          {/* Escrow card */}
          <View style={s.escrowCard}>
            <Text style={s.escrowLabel}>Escrow Amount</Text>
            <Text style={s.escrowAmt}>₹{Number(ticket.totalAmount).toLocaleString('en-IN')}</Text>
            <Text style={s.escrowSub}>
              {isClosed ? '✓ Released to advisor' : '🔒 Held securely by BrokerSaab'}
            </Text>
            {ticket.stages.length > 0 && (
              <Text style={s.escrowStages}>{confirmed}/{ticket.stages.length} stages confirmed</Text>
            )}
          </View>

          {/* Closed/payout banner */}
          {isClosed && (
            <View style={[s.infoBanner, { borderColor: '#05966930', backgroundColor: '#05966910' }]}>
              <Text style={s.infoBannerTxt}>✅ Work completed. ₹{Number(ticket.netAmount).toLocaleString('en-IN')} released to advisor.</Text>
              {ticket.closingComment && <Text style={s.closingComment}>"{ticket.closingComment}"</Text>}
              {(ticket.userRating ?? 0) > 0 && (
                <Text style={s.rating}>{'⭐'.repeat(ticket.userRating!)} {ticket.userRating}/5</Text>
              )}
            </View>
          )}

          {/* ── STAGES ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Work Stages</Text>
              {isAdvisor && !isClosed && (
                <TouchableOpacity onPress={() => setShowAddStage(v => !v)} style={s.addBtn}>
                  <Text style={s.addBtnTxt}>+ Add Stage</Text>
                </TouchableOpacity>
              )}
            </View>

            {showAddStage && isAdvisor && (
              <View style={s.addStageForm}>
                <TextInput
                  style={s.input}
                  placeholder="Stage title…"
                  placeholderTextColor={Palette.textSecondary}
                  value={stageTitle}
                  onChangeText={setStageTitle}
                />
                <TextInput
                  style={[s.input, { height: 72, textAlignVertical: 'top' }]}
                  placeholder="Description (optional)"
                  placeholderTextColor={Palette.textSecondary}
                  multiline
                  value={stageDesc}
                  onChangeText={setStageDesc}
                />
                <View style={s.rowGap}>
                  <TouchableOpacity style={[s.btn, s.btnOutline, { flex: 1 }]} onPress={() => setShowAddStage(false)}>
                    <Text style={s.btnOutlineTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.btn, s.btnPrimary, { flex: 2 }]}
                    onPress={() => addStage()}
                    disabled={addingStage || !stageTitle.trim()}>
                    {addingStage ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnPrimaryTxt}>Add Stage</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {ticket.stages.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>{isAdvisor ? 'Add stages to track your work' : 'Waiting for advisor to add stages'}</Text>
              </View>
            ) : ticket.stages.map((st, idx) => {
              const sc = STAGE_COLOR[st.status] ?? '#6B7280';
              const isAwait = st.status === 'AWAITING_CONFIRM';
              return (
                <View key={st.id} style={[s.stageCard, isAwait && s.stageCardAlert]}>
                  <View style={s.stageRow}>
                    <View style={[s.stageNum, { backgroundColor: st.status === 'CONFIRMED' ? '#059669' : isAwait ? '#7C3AED' : '#374151' }]}>
                      <Text style={s.stageNumTxt}>{idx + 1}</Text>
                    </View>
                    <View style={s.flex1}>
                      <Text style={s.stageTitle}>{st.title}</Text>
                      {st.description ? <Text style={s.stageMeta}>{st.description}</Text> : null}
                      <View style={[s.stageBadge, { backgroundColor: sc + '15', borderColor: sc + '40' }]}>
                        <Text style={[s.stageBadgeTxt, { color: sc }]}>{st.status.replace('_', ' ')}</Text>
                      </View>
                      {st.advisorComment ? (
                        <Text style={s.advisorComment}>Advisor: {st.advisorComment}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Advisor stage actions */}
                  {isAdvisor && !isClosed && st.status !== 'CONFIRMED' && (
                    <View style={[s.rowGap, { marginTop: Spacing.sm }]}>
                      {st.status === 'PENDING' && (
                        <TouchableOpacity style={[s.btn, s.btnAmber, { flex: 1 }]}
                          onPress={() => updateStage({ stageId: st.id, status: 'IN_PROGRESS' })} disabled={updatingStage}>
                          {updatingStage ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnAmberTxt}>Start</Text>}
                        </TouchableOpacity>
                      )}
                      {(st.status === 'IN_PROGRESS' || st.status === 'PENDING') && (
                        <TouchableOpacity style={[s.btn, s.btnPurple, { flex: 2 }]}
                          onPress={() => {
                            Alert.alert('Request Confirmation', 'Ask client to confirm this stage is done?', [
                              { text: 'Cancel' },
                              { text: 'Yes', onPress: () => updateStage({ stageId: st.id, status: 'AWAITING_CONFIRM' }) },
                            ]);
                          }} disabled={updatingStage}>
                          <Text style={s.btnPurpleTxt}>Done — Request Confirm</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Client confirmation */}
                  {isClient && isAwait && (
                    <View style={{ marginTop: Spacing.sm }}>
                      <View style={s.awaitBanner}>
                        <Text style={s.awaitTxt}>Advisor marked this stage done. Please confirm to proceed.</Text>
                      </View>
                      <TouchableOpacity style={[s.btn, s.btnGreen]}
                        onPress={() => confirmStage(st.id)} disabled={confirmingStage}>
                        {confirmingStage ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnGreenTxt}>✓ Confirm Stage</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* ── COMMENTS ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Activity & Comments</Text>
            {ticket.comments.length === 0 ? (
              <View style={s.empty}><Text style={s.emptyTxt}>No comments yet</Text></View>
            ) : ticket.comments.map(c => {
              const isMe = (isClient && c.authorRole === 'CLIENT') || (isAdvisor && c.authorRole === 'ADVISOR');
              return (
                <View key={c.id} style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                  <Text style={[s.bubbleAuthor, isMe && { color: '#818cf8' }]}>
                    {isMe ? 'You' : c.authorName} · {c.authorRole}
                  </Text>
                  <Text style={s.bubbleTxt}>{c.content}</Text>
                  <Text style={s.bubbleTime}>{new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              );
            })}

            {!isClosed && (
              <View style={s.commentRow}>
                <TextInput
                  style={s.commentInput}
                  placeholder="Add a comment…"
                  placeholderTextColor={Palette.textSecondary}
                  value={comment}
                  onChangeText={setComment}
                  onSubmitEditing={() => { if (comment.trim()) sendComment(comment.trim()); }}
                  returnKeyType="send"
                />
                <TouchableOpacity style={s.sendBtn} onPress={() => sendComment(comment.trim())} disabled={sendingComment || !comment.trim()}>
                  {sendingComment ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.sendTxt}>→</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── CLIENT ACTIONS ── */}
          {isClient && !isClosed && !showClose && !showDispute && (
            <View style={[s.rowGap, { padding: Spacing.md }]}>
              <TouchableOpacity style={[s.btn, s.btnOutline, { flex: 1 }]} onPress={() => setShowDispute(true)}>
                <Text style={[s.btnOutlineTxt, { color: '#DC2626' }]}>⚠ Dispute</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnGreen, { flex: 2 }]} onPress={() => setShowClose(true)}>
                <Text style={s.btnGreenTxt}>Close & Release Payment</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Close form */}
          {showClose && isClient && (
            <View style={s.closeForm}>
              <Text style={s.closeTitle}>Close Ticket & Release ₹{Number(ticket.netAmount).toLocaleString('en-IN')}</Text>
              <Text style={s.closeSub}>This will release payment to the advisor. Cannot be undone.</Text>
              <Text style={s.label}>Your Rating</Text>
              <View style={s.stars}>
                {[1,2,3,4,5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setCloseRating(n)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 28, opacity: n <= closeRating ? 1 : 0.25 }}>⭐</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[s.input, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Closing comment (required)"
                placeholderTextColor={Palette.textSecondary}
                multiline value={closingComment} onChangeText={setClosingComment}
              />
              <TextInput
                style={[s.input, { height: 72, textAlignVertical: 'top' }]}
                placeholder="Public review (optional)"
                placeholderTextColor={Palette.textSecondary}
                multiline value={closeReview} onChangeText={setCloseReview}
              />
              <View style={s.rowGap}>
                <TouchableOpacity style={[s.btn, s.btnOutline, { flex: 1 }]} onPress={() => setShowClose(false)}>
                  <Text style={s.btnOutlineTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.btnGreen, { flex: 2 }]}
                  onPress={() => closeTicket()} disabled={closing || !closingComment.trim() || closeRating === 0}>
                  {closing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnGreenTxt}>Confirm & Release</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Dispute form */}
          {showDispute && isClient && (
            <View style={s.disputeForm}>
              <Text style={s.closeTitle}>Raise a Dispute</Text>
              <Text style={s.closeSub}>Our team will review and hold payment until resolved.</Text>
              <TextInput
                style={[s.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe the issue…"
                placeholderTextColor={Palette.textSecondary}
                multiline value={disputeReason} onChangeText={setDisputeReason}
              />
              <View style={s.rowGap}>
                <TouchableOpacity style={[s.btn, s.btnOutline, { flex: 1 }]} onPress={() => setShowDispute(false)}>
                  <Text style={s.btnOutlineTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, { backgroundColor: '#DC2626', flex: 2 }]}
                  onPress={() => raiseDispute()} disabled={disputing}>
                  {disputing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnGreenTxt}>Submit Dispute</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Advisor: awaiting banner */}
          {isAdvisor && ticket.status === 'AWAITING_CONFIRM' && (
            <View style={[s.infoBanner, { borderColor: '#7C3AED30', backgroundColor: '#7C3AED10' }]}>
              <Text style={[s.infoBannerTxt, { color: '#7C3AED' }]}>
                ⏳ Waiting for client to confirm a stage. You'll be notified when done.
              </Text>
            </View>
          )}

          {/* Advisor: payout released */}
          {isAdvisor && isClosed && (
            <View style={[s.infoBanner, { borderColor: '#05966930', backgroundColor: '#05966910' }]}>
              <Text style={s.infoBannerTxt}>✅ Payment of ₹{Number(ticket.netAmount).toLocaleString('en-IN')} has been credited to your wallet.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Palette.background },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Palette.border, backgroundColor: Palette.surface },
  backBtn:       { marginRight: Spacing.sm },
  backTxt:       { fontSize: 20, color: Palette.text },
  headerMid:     { flex: 1, marginRight: Spacing.sm },
  ticketNum:     { fontSize: 10, color: Palette.textSecondary, fontFamily: 'monospace' },
  partnerName:   { ...Typography.body, color: Palette.text, fontWeight: '700', marginTop: 1 },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
  statusTxt:     { fontSize: 9, fontWeight: '700' },
  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  escrowCard:    { backgroundColor: '#0B1F3A', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)' },
  escrowLabel:   { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  escrowAmt:     { color: '#D4AF37', fontSize: 28, fontWeight: '900', marginTop: 4, fontVariant: ['tabular-nums'] },
  escrowSub:     { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  escrowStages:  { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },
  section:       { backgroundColor: Palette.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Palette.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle:  { ...Typography.subheading, color: Palette.text },
  addBtn:        { backgroundColor: Palette.primary + '20', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Palette.primary + '40' },
  addBtnTxt:     { color: Palette.primary, fontSize: 12, fontWeight: '700' },
  addStageForm:  { gap: Spacing.sm, marginBottom: Spacing.sm },
  input:         { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.sm, padding: Spacing.sm, color: Palette.text, fontSize: 13, backgroundColor: Palette.background },
  stageCard:     { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm, backgroundColor: Palette.background },
  stageCardAlert:{ borderColor: '#7C3AED', backgroundColor: '#7C3AED08' },
  stageRow:      { flexDirection: 'row', gap: Spacing.sm },
  stageNum:      { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stageNumTxt:   { color: '#fff', fontSize: 11, fontWeight: '900' },
  flex1:         { flex: 1 },
  stageTitle:    { ...Typography.body, color: Palette.text, fontWeight: '700' },
  stageMeta:     { ...Typography.caption, color: Palette.textSecondary, marginTop: 2 },
  stageBadge:    { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1, marginTop: 4 },
  stageBadgeTxt: { fontSize: 9, fontWeight: '700' },
  advisorComment:{ fontSize: 11, color: '#818cf8', marginTop: 4, fontStyle: 'italic' },
  awaitBanner:   { backgroundColor: '#7C3AED15', borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  awaitTxt:      { color: '#7C3AED', fontSize: 11, fontWeight: '600' },
  empty:         { alignItems: 'center', padding: Spacing.lg },
  emptyTxt:      { ...Typography.caption, color: Palette.textSecondary },
  bubble:        { maxWidth: '80%', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.xs },
  bubbleMe:      { alignSelf: 'flex-end', backgroundColor: '#4F46E530', borderWidth: 1, borderColor: '#4F46E540' },
  bubbleThem:    { alignSelf: 'flex-start', backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  bubbleAuthor:  { fontSize: 9, color: Palette.textSecondary, fontWeight: '600', marginBottom: 2 },
  bubbleTxt:     { fontSize: 13, color: Palette.text, lineHeight: 18 },
  bubbleTime:    { fontSize: 9, color: Palette.textSecondary, marginTop: 2, textAlign: 'right' },
  commentRow:    { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm },
  commentInput:  { flex: 1, borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.sm, padding: Spacing.sm, color: Palette.text, fontSize: 13 },
  sendBtn:       { width: 44, height: 44, backgroundColor: Palette.primary, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  sendTxt:       { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeForm:     { backgroundColor: '#05966910', borderWidth: 1, borderColor: '#05966930', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  disputeForm:   { backgroundColor: '#DC262610', borderWidth: 1, borderColor: '#DC262630', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  closeTitle:    { ...Typography.subheading, color: Palette.text, fontWeight: '800' },
  closeSub:      { ...Typography.caption, color: Palette.textSecondary },
  label:         { ...Typography.caption, color: Palette.textSecondary, fontWeight: '600' },
  stars:         { flexDirection: 'row', gap: 2 },
  closingComment:{ ...Typography.caption, color: Palette.textSecondary, fontStyle: 'italic', marginTop: 4 },
  rating:        { fontSize: 13, marginTop: 4 },
  infoBanner:    { borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, marginVertical: Spacing.xs },
  infoBannerTxt: { fontSize: 13, color: '#059669', fontWeight: '600', lineHeight: 18 },
  rowGap:        { flexDirection: 'row', gap: Spacing.sm },
  btn:           { borderRadius: Radius.sm, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  btnOutline:    { borderWidth: 1, borderColor: Palette.border },
  btnOutlineTxt: { color: Palette.text, fontSize: 13, fontWeight: '700' },
  btnPrimary:    { backgroundColor: Palette.primary },
  btnPrimaryTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnGreen:      { backgroundColor: '#059669' },
  btnGreenTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnAmber:      { backgroundColor: '#D97706' },
  btnAmberTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnPurple:     { backgroundColor: '#7C3AED' },
  btnPurpleTxt:  { color: '#fff', fontSize: 13, fontWeight: '700' },
});
