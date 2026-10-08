import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../src/store/cartStore';
import { useAuthStore } from '../src/store/authStore';
import {
  validateCart,
  applyPromo,
  placeOrder,
} from '../src/api/orders';
import {
  CartValidationResponse,
  CustomerUser,
  EvaluatedCartItem,
} from '../src/api/types';
import { Screen } from '../src/components/Screen';
import { Header } from '../src/components/Header';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { Badge } from '../src/components/Badge';
import { formatMoney } from '../src/utils/money';
import { theme } from '../src/theme';
import { t } from '../src/i18n';

export default function CheckoutScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user) as CustomerUser | null;
  const items = useCartStore((s) => s.items);
  const sellerName = useCartStore((s) => s.sellerName);
  const clearCart = useCartStore((s) => s.clearCart);

  // Form states
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.mobile || user?.phone || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Promo code states
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<string>('0.00');

  // Validation & Live Totals
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [evaluatedItems, setEvaluatedItems] = useState<EvaluatedCartItem[]>([]);
  const [subtotal, setSubtotal] = useState<string>('0.00');
  const [deliveryCharges, setDeliveryCharges] = useState<string>('50.00');
  const [totalAmount, setTotalAmount] = useState<string>('0.00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Run initial server validation
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/(tabs)/cart');
      return;
    }

    const runValidation = async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const payload = items.map((i) => ({
          listing_id: i.listingId,
          quantity: i.quantity,
        }));
        const res = await validateCart(payload);

        if (res.data) {
          setEvaluatedItems(res.data.items || []);
          setSubtotal(res.data.totals.subtotal);
          setDeliveryCharges(res.data.totals.delivery_charges);
          setTotalAmount(res.data.totals.total);

          if (!res.data.is_valid) {
            setValidationError('Some items in your cart are currently out of stock or unavailable.');
          }
        }
      } catch (err: any) {
        setValidationError(err?.message || 'Failed to validate cart with server.');
      } finally {
        setIsValidating(false);
      }
    };

    runValidation();
  }, [items]);

  // Handle Promo Code application
  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      Alert.alert('Promo Code', 'Please enter a promotional code.');
      return;
    }

    setIsApplyingPromo(true);
    try {
      const payload = items.map((i) => ({
        listing_id: i.listingId,
        quantity: i.quantity,
      }));
      const res = await applyPromo(payload, code);

      if (res.data) {
        setAppliedPromo(res.data.promo.code);
        setSubtotal(res.data.totals.subtotal);
        setDeliveryCharges(res.data.totals.delivery_charges);
        setPromoDiscount(res.data.totals.discount);
        setTotalAmount(res.data.totals.total);
        Alert.alert('Promo Applied!', `Promo code "${res.data.promo.code}" applied successfully.`);
      }
    } catch (err: any) {
      Alert.alert('Promo Error', err?.message || 'Invalid or expired promotional code.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoDiscount('0.00');

    // Re-run standard validation
    setIsValidating(true);
    try {
      const payload = items.map((i) => ({
        listing_id: i.listingId,
        quantity: i.quantity,
      }));
      const res = await validateCart(payload);
      if (res.data) {
        setSubtotal(res.data.totals.subtotal);
        setDeliveryCharges(res.data.totals.delivery_charges);
        setTotalAmount(res.data.totals.total);
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Missing Address', 'Please provide a valid delivery address in Baldia Town.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Missing Phone', 'Please provide a valid contact number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        items: items.map((i) => ({
          listing_id: i.listingId,
          quantity: i.quantity,
        })),
        address: address.trim(),
        phone: phone.trim(),
        delivery_instructions: deliveryInstructions.trim() || undefined,
        promo_code: appliedPromo || undefined,
        payment_method: 'cod' as const,
      };

      const res = await placeOrder(orderPayload);
      const placedOrder = res.data;

      // Clear local cart
      clearCart();

      Alert.alert(
        'Order Placed Successfully! 🎉',
        `Your order #${placedOrder.id} has been submitted to ${sellerName || 'the shop'}. Cash on delivery is confirmed.`,
        [
          {
            text: 'Track Order',
            onPress: () => router.replace(`/orders/${placedOrder.id}` as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Order Failed', err?.message || 'Could not place order. Please review your cart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <Header title="Checkout" showBack onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop Header Notice */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ordering From</Text>
          <Text style={styles.shopNameText}>{sellerName || 'Bakala Partner Shop'}</Text>
          <Text style={styles.shopSubtext}>Hyper-local delivery from Baldia Town</Text>
        </View>

        {/* Validation Error Alert if items have stock issues */}
        {validationError ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ {validationError}</Text>
          </View>
        ) : null}

        {/* Items Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Items ({items.length})</Text>
            {isValidating ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : null}
          </View>

          {items.map((item) => {
            const serverEval = evaluatedItems.find((e) => e.listing_id === item.listingId);
            const isItemOk = serverEval ? serverEval.ok : true;

            return (
              <View key={item.listingId} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemQtyPrice}>
                    {item.quantity}x {formatMoney(item.unitPrice)}
                  </Text>
                  {!isItemOk ? (
                    <Badge
                      label={serverEval?.problem_code || 'UNAVAILABLE'}
                      variant="danger"
                      style={styles.itemBadge}
                    />
                  ) : null}
                </View>
                <Text style={styles.itemTotal}>
                  {formatMoney(
                    (parseFloat(item.unitPrice) * item.quantity).toFixed(2)
                  )}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Delivery Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>

          <Input
            label="Delivery Address"
            placeholder="House #, Street, Sector, Baldia Town"
            value={address}
            onChangeText={setAddress}
          />

          <Input
            label="Contact Phone"
            placeholder="03001234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Delivery Instructions (Optional)"
            placeholder="e.g. Ring the bell twice, near mosque"
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
          />
        </View>

        {/* Promo Code Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Promotional Discount</Text>

          {appliedPromo ? (
            <View style={styles.appliedPromoRow}>
              <View>
                <Text style={styles.appliedPromoTitle}>Code Applied: {appliedPromo}</Text>
                <Text style={styles.appliedPromoDiscount}>Discount: -{formatMoney(promoDiscount)}</Text>
              </View>
              <TouchableOpacity onPress={handleRemovePromo} style={styles.removePromoBtn}>
                <Text style={styles.removePromoText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputRow}>
              <View style={styles.promoInputWrap}>
                <Input
                  placeholder="Enter Promo Code"
                  value={promoInput}
                  onChangeText={(t) => setPromoInput(t.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
              <Button
                title={isApplyingPromo ? '...' : 'Apply'}
                onPress={handleApplyPromo}
                loading={isApplyingPromo}
                style={styles.applyBtn}
              />
            </View>
          )}
        </View>

        {/* Payment Method Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentRadioActive}>
              <View style={styles.radioInner} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.paymentDesc}>Pay rider in cash upon receiving your order</Text>
            </View>
          </View>
        </View>

        {/* Bill Summary Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatMoney(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charges</Text>
            <Text style={styles.summaryValue}>{formatMoney(deliveryCharges)}</Text>
          </View>

          {parseFloat(promoDiscount) > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>Promo Discount</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -{formatMoney(promoDiscount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
          </View>
        </View>

        {/* Place Order Button */}
        <Button
          title={isSubmitting ? 'Placing Order...' : `Confirm & Place Order • ${formatMoney(totalAmount)}`}
          onPress={handlePlaceOrder}
          loading={isSubmitting}
          disabled={isValidating || isSubmitting || Boolean(validationError)}
          style={styles.submitBtn}
        />
      </ScrollView>
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
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    ...theme.shadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  shopNameText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  shopSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: '#92400E',
    fontWeight: theme.fontWeight.medium,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  itemName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  itemQtyPrice: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  itemBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  itemTotal: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  promoInputWrap: {
    flex: 1,
  },
  applyBtn: {
    minWidth: 84,
    height: 48,
  },
  appliedPromoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  appliedPromoTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: '#065F46',
  },
  appliedPromoDiscount: {
    fontSize: theme.fontSize.xs,
    color: '#047857',
    marginTop: 2,
  },
  removePromoBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  removePromoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
  },
  paymentRadioActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  paymentDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
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
  discountLabel: {
    color: theme.colors.success,
  },
  discountValue: {
    color: theme.colors.success,
    fontWeight: theme.fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
});
