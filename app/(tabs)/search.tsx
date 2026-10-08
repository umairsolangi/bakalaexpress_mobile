import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { searchCatalog, getLocationsMeta } from '../../src/api/browse';
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

const TRENDING_SEARCHES = [
  'Eggs',
  'Milk',
  'Tomatoes',
  'Yogurt',
  'Bananas',
  'Bread',
  'Chicken',
  'Cooking Oil',
  'Rice',
  'Potatoes',
];

const SEARCH_CATEGORIES = [
  { id: 1, name: 'Dairy & Eggs', icon: '🥛' },
  { id: 2, name: 'Vegetables', icon: '🥦' },
  { id: 3, name: 'Drinks', icon: '🧃' },
  { id: 4, name: 'Meat', icon: '🥩' },
  { id: 5, name: 'Grocery', icon: '🛒' },
  { id: 6, name: 'Snacks', icon: '🍫' },
];

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
        {/* Free Delivery Banner (Matches Image 2 Right Phone) */}
        <View style={styles.freeDeliveryPill}>
          <Text style={styles.freeDeliveryIcon}>🛵</Text>
          <Text style={styles.freeDeliveryText}>
            Free delivery on your first order in Baldia Town!
          </Text>
        </View>

        {/* Input Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands, or categories..."
            placeholderTextColor="#9CA3AF"
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

        {/* Filter Pills */}
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
                activeOpacity={0.75}
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
        <ScrollView
          style={styles.preSearchScroll}
          contentContainerStyle={styles.preSearchContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Categories Showcase (Matching Behance) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {SEARCH_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => setSearchTerm(cat.name)}
                activeOpacity={0.75}
              >
                <View style={styles.categoryIconWrap}>
                  <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Trending Searches (Matching Behance) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
          </View>
          <View style={styles.trendingChipsWrap}>
            {TRENDING_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.trendingChip}
                onPress={() => setSearchTerm(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.trendingChipIcon}>🔍</Text>
                <Text style={styles.trendingChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    gap: 8,
  },
  freeDeliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  freeDeliveryIcon: {
    fontSize: 13,
  },
  freeDeliveryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#157B42',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 8,
  },
  clearIcon: {
    fontSize: 15,
    color: '#9CA3AF',
    padding: 4,
  },
  typePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  typePill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  typePillActive: {
    backgroundColor: '#157B42',
    borderColor: '#157B42',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#575757',
  },
  typePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Pre-search state
  preSearchScroll: {
    flex: 1,
  },
  preSearchContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  categoriesScroll: {
    gap: 10,
    paddingBottom: 18,
  },
  categoryCard: {
    width: 76,
    height: 82,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  trendingChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  trendingChipIcon: {
    fontSize: 12,
  },
  trendingChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // Loading & Results
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 90,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
});
