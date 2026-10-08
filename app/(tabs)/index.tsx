import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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
    : 'Select Sector';

  return (
    <Screen style={styles.container}>
      {/* Top Header with Brand & Location Chip */}
      <View style={styles.header}>
        <View style={styles.brandCol}>
          <Text style={styles.brandTitle}>{t('appName')}</Text>
          <Text style={styles.brandSubtitle}>Baldia Town, Karachi</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setIsLocationModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationChipText} numberOfLines={1}>
              {locationChipText}
            </Text>
            <Text style={styles.locationArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
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
              {/* Category Chips */}
              <CategoryChips
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('shopsNearYou')}</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  brandCol: {
    flex: 1,
  },
  brandTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  brandSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
    maxWidth: 160,
    gap: 4,
    minHeight: 38,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.full,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bellIcon: {
    fontSize: 18,
  },
  locationPin: {
    fontSize: 13,
  },
  locationChipText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
    flexShrink: 1,
  },
  locationArrow: {
    fontSize: 9,
    color: theme.colors.primaryDark,
  },
  listContent: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: 88,
  },
  listHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  shopsCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  footerLoading: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  listBottomSpacing: {
    height: 32,
  },
});
