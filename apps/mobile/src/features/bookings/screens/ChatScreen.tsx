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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { useAuthStore, useSocketStore } from '../../../shared/store';
import { formatRelative } from '../../../shared/utils/format';
import type { ChatMessage } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<BookingsStackParamList, 'Chat'>;

export const ChatScreen: React.FC<Props> = ({ route }) => {
  const { bookingId } = route.params;
  const { user } = useAuthStore();
  const { socket, joinRoom, sendMessage } = useSocketStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    joinRoom(bookingId);

    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    };

    socket?.on('new-message', handleMessage);
    return () => {
      socket?.off('new-message', handleMessage);
    };
  }, [bookingId, socket, joinRoom]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    sendMessage(bookingId, input.trim(), user.id);
    setInput('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id;
            return (
              <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : null]}>
                  {item.content}
                </Text>
                <Text style={styles.bubbleTime}>{formatRelative(item.createdAt)}</Text>
              </View>
            );
          }}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Palette.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={!input.trim()}>
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1 },
  list: { padding: Spacing.md, gap: Spacing.sm },
  empty: { flex: 1, alignItems: 'center', paddingTop: Spacing.xl },
  emptyText: { ...Typography.caption },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: 2,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: Palette.primaryLight,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { ...Typography.body, lineHeight: 20 },
  bubbleTextMine: { color: Palette.text },
  bubbleTime: { fontSize: 10, color: Palette.textMuted, alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    backgroundColor: Palette.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: Palette.inputBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.inputBorder,
    color: Palette.text,
    fontSize: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: Palette.card, fontSize: 18, fontWeight: '700' },
});
