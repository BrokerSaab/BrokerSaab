import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Colors, Palette, Spacing, Radius } from '../../../shared/theme';
import { useAuthStore, useSocketStore } from '../../../shared/store';
import { Avatar } from '../../../shared/components';
import { formatRelative } from '../../../shared/utils/format';
import type { ChatMessage } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<BookingsStackParamList, 'Chat'>;

interface EnrichedMessage extends ChatMessage {
  documentCard?: { icon: string; label: string; title: string };
}

export const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId, otherName } = route.params;
  const { user } = useAuthStore();
  const { socket, joinRoom, sendMessage } = useSocketStore();
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    joinRoom(bookingId);

    const handleMessage = (msg: EnrichedMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleTyping = () => {
      setIsTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 2000);
    };

    socket?.on('new-message', handleMessage);
    socket?.on('typing', handleTyping);
    return () => {
      socket?.off('new-message', handleMessage);
      socket?.off('typing', handleTyping);
    };
  }, [bookingId, socket, joinRoom]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    sendMessage(bookingId, input.trim(), user.id);
    setInput('');
  };

  const advisorName = otherName ?? 'Your Consultant';
  const advisorRole = 'Senior Visa Consultant';
  const advisorInitials = advisorName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Avatar fallbackName={advisorName} size={40} showBorder />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{advisorName}</Text>
          <Text style={styles.headerRole}>{advisorRole}</Text>
        </View>

        <TouchableOpacity style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          style={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.dateSeparator}>
                <Text style={styles.dateText}>Start your conversation</Text>
              </View>
            </View>
          }
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingWrap}>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingDots}>• • •</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
                {!isMine && (
                  <Avatar fallbackName={advisorName} size={28} />
                )}
                <View style={styles.bubbleColumn}>
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
                      {item.content}
                    </Text>
                    {/* Embedded document card if present */}
                    {(item as EnrichedMessage).documentCard ? (
                      <View style={styles.docCard}>
                        <Text style={styles.docCardIcon}>{(item as EnrichedMessage).documentCard!.icon}</Text>
                        <View>
                          <Text style={styles.docCardLabel}>{(item as EnrichedMessage).documentCard!.label}</Text>
                          <Text style={styles.docCardTitle}>{(item as EnrichedMessage).documentCard!.title}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeRight]}>
                    {formatRelative(item.createdAt)}
                    {isMine && <Text style={styles.readTick}> ✓✓</Text>}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>🎙️</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.slate[400]}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>📎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy[800],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: Colors.white, fontWeight: '300' },
  headerInfo: { flex: 1, gap: 2 },
  headerName: { fontSize: 15, fontWeight: '700', color: Colors.white },
  headerRole: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  menuBtn: { padding: 4 },
  menuIcon: { fontSize: 22, color: Colors.white, fontWeight: '700' },

  // Messages
  messageList: { flex: 1, backgroundColor: Colors.slate[50] },
  list: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },

  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: Spacing.xl },
  dateSeparator: {
    backgroundColor: Colors.slate[200],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  dateText: { fontSize: 11, color: Colors.slate[600], fontWeight: '500' },

  typingWrap: { paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.slate[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  typingDots: { fontSize: 18, color: Colors.slate[400], letterSpacing: 4 },

  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, maxWidth: '85%' },
  bubbleWrapLeft: { alignSelf: 'flex-start' },
  bubbleWrapRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubbleColumn: { gap: 3 },

  bubble: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  bubbleMine: {
    backgroundColor: Colors.navy[800],
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.slate[200],
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: Colors.white },
  bubbleTextOther: { color: Colors.navy[800] },
  bubbleTime: { fontSize: 10, color: Colors.slate[400] },
  bubbleTimeRight: { textAlign: 'right' },
  readTick: { color: Colors.indigo[400] },

  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.slate[200],
    marginTop: 4,
  },
  docCardIcon: { fontSize: 22 },
  docCardLabel: { fontSize: 10, fontWeight: '700', color: Colors.slate[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  docCardTitle: { fontSize: 12, fontWeight: '600', color: Colors.navy[800] },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.slate[200],
    backgroundColor: Colors.white,
  },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 20 },
  textInput: {
    flex: 1,
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.slate[200],
    color: Colors.navy[800],
    fontSize: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.navy[800],
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.slate[300] },
  sendIcon: { color: Colors.white, fontSize: 20, fontWeight: '700' },
});
