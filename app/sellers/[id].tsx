import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getSellerDetail, getSellerReviews } from '../../src/api/browse';
import { toggleSellerFavorite } from '../../src/api/profile';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { AppImage } from '../../src/components/AppImage';
import { Badge } from '../../src/components/Badge';
import { ListingItem } from '../../src/features/browse/ListingItem';
import { ReviewCard } from '../../src/features/browse/ReviewCard';
import { FloatingCartBar } from '../../src/features/cart/FloatingCartBar';
import { ErrorView } from '../../src/components/ErrorView';
import { formatShopTime } from '../../src/utils/date';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

export default function ShopDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const sellerId = Number(params.id);

  const [selectedCategoryTab, setSelectedCategoryTab] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'reviews'>('catalog');
  const [isFavorite, setIsFavorite] = useState(false);

  // Shop Profile & Catalog Query
  const {
    data: shopData,
    isLoading: isShopLoading,
    isError: isShopError,
    error: shopError,
    refetch: refetchShop,
  } = useQuery({
    queryKey: ['seller-detail', sellerId],
    queryFn: () => getSellerDetail(sellerId),
    enabled: !isNaN(sellerId) && sellerId > 0,
  });

  // Shop Reviews Infinite Query
  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    fetchNextPage: fetchNextReviewsPage,
    hasNextPage: hasNextReviewsPage,
    isFetchingNextPage: isFetchingNextReviewsPage,
  } = useInfiniteQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: ({ pageParam = 1 }) => getSellerReviews(sellerId, pageParam, 15),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage.meta?.current_page || 1;
      const last = lastPage.meta?.last_page || 1;
      return current < last ? current + 1 : undefined;
    },
    enabled: !isNaN(sellerId) && sellerId > 0 && activeTab === 'reviews',
  });

  useEffect(() => {
    if (shopData?.data?.seller) {
      setIsFavorite(Boolean(shopData.data.seller.is_favorite));
    }
  }, [shopData?.data?.seller?.is_favorite]);

  if (isShopLoading) {
    return (
      <Screen style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </Screen>
    );
  }

  if (isShopError || !shopData?.data) {
    return (
      <Screen>
        <Header title="Shop" showBack />
        <ErrorView
          message={(shopError as Error)?.message}
          onRetry={() => refetchShop()}
        />
      </Screen>
    );
  }

  const { seller, categories } = shopData.data;
  const isAcceptingOrders = Boolean(seller.accepting_orders);

  const handleToggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const res = await toggleSellerFavorite(sellerId);
      if (res.data) {
        setIsFavorite(res.data.is_favorite);
      }
    } catch {
      setIsFavorite(!next);
    }
  };

  const hoursString =
    seller.opens_at && seller.closes_at
      ? `${formatShopTime(seller.opens_at)} - ${formatShopTime(seller.closes_at)}`
      : null;

  // Filter listings by selected category tab if set
  const visibleCategories =
    selectedCategoryTab !== null
      ? categories.filter((c) => c.id === selectedCategoryTab)
      : categories;

  const allReviews = reviewsData?.pages.flatMap((page) => page.data) || [];

  return (
    <Screen style={styles.container}>
      <Header
        title={seller.name}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Shop Header Banner */}
        <View style={styles.shopHeader}>
          <AppImage
            uri={seller.profile_image}
            style={styles.profileImage}
            fallbackText={seller.name}
          />

          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{seller.name}</Text>
            {seller.category ? (
              <Text style={styles.categoryText}>{seller.category}</Text>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingScore}>
                  {seller.average_rating > 0 ? seller.average_rating.toFixed(1) : 'New'}
                </Text>
                <Text style={styles.ratingCount}>({seller.rating_count})</Text>
              </View>

              {hoursString ? (
                <Text style={styles.hoursBadge}>🕒 {hoursString}</Text>
              ) : null}
            </View>

            <View style={styles.statusRow}>
              {isAcceptingOrders ? (
                <Badge label={t('shopAcceptingOrders')} variant="success" />
              ) : (
                <Badge label={t('shopNotAcceptingOrders')} variant="danger" />
              )}
            </View>
          </View>
        </View>

        {!isAcceptingOrders ? (
          <View style={styles.closedWarningBanner}>
            <Text style={styles.closedWarningText}>{t('shopClosedWarning')}</Text>
          </View>
        ) : null}

        {/* View Switcher: Catalog vs Reviews */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.switcherBtn, activeTab === 'catalog' && styles.switcherBtnActive]}
            onPress={() => setActiveTab('catalog')}
          >
            <Text
              style={[
                styles.switcherText,
                activeTab === 'catalog' && styles.switcherTextActive,
              ]}
            >
              Products
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switcherBtn, activeTab === 'reviews' && styles.switcherBtnActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text
              style={[
                styles.switcherText,
                activeTab === 'reviews' && styles.switcherTextActive,
              ]}
            >
              Reviews ({seller.rating_count})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'catalog' ? (
          <>
            {/* Category Filter Tabs */}
            {categories.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryTabsScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.catTab,
                    selectedCategoryTab === null && styles.catTabActive,
                  ]}
                  onPress={() => setSelectedCategoryTab(null)}
                >
                  <Text
                    style={[
                      styles.catTabText,
                      selectedCategoryTab === null && styles.catTabTextActive,
                    ]}
                  >
                    All Products
                  </Text>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSelected = selectedCategoryTab === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catTab, isSelected && styles.catTabActive]}
                      onPress={() => setSelectedCategoryTab(cat.id)}
                    >
                      <Text
                        style={[
                          styles.catTabText,
                          isSelected && styles.catTabTextActive,
                        ]}
                      >
                        {cat.name} ({cat.products.length})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Catalog Grouped by Category */}
            <View style={styles.catalogContainer}>
              {visibleCategories.map((cat) => (
                <View key={cat.id} style={styles.categorySection}>
                  <Text style={styles.categorySectionTitle}>{cat.name}</Text>
                  {cat.products.map((listing) => (
                    <ListingItem
                      key={listing.listing_id}
                      listing={listing}
                      sellerId={seller.id}
                      sellerName={seller.name}
                      isShopAcceptingOrders={isAcceptingOrders}
                    />
                  ))}
                </View>
              ))}

              {categories.length === 0 ? (
                <View style={styles.emptyProducts}>
                  <Text style={styles.emptyProductsText}>
                    No products currently available from this shop.
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : (
          /* Reviews Section */
          <View style={styles.reviewsContainer}>
            {isReviewsLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : allReviews.length === 0 ? (
              <Text style={styles.noReviewsText}>{t('noReviewsYet')}</Text>
            ) : (
              allReviews.map((rev, index) => (
                <ReviewCard key={index} review={rev} />
              ))
            )}

            {hasNextReviewsPage ? (
              <TouchableOpacity
                style={styles.loadMoreReviewsBtn}
                onPress={() => fetchNextReviewsPage()}
                disabled={isFetchingNextReviewsPage}
              >
                {isFetchingNextReviewsPage ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={styles.loadMoreReviewsText}>Load More Reviews</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        )}
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
  shopHeader: {
    flexDirection: 'row',
    padding: theme.spacing.screen,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  profileImage: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.lg,
  },
  shopInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primaryDark,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.cardMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  ratingStar: {
    color: '#D97706',
    fontSize: 12,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  ratingCount: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  hoursBadge: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
  },
  closedWarningBanner: {
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.screen,
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  closedWarningText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  switcherBtn: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  switcherBtnActive: {
    borderBottomColor: theme.colors.primary,
  },
  switcherText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  switcherTextActive: {
    color: theme.colors.primary,
  },
  categoryTabsScroll: {
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  catTab: {
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  catTabText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  catTabTextActive: {
    color: theme.colors.textInverse,
    fontWeight: theme.fontWeight.semibold,
  },
  catalogContainer: {
    paddingHorizontal: theme.spacing.screen,
  },
  categorySection: {
    marginBottom: theme.spacing.lg,
  },
  categorySectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyProducts: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  reviewsContainer: {
    padding: theme.spacing.screen,
    paddingTop: theme.spacing.md,
  },
  noReviewsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },
  loadMoreReviewsBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
  },
  loadMoreReviewsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});
