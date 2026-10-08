import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getSellerOrderDetail,
  confirmSellerOrder,
  prepareSellerOrder,
  readySellerOrder,
  rejectSellerOrder,
  completeSellerOrder,
  getSellerOrderMessages,
  sendSellerOrderMessage,
  markSellerOrderMessagesRead,
} from '../../../src/api/seller';
import { SellerOrderDetailData } from '../../../src/api/types';
import { theme } from '../../../src/theme';

export default function SellerOrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);

  const [order, setOrder] = useState<SellerOrderDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Order Details
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await getSellerOrderDetail(orderId);
      if (res.data) {
        setOrder(res.data);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not load order details.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  // Load Chat Messages
  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await getSellerOrderMessages(orderId);
      if (res.data) {
        setMessages(res.data);
      }
    } catch {
      // Quiet fail on polling
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    fetchMessages();
    markSellerOrderMessagesRead(orderId).catch(() => {});

    const interval = setInterval(() => {
      fetchMessages();
    }, 3500);

    return () => clearInterval(interval);
  }, [fetchOrder, fetchMessages, orderId]);

  // Actions
  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await confirmSellerOrder(orderId);
      Alert.alert('Success', 'Order confirmed.');
      fetchOrder();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not confirm order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrepare = async () => {
    setActionLoading(true);
    try {
      await prepareSellerOrder(orderId);
      Alert.alert('Success', 'Order status updated to Preparing.');
      fetchOrder();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not prepare order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReady = async () => {
    setActionLoading(true);
    try {
      await readySellerOrder(orderId);
      Alert.alert('Success', 'Order marked ready for pickup.');
      fetchOrder();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not mark order ready.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeSellerOrder(orderId);
      Alert.alert('Success', 'Order completed.');
      fetchOrder();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not complete order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPrompt = () => {
    Alert.prompt
      ? Alert.prompt(
          'Reject Order',
          'Enter reason for rejection:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reject',
              style: 'destructive',
              onPress: async (reason?: string) => {
                if (!reason?.trim()) {
                  Alert.alert('Required', 'A reason is required to reject an order.');
                  return;
                }
                setActionLoading(true);
                try {
                  await rejectSellerOrder(orderId, reason.trim());
                  Alert.alert('Rejected', 'Order has been rejected.');
                  fetchOrder();
                } catch (err: any) {
                  Alert.alert('Error', err.message || 'Could not reject order.');
                } finally {
                  setActionLoading(false);
                }
              },
            },
          ],
          'plain-text'
        )
      : Alert.alert('Action Required', 'Please reject this order from the orders dashboard.');
  };

  // Send Message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput('');
    setIsSendingMsg(true);
    try {
      await sendSellerOrderMessage(orderId, text);
      fetchMessages();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send message.');
    } finally {
      setIsSendingMsg(false);
    }
  };

  if (isLoading || !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  const allowed = order.allowed_actions || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{order.status_label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Details</Text>
          <Text style={styles.infoLine}>👤 Name: {order.customer.name}</Text>
          <Text style={styles.infoLine}>📞 Phone: {order.customer.phone || 'N/A'}</Text>
          <Text style={styles.infoLine}>📍 Delivery Address: {order.customer.address}</Text>
          {order.customer.delivery_instructions ? (
            <Text style={styles.instructionsText}>
              📝 Note: {order.customer.delivery_instructions}
            </Text>
          ) : null}
        </View>

        {/* Assigned Rider Card (if assigned) */}
        {order.rider && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Rider</Text>
            <Text style={styles.infoLine}>🛵 {order.rider.name} ({order.rider.vehicle_type})</Text>
            <Text style={styles.infoLine}>📞 {order.rider.phone}</Text>
          </View>
        )}

        {/* Items List Snapshot */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items ({order.items.length})</Text>
          {order.items.map((item, idx) => (
            <View key={item.id || idx} style={styles.itemRow}>
              {item.item_image ? (
                <Image source={{ uri: item.item_image }} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImageFallback}>
                  <Text style={{ fontSize: 16 }}>🛒</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemSubtext}>
                  Qty: {item.quantity} × ₨ {item.unit_price}
                </Text>
                {item.current_stock !== null && (
                  <Text style={styles.stockText}>Current Shop Stock: {item.current_stock}</Text>
                )}
              </View>
              <Text style={styles.itemTotal}>₨ {item.line_total}</Text>
            </View>
          ))}

          {/* Pricing Totals */}
          <View style={styles.pricingDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceVal}>₨ {order.subtotal}</Text>
          </View>
          {parseFloat(order.discount_amount) > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount ({order.promo_code || 'Promo'})</Text>
              <Text style={styles.discountVal}>-₨ {order.discount_amount}</Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={styles.priceVal}>₨ {order.delivery_charges}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>₨ {order.total_amount}</Text>
          </View>
        </View>

        {/* Actions Section */}
        {allowed.length > 0 && (
          <View style={styles.actionCard}>
            <Text style={styles.cardTitle}>Fulfillment Actions</Text>
            <View style={styles.actionButtonsCol}>
              {allowed.includes('confirm') && (
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn]}
                  onPress={handleConfirm}
                  disabled={actionLoading}
                >
                  <Text style={styles.btnText}>✓ Confirm Order</Text>
                </TouchableOpacity>
              )}

              {allowed.includes('prepare') && (
                <TouchableOpacity
                  style={[styles.btn, styles.prepareBtn]}
                  onPress={handlePrepare}
                  disabled={actionLoading}
                >
                  <Text style={styles.btnText}>👨‍🍳 Start Preparing</Text>
                </TouchableOpacity>
              )}

              {allowed.includes('ready') && (
                <TouchableOpacity
                  style={[styles.btn, styles.readyBtn]}
                  onPress={handleReady}
                  disabled={actionLoading}
                >
                  <Text style={styles.btnText}>🛵 Mark Ready for Pickup</Text>
                </TouchableOpacity>
              )}

              {allowed.includes('complete') && (
                <TouchableOpacity
                  style={[styles.btn, styles.completeBtn]}
                  onPress={handleComplete}
                  disabled={actionLoading}
                >
                  <Text style={styles.btnText}>✓ Complete Order</Text>
                </TouchableOpacity>
              )}

              {allowed.includes('reject') && (
                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={handleRejectPrompt}
                  disabled={actionLoading}
                >
                  <Text style={styles.rejectBtnText}>✕ Reject Order</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Live Customer Order Chat */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Chat (Order #{order.id})</Text>
          <View style={styles.chatBox}>
            {messages.length === 0 ? (
              <Text style={styles.noMessagesText}>No messages exchanged yet.</Text>
            ) : (
              messages.map((msg, index) => {
                const isSeller = msg.sender_type === 'seller';
                return (
                  <View
                    key={msg.id || index}
                    style={[
                      styles.chatBubble,
                      isSeller ? styles.sellerBubble : styles.customerBubble,
                    ]}
                  >
                    <Text style={styles.chatSender}>
                      {isSeller ? 'You (Shop)' : order.customer.name}
                    </Text>
                    <Text style={isSeller ? styles.sellerMsgText : styles.customerMsgText}>
                      {msg.message}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Send Input */}
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Message customer..."
              placeholderTextColor="#9CA3AF"
              value={messageInput}
              onChangeText={setMessageInput}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendMessage}
              disabled={isSendingMsg || !messageInput.trim()}
            >
              {isSendingMsg ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: 8,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  backBtnText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: '#03543F',
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  infoLine: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  instructionsText: {
    fontSize: theme.fontSize.xs,
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    marginTop: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    marginRight: 10,
  },
  itemImageFallback: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  itemSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  stockText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: theme.fontWeight.medium,
  },
  itemTotal: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  priceLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  priceVal: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
  },
  discountVal: {
    fontSize: theme.fontSize.xs,
    color: '#10B981',
    fontWeight: theme.fontWeight.bold,
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  totalVal: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  actionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  actionButtonsCol: {
    gap: 8,
  },
  btn: {
    height: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
  },
  prepareBtn: {
    backgroundColor: '#3B82F6',
  },
  readyBtn: {
    backgroundColor: '#6366F1',
  },
  completeBtn: {
    backgroundColor: '#059669',
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  btnText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  chatBox: {
    minHeight: 120,
    maxHeight: 220,
    backgroundColor: '#FAFAFA',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  noMessagesText: {
    textAlign: 'center',
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 30,
  },
  chatBubble: {
    padding: 8,
    borderRadius: theme.borderRadius.md,
    maxWidth: '80%',
  },
  sellerBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  customerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
  },
  chatSender: {
    fontSize: 9,
    fontWeight: theme.fontWeight.bold,
    color: '#D1D5DB',
    marginBottom: 2,
  },
  sellerMsgText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
  },
  customerMsgText: {
    color: '#1F2937',
    fontSize: theme.fontSize.xs,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    fontSize: theme.fontSize.xs,
    backgroundColor: '#FAFAFA',
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
});
