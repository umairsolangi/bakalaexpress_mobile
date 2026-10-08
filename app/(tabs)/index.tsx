import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { getLocationsMeta, getHomeShops } from '../../src/api/browse';
import { CustomerShopCard } from '../../src/api/types';
import { useLocationStore } from '../../src/store/locationStore';
import { Screen } from '../../src/components/Screen';
import { ShopCard } from '../../src/features/browse/ShopCard';
import { CategoryChips } from '../../src/features/browse/CategoryChips';
import { LocationSelectorModal } from '../../src/features/browse/LocationSelectorModal';
import { FloatingCartBar } from '../../src/features/cart/FloatingCartBar';
import { ErrorView } from '../../src/components/ErrorView';
import { EmptyView } from '../../src/components/EmptyView';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

const PROMO_BANNER_IMG = require('../../assets/images/promo-banner-fresh.jpg');

// Quick visual top categories inspired by the Behance Wassal design
const FEATURED_CATEGORIES = [
  { id: 1, name: 'Dairy & Eggs', icon: '🥛', count: '80+ items' },
  { id: 2, name: 'Vegetables', icon: '🥦', count: '120+ items' },
  { id: 3, name: 'Fruits', icon: '🍎', count: '65+ items' },
  { id: 4, name: 'Drinks', icon: '🧃', count: '100+ items' },
  { id: 5, name: 'Meat & Poultry', icon: '🥩', count: '70+ items' },
  { id: 6, name: 'Snacks', icon: '🍫', count: '150+ items' },
  { id: 7, name: 'Bakery', icon: '🍞', count: '60+ items' },
  { id: 8, name: 'Cleaning', icon: '🧼', count: '80+ items' },
];

