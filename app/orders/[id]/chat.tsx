import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getOrderMessages,
  sendOrderMessage,
  markOrderMessagesRead,
} from '../../../src/api/orders';
import { OrderMessageItem } from '../../../src/api/types';
import { Screen } from '../../../src/components/Screen';
import { Header } from '../../../src/components/Header';
import { theme } from '../../../src/theme';

export default function OrderChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);

  const [messages, setMessages] = useState<OrderMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await getOrderMessages(orderId);
      if (res.data) {
        setMessages(res.data);
      }
    } catch {
      // Ignore polling errors quietly
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchMessages();
    markOrderMessagesRead(orderId).catch(() => {});

    // Polling every 3.5 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 3500);

    return () => clearInterval(interval);
  }, [fetchMessages, orderId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      const res = await sendOrderMessage(orderId, text);
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch {
      setInputText(text); // Restore on error
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageBubble = ({ item }: { item: OrderMessageItem }) => {
    const isMe = item.sender_type === 'customer';

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {!isMe ? (
          <Text style={styles.senderLabel}>
            {item.sender_name || item.sender_type.toUpperCase()}
          </Text>
        ) : null}

        <View
          style={[
            styles.bubbleBox,
            isMe ? styles.bubbleBoxMe : styles.bubbleBoxOther,
          ]}
        >
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
            {item.message}
          </Text>
        </View>

        <Text style={[styles.timeLabel, isMe ? styles.timeMe : styles.timeOther]}>
          {item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Text>
      </View>
    );
  };

  return (
    <Screen style={styles.container}>
      <Header
        title={`Order #${orderId} Chat`}
        showBack
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {isLoading && messages.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderMessageBubble}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>Order Discussion</Text>
                <Text style={styles.emptySubtitle}>
                  You can send special delivery instructions or questions directly to the shop.
                </Text>
              </View>
            }
          />
        )}

        {/* Message Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  messagesList: {
    padding: theme.spacing.screen,
    gap: theme.spacing.sm,
    flexGrow: 1,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  bubbleWrapper: {
    maxWidth: '82%',
    gap: 2,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    alignSelf: 'flex-start',
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
    marginLeft: 4,
    marginBottom: 2,
  },
  bubbleBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleBoxMe: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBoxOther: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },
  bubbleTextMe: {
    color: '#FFF',
  },
  bubbleTextOther: {
    color: theme.colors.text,
  },
  timeLabel: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginHorizontal: 4,
  },
  timeMe: {
    alignSelf: 'flex-end',
  },
  timeOther: {
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFF',
    marginLeft: 2,
  },
});
