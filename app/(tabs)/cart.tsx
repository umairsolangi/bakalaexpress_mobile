import React from 'react';
import { StyleSheet, View, Text, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useCartStore } from '../../src/store/cartStore';
import { useAuthStore } from '../../src/store/authStore';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { CartItemRow } from '../../src/features/cart/CartItemRow';
import { EmptyView } from '../../src/components/EmptyView';
import { Button } from '../../src/components/Button';
import { formatMoney } from '../../src/utils/money';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function CartScreen() {
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const sellerName = useCartStore((s) => s.sellerName);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.getSubtotal());

  const isGuest = useAuthStore((s) => s.isGuest);
  const role = useAuthStore((s) => s.role);

  const handleCheckout = () => {
    if (isGuest || role !== 'customer') {
      Alert.alert(
        'Login Required',
        'Please sign in or create an account to place your order.',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('loginButton'),
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
      return;
    }

    router.push('/checkout' as any);
  };

  const handleClear = () => {
    Alert.alert(
      t('clearCartConfirmTitle'),
      t('clearCartConfirmMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clearCartButton'),
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const isEmpty = items.length === 0;

  return (
    <Screen style={styles.container}>
      <Header
        title={t('cartTitle')}
        rightElement={
          !isEmpty ? (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearText}>{t('clearCartButton')}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isEmpty ? (
        <EmptyView
          title={t('cartEmptyTitle')}
          subtitle={t('cartEmptySubtitle')}
          icon="🛒"
          actionTitle="Browse Shops"
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <View style={styles.body}>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.listingId)}
            renderItem={({ item }) => <CartItemRow item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              sellerName ? (
                <View style={styles.sellerBanner}>
                  <Text style={styles.sellerLabel}>Shop</Text>
                  <Text style={styles.sellerNameText}>{sellerName}</Text>
                </View>
              ) : null
            }
          />

          {/* Cart Checkout Summary Footer */}
          <View style={styles.footerCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.subtotalLabel}>{t('cartSubtotal')}</Text>
              <Text style={styles.subtotalValue}>{formatMoney(subtotal)}</Text>
            </View>

            <Text style={styles.disclaimerText}>
              Delivery charges calculated at checkout.
            </Text>

            <Button
              title={t('checkoutButton')}
              onPress={handleCheckout}
              style={styles.checkoutButton}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  clearButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  clearText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.semibold,
  },
  listContent: {
    padding: theme.spacing.screen,
    paddingBottom: theme.spacing.lg,
  },
  sellerBanner: {
    backgroundColor: theme.colors.cardMuted,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sellerLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.bold,
  },
  sellerNameText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  footerCard: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtotalLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  subtotalValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  disclaimerText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  checkoutButton: {
    width: '100%',
  },
});
