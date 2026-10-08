import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useCartStore } from '../../store/cartStore';
import { formatMoney } from '../../utils/money';
import { theme } from '../../theme';
import { t } from '../../i18n';

export const FloatingCartBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const totalCount = useCartStore((s) => s.getTotalCount());
  const subtotal = useCartStore((s) => s.getSubtotal());
  const sellerName = useCartStore((s) => s.sellerName);

  // Don't show floating bar if already on the cart screen or if cart is empty
  if (totalCount === 0 || pathname.includes('/cart')) {
    return null;
  }

  const handlePress = () => {
    router.push('/(tabs)/cart');
  };

  const itemsText =
    totalCount === 1
      ? t('itemsCount_one', { count: totalCount })
      : t('itemsCount_other', { count: totalCount });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.bar}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        <View style={styles.infoCol}>
          <Text style={styles.itemsCountText}>{itemsText}</Text>
          {sellerName ? (
            <Text style={styles.sellerText} numberOfLines={1}>
              from {sellerName}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionCol}>
          <Text style={styles.subtotalText}>{formatMoney(subtotal)}</Text>
          <View style={styles.viewCartWrap}>
            <Text style={styles.viewCartText}>{t('viewCart')} →</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: theme.spacing.screen,
    right: theme.spacing.screen,
    zIndex: 100,
  },
  bar: {
    minHeight: 56,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadow.lg,
  },
  infoCol: {
    flex: 1,
  },
  itemsCountText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
  },
  sellerText: {
    fontSize: 11,
    color: theme.colors.primaryLight,
    marginTop: 2,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  subtotalText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
  },
  viewCartWrap: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  viewCartText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
});
