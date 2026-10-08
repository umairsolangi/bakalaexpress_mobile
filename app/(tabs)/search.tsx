import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { searchCatalog } from '../../src/api/browse';
import {
  CustomerShopCard,
  SearchAllResponse,
  SearchProductItem,
  SearchProductsResponse,
  SearchShopsResponse,
} from '../../src/api/types';
import { useLocationStore } from '../../src/store/locationStore';
import { useDebounce } from '../../src/utils/debounce';
import { Screen } from '../../src/components/Screen';
import { ShopCard } from '../../src/features/browse/ShopCard';
import { ListingItem } from '../../src/features/browse/ListingItem';
import { FloatingCartBar } from '../../src/features/cart/FloatingCartBar';
import { EmptyView } from '../../src/components/EmptyView';
import { ErrorView } from '../../src/components/ErrorView';
import { theme } from '../../src/theme';
import { t } from '../../src/i18n';

type SearchType = 'all' | 'shops' | 'products';

export default function SearchScreen() {
  const sector = useLocationStore((s) => s.sector);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');

  // 400ms debounce hook
  const debouncedTerm = useDebounce(searchTerm, 400);
  const hasMinChars = debouncedTerm.trim().length >= 2;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['search', debouncedTerm.trim(), sector, searchType],
    queryFn: () =>
      searchCatalog({
        q: debouncedTerm.trim(),
        sector: sector || undefined,
        type: searchType,
      }),
    enabled: hasMinChars,
  });

  const searchData = data?.data;

  const shopsList: CustomerShopCard[] =
    searchType === 'shops'
      ? (searchData as SearchShopsResponse)?.shops || []
      : searchType === 'all'
      ? (searchData as SearchAllResponse)?.shops || []
      : [];

  const productsList: SearchProductItem[] =
    searchType === 'products'
      ? (searchData as SearchProductsResponse)?.products || []
      : searchType === 'all'
      ? (searchData as SearchAllResponse)?.products || []
      : [];

  const isResultsEmpty =
    hasMinChars &&
    !isLoading &&
    shopsList.length === 0 &&
    productsList.length === 0;

  return (
    <Screen style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchTerm ? (
            <TouchableOpacity
              onPress={() => setSearchTerm('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Type Switch Pills */}
        <View style={styles.typePillsRow}>
          {(['all', 'shops', 'products'] as SearchType[]).map((type) => {
            const isSelected = searchType === type;
            const label =
              type === 'all'
                ? t('searchTypeAll')
                : type === 'shops'
                ? t('searchTypeShops')
                : t('searchTypeProducts');

            return (
              <TouchableOpacity
                key={type}
                style={[styles.typePill, isSelected && styles.typePillActive]}
                onPress={() => setSearchType(type)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.typePillText,
                    isSelected && styles.typePillTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content Area */}
      {!hasMinChars ? (
        <View style={styles.promptContainer}>
          <Text style={styles.promptIcon}>⌨️</Text>
          <Text style={styles.promptText}>{t('searchMinChars')}</Text>
        </View>
      ) : isLoading || (isFetching && !data) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      ) : isError ? (
        <ErrorView
          message={(error as Error)?.message}
          onRetry={() => refetch()}
        />
      ) : isResultsEmpty ? (
        <EmptyView
          title={t('searchEmptyTitle')}
          subtitle={t('searchEmptySubtitle', { query: debouncedTerm })}
          icon="📦"
        />
      ) : (
        <FlatList
          data={[1]} // Single virtual list to cleanly render sections
          keyExtractor={() => 'search-content'}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
          renderItem={() => (
            <View>
              {/* Shops Section */}
              {shopsList.length > 0 ? (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionHeader}>
                    Shops ({shopsList.length})
                  </Text>
                  {shopsList.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))}
                </View>
              ) : null}

              {/* Products Section */}
              {productsList.length > 0 ? (
                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionHeader}>
                    Products ({productsList.length})
                  </Text>
                  {productsList.map((prod) => (
                    <ListingItem
                      key={prod.listing_id}
                      sellerId={prod.seller_id}
                      sellerName={prod.shop_name}
                      isShopAcceptingOrders={prod.shop_accepting_orders}
                      listing={{
                        listing_id: prod.listing_id,
                        global_product_id: 0,
                        name: prod.product_name,
                        description: null,
                        unit_type: null,
                        image: prod.image,
                        price: prod.price,
                        stock_quantity: prod.in_stock ? 99 : 0,
                        in_stock: prod.in_stock,
                        category: null,
                        is_favorite: false,
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        />
      )}

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
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.screen,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardMuted,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    paddingVertical: 8,
  },
  clearIcon: {
    fontSize: 16,
    color: theme.colors.textMuted,
    padding: 4,
  },
  typePillsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    marginBottom: 4,
  },
  typePill: {
    flex: 1,
    minHeight: 38,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardMuted,
  },
  typePillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typePillText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  typePillTextActive: {
    color: theme.colors.textInverse,
  },
  promptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  promptIcon: {
    fontSize: 48,
  },
  promptText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  resultsContent: {
    paddingHorizontal: theme.spacing.screen,
    paddingTop: theme.spacing.md,
    paddingBottom: 90,
  },
  sectionWrap: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
});
