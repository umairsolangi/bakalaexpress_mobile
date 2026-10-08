import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getOrderDetail,
  cancelOrder,
  submitOrderFeedback,
  getReorderPreview,
} from '../../src/api/orders';
import { OrderDetailItem } from '../../src/api/types';
import { useCartStore } from '../../src/store/cartStore';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { LoadingView } from '../../src/components/LoadingView';
import { formatMoney } from '../../src/utils/money';
import { theme } from '../../src/theme';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);

  const [order, setOrder] = useState<OrderDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cancellation Modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Feedback Modal
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Reorder loading
  const [isReordering, setIsReordering] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await getOrderDetail(orderId);
      if (res.data) {
        setOrder(res.data);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not load order details.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    setIsLoading(true);
    fetchOrder();
  }, [fetchOrder]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrder();
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await cancelOrder(orderId, cancelReason.trim() || undefined);
      setOrder(res.data);
      setCancelModalVisible(false);
      Alert.alert('Order Cancelled', 'Your order has been cancelled.');
    } catch (err: any) {
      Alert.alert('Cancellation Failed', err?.message || 'Could not cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Feedback Required', 'Please enter a few words about your order experience.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await submitOrderFeedback(orderId, rating, feedbackText.trim());
      setFeedbackModalVisible(false);
      Alert.alert('Thank You! ⭐', 'Your review and rating have been recorded.');
      fetchOrder();
    } catch (err: any) {
      Alert.alert('Feedback Failed', err?.message || 'Could not submit review.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleReorder = async () => {
    setIsReordering(true);
    try {
      const res = await getReorderPreview(orderId);
      const preview = res.data;

      const availableItems = preview.items.filter((i) => i.ok && i.listing_id);
      if (availableItems.length === 0) {
        Alert.alert('Reorder Unavailable', 'None of the items from this order are currently available in the shop.');
        return;
      }

      // Clear existing cart and add items
      clearCart();
      for (const item of availableItems) {
        addItem(
          {
            listingId: item.listing_id!,
            sellerId: order?.seller.id || 0,
            name: item.name,
            unitPrice: item.current_price || '0.00',
            quantity: item.quantity,
            image: null,
            maxStock: item.available_stock,
          },
          order?.seller.name
        );
      }

      Alert.alert(
        'Items Added to Basket',
        `${availableItems.length} items from Order #${orderId} have been added to your cart.`,
        [
          {
            text: 'Go to Cart',
            onPress: () => router.push('/(tabs)/cart'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Reorder Failed', err?.message || 'Could not preview reorder items.');
    } finally {
      setIsReordering(false);
    }
  };

  if (isLoading || !order) {
    return (
      <Screen style={styles.container}>
        <Header title={`Order #${orderId || ''}`} showBack onBack={() => router.back()} />
        <LoadingView />
      </Screen>
    );
  }

  const isTerminal = ['delivered', 'completed', 'cancelled', 'rejected'].includes(order.status);
  const isCancelled = ['cancelled', 'rejected'].includes(order.status);

  // Stepper milestones
  const steps = [
    { step: 1, label: 'Placed' },
    { step: 2, label: 'Confirmed' },
    { step: 3, label: 'Preparing' },
    { step: 4, label: 'Ready' },
    { step: 5, label: 'On Way' },
    { step: 6, label: 'Delivered' },
  ];

  return (
    <Screen style={styles.container}>
      <Header
        title={`Order #${order.id}`}
        showBack
        onBack={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={styles.chatHeaderBtn}
            onPress={() => router.push(`/orders/${order.id}/chat` as any)}
          >
            <Text style={styles.chatHeaderIcon}>💬</Text>
            {order.unread_messages > 0 ? (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{order.unread_messages}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={styles.statusTitle}>{order.status_label}</Text>
              <Text style={styles.statusDate}>
                {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
              </Text>
            </View>
            <Badge
              label={order.status_label}
              variant={
                isCancelled ? 'danger' : order.status === 'delivered' ? 'success' : 'info'
              }
            />
          </View>

          {isCancelled ? (
            <View style={styles.cancelledBox}>
              <Text style={styles.cancelledText}>
                ⚠️ This order was {order.status}.
                {order.cancellation_reason ? ` Reason: "${order.cancellation_reason}"` : ''}
              </Text>
            </View>
          ) : (
            /* Visual Progress Stepper */
            <View style={styles.stepperContainer}>
              <View style={styles.stepperLine}>
                <View
                  style={[
                    styles.stepperLineFill,
                    {
                      width: `${Math.min(100, Math.max(0, ((order.status_step - 1) / 5) * 100))}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.stepsRow}>
                {steps.map((s) => {
                  const isDone = order.status_step >= s.step;
                  const isCurrent = order.status_step === s.step;
                  return (
                    <View key={s.step} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepDot,
                          isDone && styles.stepDotDone,
                          isCurrent && styles.stepDotCurrent,
                        ]}
                      >
                        <Text style={[styles.stepNum, isDone && styles.stepNumDone]}>
                          {isDone ? '✓' : s.step}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          isDone && styles.stepLabelDone,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Merchant & Rider Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Merchant & Fulfillment</Text>

          <View style={styles.metaRow}>
            {order.seller.image ? (
              <Image source={{ uri: order.seller.image }} style={styles.thumbImage} />
            ) : (
              <View style={styles.thumbFallback}>
                <Text style={styles.thumbIcon}>🏪</Text>
              </View>
            )}
            <View style={styles.metaInfo}>
              <Text style={styles.metaName}>{order.seller.name}</Text>
              <Text style={styles.metaSubtitle}>Bakala Partner Merchant</Text>
            </View>
          </View>

          {order.rider ? (
            <>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <View style={[styles.thumbFallback, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={styles.thumbIcon}>🛵</Text>
                </View>
                <View style={styles.metaInfo}>
                  <Text style={styles.metaName}>{order.rider.name}</Text>
                  <Text style={styles.metaSubtitle}>
                    Assigned Delivery Rider ({order.rider.vehicle_type})
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>

          {order.items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              {it.item_image ? (
                <Image source={{ uri: it.item_image }} style={styles.itemThumb} />
              ) : (
                <View style={styles.itemThumbFallback}>
                  <Text style={{ fontSize: 16 }}>🛒</Text>
                </View>
              )}
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {it.item_name}
                </Text>
                <Text style={styles.itemSubtext}>
                  {it.quantity} x {formatMoney(it.unit_price)} {it.unit_type ? `(${it.unit_type})` : ''}
                </Text>
              </View>
              <Text style={styles.itemLineTotal}>{formatMoney(it.line_total)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Destination</Text>
          <Text style={styles.deliveryAddress}>{order.address}</Text>
          <Text style={styles.deliveryPhone}>📞 {order.phone}</Text>
          {order.delivery_instructions ? (
            <Text style={styles.deliveryNotes}>
              Note: "{order.delivery_instructions}"
            </Text>
          ) : null}
        </View>

        {/* Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment & Bill</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatMoney(order.subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>{formatMoney(order.delivery_charges)}</Text>
          </View>

          {parseFloat(order.discount_amount) > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.success }]}>
                Discount {order.promo_code ? `(${order.promo_code})` : ''}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                -{formatMoney(order.discount_amount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable (COD)</Text>
            <Text style={styles.totalValue}>{formatMoney(order.total_amount)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Order Chat */}
          <Button
            title={`Chat with Merchant ${order.unread_messages > 0 ? `(${order.unread_messages} unread)` : ''}`}
            onPress={() => router.push(`/orders/${order.id}/chat` as any)}
            variant="outline"
          />

          {/* Cancel Order */}
          {order.can_cancel ? (
            <Button
              title="Cancel Order"
              variant="outline"
              onPress={() => setCancelModalVisible(true)}
              style={styles.cancelBtn}
              textStyle={{ color: theme.colors.error }}
            />
          ) : null}

          {/* Rate & Review */}
          {order.can_review ? (
            <Button
              title="Rate & Review Experience ⭐"
              onPress={() => setFeedbackModalVisible(true)}
            />
          ) : null}

          {/* Reorder */}
          {isTerminal ? (
            <Button
              title={isReordering ? 'Loading Items...' : 'Reorder Items 🔄'}
              onPress={handleReorder}
              loading={isReordering}
              variant="secondary"
            />
          ) : null}
        </View>
      </ScrollView>

      {/* Cancel Order Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel Order #{order.id}</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to cancel? Please provide a reason.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Changed my mind, ordered by mistake"
              placeholderTextColor={theme.colors.textMuted}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />

            <View style={styles.modalButtonsRow}>
              <Button
                title="Keep Order"
                variant="outline"
                onPress={() => setCancelModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                onPress={handleCancel}
                loading={isCancelling}
                variant="danger"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal visible={feedbackModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Order ⭐</Text>
            <Text style={styles.modalSubtitle}>
              How was your grocery delivery experience with {order.seller.name}?
            </Text>

            {/* Stars Selector */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starBtn}
                >
                  <Text style={[styles.starIcon, rating >= star && styles.starIconActive]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reasonInput}
              placeholder="Write a brief review (quality, timing, etc.)"
              placeholderTextColor={theme.colors.textMuted}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
            />

            <View style={styles.modalButtonsRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setFeedbackModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={isSubmittingFeedback ? 'Submitting...' : 'Submit Review'}
                onPress={handleSubmitFeedback}
                loading={isSubmittingFeedback}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.screen,
    gap: theme.spacing.md,
    paddingBottom: 40,
  },
  chatHeaderBtn: {
    position: 'relative',
    padding: 8,
  },
  chatHeaderIcon: {
    fontSize: 22,
  },
  chatBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statusDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  cancelledBox: {
    backgroundColor: '#FEE2E2',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelledText: {
    fontSize: theme.fontSize.sm,
    color: '#991B1B',
    fontWeight: theme.fontWeight.medium,
  },
  stepperContainer: {
    marginVertical: theme.spacing.sm,
  },
  stepperLine: {
    position: 'absolute',
    top: 14,
    left: '8%',
    right: '8%',
    height: 4,
    backgroundColor: theme.colors.border,
    zIndex: 1,
  },
  stepperLineFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  stepItem: {
    alignItems: 'center',
    width: 48,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepDotCurrent: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  stepNumDone: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  thumbFallback: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  thumbIcon: {
    fontSize: 22,
  },
  metaInfo: {
    flex: 1,
  },
  metaName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  metaSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  itemThumbFallback: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  itemDetails: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  itemSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  itemLineTotal: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  deliveryAddress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  deliveryPhone: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deliveryNotes: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  summaryValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  totalLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  actionsContainer: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  cancelBtn: {
    borderColor: theme.colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screen,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: theme.spacing.md,
    ...theme.shadow.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  starBtn: {
    padding: 6,
  },
  starIcon: {
    fontSize: 34,
    color: theme.colors.border,
  },
  starIconActive: {
    color: '#F59E0B',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