export default function HomeScreen() {
  const router = useRouter();
  const sector = useLocationStore((s) => s.sector);
  const nearArea = useLocationStore((s) => s.nearArea);
  const hasChosenLocation = useLocationStore((s) => s.hasChosenLocation);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Prompt location selection the first time only
  useEffect(() => {
    if (!hasChosenLocation) {
      setIsLocationModalOpen(true);
    }
  }, [hasChosenLocation]);

  // Fetch locations metadata (categories & available sectors)
  const { data: metaData } = useQuery({
    queryKey: ['locations-meta'],
    queryFn: getLocationsMeta,
  });

  const categories = metaData?.data?.categories || [];

  // Infinite query for home shops
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['home-shops', sector, nearArea, selectedCategoryId],
    queryFn: ({ pageParam = 1 }) =>
      getHomeShops({
        sector: sector || undefined,
        near_area: nearArea || undefined,
        category_id: selectedCategoryId || undefined,
        page: pageParam,
        per_page: 15,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage.meta?.current_page || 1;
      const last = lastPage.meta?.last_page || 1;
      return current < last ? current + 1 : undefined;
    },
  });

  const allShops: CustomerShopCard[] =
    data?.pages.flatMap((page) => page.data) || [];

  const locationChipText = sector
    ? `Sector ${sector}${nearArea ? ` • ${nearArea}` : ''}`
    : 'Baldia Town, Karachi';

  return (
    <Screen style={styles.container}>
      {/* ============================================================== */}
      {/* Top Header Section (Matches Behance Wassal Layout)             */}
      {/* ============================================================== */}
      <View style={styles.topHeader}>
        <View style={styles.locationBlock}>
          <Text style={styles.deliverToCaption}>Deliver to Home</Text>
          <TouchableOpacity
            style={styles.locationSelectorTouch}
            onPress={() => setIsLocationModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.locationPinIcon}>📍</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {locationChipText}
            </Text>
            <Text style={styles.locationArrow}>⌄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.bellUnreadDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Delivery ETA Pill & Search Trigger */}
      <View style={styles.deliveryAndSearchWrap}>
        <View style={styles.etaPill}>
          <Text style={styles.etaIcon}>⏱️</Text>
          <Text style={styles.etaText}>Delivery in <Text style={styles.etaBold}>20–30 minutes</Text></Text>
        </View>

        <TouchableOpacity
          style={styles.searchBarTouch}
          onPress={() => router.push('/(tabs)/search' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.searchBarIcon}>🔍</Text>
          <Text style={styles.searchBarPlaceholder}>Search for groceries, fruits, essentials...</Text>
        </TouchableOpacity>
      </View>

      {/* ============================================================== */}
      {/* Main Content List                                              */}
      {/* ============================================================== */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : isError ? (
        <ErrorView
          message={(error as Error)?.message}
          onRetry={() => refetch()}
        />
      ) : (
        <FlatList
          data={allShops}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ShopCard shop={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Promotional Hero Banner ("Fresh & Healthy Choices") */}
              <TouchableOpacity
                style={styles.promoBannerCard}
                activeOpacity={0.92}
                onPress={() => router.push('/(tabs)/search' as any)}
              >
                <Image
                  source={PROMO_BANNER_IMG}
                  style={styles.promoBannerImage}
                  contentFit="cover"
                />
                <View style={styles.promoOverlay}>
                  <Text style={styles.promoTitle}>Fresh &amp; Healthy Choices</Text>
                  <Text style={styles.promoSubtitle}>
                    Farm fresh groceries delivered to your doorstep.
                  </Text>
                  <View style={styles.promoShopNowBtn}>
                    <Text style={styles.promoShopNowText}>Shop Now</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Top Categories Row */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Top Categories</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/search' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topCategoriesScroll}
              >
                {FEATURED_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryCard}
                    activeOpacity={0.75}
                    onPress={() => router.push('/(tabs)/search' as any)}
                  >
                    <View style={styles.categoryIconWrap}>
                      <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                    </View>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Flash Sales / Fast Deals Banner (Matching Image 2) */}
              <View style={styles.flashSaleRow}>
                <View style={styles.flashSaleLeft}>
                  <Text style={styles.sectionHeaderTitle}>Flash Sales</Text>
                  <View style={styles.timerBadge}>
                    <Text style={styles.timerBadgeText}>🔥 02:45:12</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/search' as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
              </View>

              {/* Category Filter Chips for Nearby Shops */}
              <CategoryChips
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />

              {/* Section Header: Nearby Shops */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>{t('shopsNearYou')}</Text>
                <Text style={styles.shopsCount}>
                  {allShops.length} {allShops.length === 1 ? 'shop' : 'shops'}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyView
              title={t('noShopsFound')}
              subtitle={t('noShopsSubtitle')}
              icon="🏪"
              actionTitle={t('changeLocation')}
              onAction={() => setIsLocationModalOpen(true)}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : (
              <View style={styles.listBottomSpacing} />
            )
          }
        />
      )}

      {/* Location Modal */}
      <LocationSelectorModal
        visible={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        isInitialRequired={!hasChosenLocation}
      />

      {/* Floating Cart Bar */}
      <FloatingCartBar />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // -------------------------------------------------------------
  // Top Header
  // -------------------------------------------------------------
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  locationBlock: {
    flex: 1,
  },
  deliverToCaption: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  locationSelectorTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationPinIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    maxWidth: 220,
  },
  locationArrow: {
    fontSize: 13,
    fontWeight: '700',
    color: '#157B42',
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 17,
  },
  bellUnreadDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6A1A',
  },

  // -------------------------------------------------------------
  // Delivery & Search Sub-Header
  // -------------------------------------------------------------
  deliveryAndSearchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    gap: 8,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5EE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  etaIcon: {
    fontSize: 12,
  },
  etaText: {
    fontSize: 11.5,
    color: '#157B42',
  },
  etaBold: {
    fontWeight: '700',
  },
  searchBarTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchBarIcon: {
    fontSize: 15,
  },
  searchBarPlaceholder: {
    fontSize: 13.5,
    color: '#9CA3AF',
    flex: 1,
  },

  // -------------------------------------------------------------
  // List & Cards Content
  // -------------------------------------------------------------
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 88,
  },
  listHeader: {
    paddingTop: 12,
    marginBottom: 4,
  },

  // Promo Banner Card
  promoBannerCard: {
    height: 140,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#157B42',
    ...Platform.select({
      ios: {
        shadowColor: '#157B42',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  promoBannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  promoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 123, 66, 0.45)',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  promoSubtitle: {
    fontSize: 12,
    color: '#E8F5EE',
    maxWidth: 200,
    marginBottom: 10,
    lineHeight: 16,
  },
  promoShopNowBtn: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  promoShopNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#157B42',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#157B42',
  },
  shopsCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Top Categories Scroll
  topCategoriesScroll: {
    gap: 10,
    paddingBottom: 14,
  },
  categoryCard: {
    width: 78,
    height: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },

  // Flash Sale
  flashSaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  flashSaleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerBadge: {
    backgroundColor: '#FF6A1A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Loading & State
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  listBottomSpacing: {
    height: 32,
  },
});
