import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getProductDetail } from '../../../../src/api/browse';
import { toggleProductFavorite } from '../../../../src/api/profile';
import { useCartStore } from '../../../../src/store/cartStore';
import { Screen } from '../../../../src/components/Screen';
import { Header } from '../../../../src/components/Header';
import { AppImage } from '../../../../src/components/AppImage';
import { Badge } from '../../../../src/components/Badge';
import { Button } from '../../../../src/components/Button';
import { ErrorView } from '../../../../src/components/ErrorView';
import { FloatingCartBar } from '../../../../src/features/cart/FloatingCartBar';
import { formatMoney } from '../../../../src/utils/money';
import { theme } from '../../../../src/theme';
import { t } from '../../../../src/i18n';

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; listing: string }>();
  const sellerId = Number(params.id);
  const listingId = Number(params.listing);

  const [isFavorite, setIsFavorite] = useState(false);

  const cartQuantity = useCartStore((s) => s.getItemQuantity(listingId));
  const addItem = useCartStore((s) => s.addItem);
  const forceAddFromNewSeller = useCartStore((s) => s.forceAddFromNewSeller);
  const incrementQuantity = useCartStore((s) => s.incrementQuantity);
  const decrementQuantity = useCartStore((s) => s.decrementQuantity);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['product-detail', sellerId, listingId],
    queryFn: () => getProductDetail(sellerId, listingId),
    enabled: !isNaN(sellerId) && !isNaN(listingId) && sellerId > 0 && listingId > 0,
  });

  useEffect(() => {
    if (data?.data) {
      setIsFavorite(Boolean(data.data.is_favorite));
    }
  }, [data?.data?.is_favorite]);

  if (isLoading) {
    return (
      <Screen style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </Screen>
    );
  }

  if (isError || !data?.data) {
    return (
      <Screen>
        <Header title={t('productDetailTitle')} showBack />
        <ErrorView
          message={(error as Error)?.message}
          onRetry={() => refetch()}
        />
      </Screen>
    );
  }

  const product = data.data;

  const handleToggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const res = await toggleProductFavorite(listingId);
      if (res.data) {
        setIsFavorite(res.data.is_favorite);
      }
    } catch {
      setIsFavorite(!next);
    }
  };

  const isOutOfStock = !product.in_stock || product.stock_quantity <= 0;
  const isShopAcceptingOrders = Boolean(product.shop?.accepting_orders);
  const canAdd = !isOutOfStock && isShopAcceptingOrders;

  const handleAdd = () => {
    if (!canAdd) return;

    const result = addItem(
      {
        listingId: product.listing_id,
        sellerId,
        name: product.name,
        unitPrice: String(product.price),
        image: product.image,
        maxStock: product.stock_quantity,
        quantity: 1,
      },
      product.shop?.name
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
                  listingId: product.listing_id,
                  sellerId,
                  name: product.name,
                  unitPrice: String(product.price),
                  image: product.image,
                  maxStock: product.stock_quantity,
                  quantity: 1,
                },
                product.shop?.name
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
    const success = incrementQuantity(product.listing_id);
    if (!success) {
      Alert.alert(t('cartTitle'), t('itemStockExceeded'));
    }
  };

  return (
    <Screen style={styles.container}>
      <Header
        title={product.name}
        showBack
        rightElement={
          <TouchableOpacity
            onPress={handleToggleFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ padding: 4 }}
          >
            <Text style={{ fontSize: 22 }}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageCard}>
          <AppImage
            uri={product.image}
            style={styles.image}
            contentFit="contain"
            fallbackText={product.name}
          />
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsCard}>
          <View style={styles.categoryRow}>
            {product.category ? (
              <Badge label={product.category} variant="info" />
            ) : null}
            {isOutOfStock ? (
              <Badge label={t('outOfStock')} variant="danger" />
            ) : (
              <Badge
                label={t('inStock', { count: product.stock_quantity })}
                variant="success"
              />
            )}
          </View>

          <Text style={styles.title}>{product.name}</Text>

          {product.unit_type ? (
            <Text style={styles.unit}>{product.unit_type}</Text>
          ) : null}

          <Text style={styles.price}>{formatMoney(product.price)}</Text>

          {product.description ? (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionHeader}>{t('description')}</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          ) : null}
        </View>

        {/* Shop Info Card */}
        {product.shop ? (
          <TouchableOpacity
            style={styles.shopCard}
            onPress={() => router.push(`/sellers/${sellerId}`)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.shopLabel}>{t('soldBy')}</Text>
              <Text style={styles.shopName}>{product.shop.name}</Text>
            </View>
            <Text style={styles.viewShopArrow}>View Shop →</Text>
          </TouchableOpacity>
        ) : null}

        {/* Action Button / Stepper */}
        <View style={styles.actionCard}>
          {cartQuantity > 0 ? (
            <View style={styles.stepperWrap}>
              <Text style={styles.inCartLabel}>In your cart:</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => decrementQuantity(product.listing_id)}
                >
                  <Text style={styles.stepperMinus}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperText}>{cartQuantity}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={handleIncrement}
                >
                  <Text style={styles.stepperPlus}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Button
              title={
                !isShopAcceptingOrders
                  ? t('shopClosedBadge')
                  : isOutOfStock
                  ? t('outOfStock')
                  : `Add to Cart • ${formatMoney(product.price)}`
              }
              onPress={handleAdd}
              disabled={!canAdd}
              style={styles.addButton}
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      <FloatingCartBar />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  imageCard: {
    width: '100%',
    height: 260,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  unit: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  price: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.lg,
  },
  descriptionSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionHeader: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  descriptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  shopCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.screen,
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shopLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.bold,
  },
  shopName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: 2,
  },
  viewShopArrow: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  actionCard: {
    padding: theme.spacing.screen,
    marginTop: theme.spacing.lg,
  },
  addButton: {
    width: '100%',
  },
  stepperWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inCartLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 38,
    height: 38,
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
  stepperText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textInverse,
    minWidth: 28,
    textAlign: 'center',
  },
});
