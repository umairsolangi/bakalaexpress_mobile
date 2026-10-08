import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerProductListing } from '../../api/types';
import { AppImage } from '../../components/AppImage';
import { Badge } from '../../components/Badge';
import { useCartStore } from '../../store/cartStore';
import { formatMoney } from '../../utils/money';
import { theme } from '../../theme';
import { t } from '../../i18n';

export interface ListingItemProps {
  listing: CustomerProductListing;
  sellerId: number;
  sellerName?: string;
  isShopAcceptingOrders?: boolean;
}

export const ListingItem: React.FC<ListingItemProps> = ({
  listing,
  sellerId,
  sellerName,
  isShopAcceptingOrders = true,
}) => {
  const router = useRouter();

  const cartQuantity = useCartStore((s) => s.getItemQuantity(listing.listing_id));
  const addItem = useCartStore((s) => s.addItem);
  const forceAddFromNewSeller = useCartStore((s) => s.forceAddFromNewSeller);
  const incrementQuantity = useCartStore((s) => s.incrementQuantity);
  const decrementQuantity = useCartStore((s) => s.decrementQuantity);

  const isOutOfStock = !listing.in_stock || listing.stock_quantity <= 0;
  const canAdd = !isOutOfStock && isShopAcceptingOrders;

  const handleAdd = () => {
    if (!canAdd) return;

    const result = addItem(
      {
        listingId: listing.listing_id,
        sellerId,
        name: listing.name,
        unitPrice: String(listing.price),
        image: listing.image,
        maxStock: listing.stock_quantity,
        quantity: 1,
      },
      sellerName
    );

    if (result.needsSellerConfirm) {
      Alert.alert(
        t('diffSellerAlertTitle'),
        t('diffSellerAlertMessage'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('confirm'),
            style: 'destructive',
            onPress: () => {
              forceAddFromNewSeller(
                {
                  listingId: listing.listing_id,
                  sellerId,
                  name: listing.name,
                  unitPrice: String(listing.price),
                  image: listing.image,
                  maxStock: listing.stock_quantity,
                  quantity: 1,
                },
                sellerName
              );
            },
          },
        ]
      );
    } else if (result.reason === 'MAX_ITEMS') {
      Alert.alert(t('cartTitle'), t('maxItemsLimit'));
    }
  };

  const handleIncrement = () => {
    const success = incrementQuantity(listing.listing_id);
    if (!success) {
      Alert.alert(t('cartTitle'), t('itemStockExceeded'));
    }
  };

  const handlePressDetail = () => {
    router.push({
      pathname: '/sellers/[id]/products/[listing]',
      params: { id: String(sellerId), listing: String(listing.listing_id) },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.container, isOutOfStock && styles.outOfStockContainer]}
      onPress={handlePressDetail}
    >
      <View style={styles.imageWrap}>
        <AppImage
          uri={listing.image}
          style={styles.image}
          fallbackText={listing.name}
        />
      </View>

      <View style={styles.contentWrap}>
        <Text style={styles.name} numberOfLines={2}>
          {listing.name}
        </Text>

        {listing.unit_type ? (
          <Text style={styles.unit}>{listing.unit_type}</Text>
        ) : null}

        <View style={styles.priceAndStockRow}>
          <Text style={styles.price}>{formatMoney(listing.price)}</Text>
          {isOutOfStock ? (
            <Badge label={t('outOfStock')} variant="neutral" />
          ) : listing.stock_quantity <= 5 ? (
            <Badge
              label={t('inStock', { count: listing.stock_quantity })}
              variant="warning"
            />
          ) : null}
        </View>
      </View>

      <View style={styles.actionWrap}>
        {cartQuantity > 0 ? (
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => decrementQuantity(listing.listing_id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.stepperMinus}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperCount}>{cartQuantity}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={handleIncrement}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.stepperPlus}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={!canAdd}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text
              style={[styles.addButtonText, !canAdd && styles.addButtonTextDisabled]}
            >
              {isOutOfStock ? t('outOfStock') : `+ ${t('addToCart')}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 88,
  },
  outOfStockContainer: {
    opacity: 0.65,
  },
  imageWrap: {
    width: 68,
    height: 68,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  unit: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  priceAndStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  price: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  actionWrap: {
    marginLeft: theme.spacing.sm,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  addButton: {
    minHeight: 44,
    minWidth: 76,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.cardMuted,
    borderColor: theme.colors.border,
  },
  addButtonText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  addButtonTextDisabled: {
    color: theme.colors.textMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMinus: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
  },
  stepperPlus: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
  },
  stepperCount: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    minWidth: 20,
    textAlign: 'center',
  },
});
