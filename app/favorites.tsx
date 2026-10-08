import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getFavoriteSellers,
  getFavoriteProducts,
  toggleSellerFavorite,
  toggleProductFavorite,
} from '../src/api/profile';
import { CustomerProductListing, CustomerShopCard } from '../src/api/types';
import { Screen } from '../src/components/Screen';
import { Header } from '../src/components/Header';
import { Badge } from '../src/components/Badge';
import { EmptyView } from '../src/components/EmptyView';
import { LoadingView } from '../src/components/LoadingView';
import { formatMoney } from '../src/utils/money';
import { theme } from '../src/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'shops' | 'products'>('shops');

  const [favoriteShops, setFavoriteShops] = useState<CustomerShopCard[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<CustomerProductListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      if (activeTab === 'shops') {
        const res = await getFavoriteSellers();
        setFavoriteShops(res.data || []);
      } else {
        const res = await getFavoriteProducts();
        setFavoriteProducts(res.data || []);
      }
    } catch {
      // Quiet on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setIsLoading(true);
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFavorites();
  };

  const handleRemoveShop = async (sellerId: number, name: string) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${name}" from your favorite shops?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Optimistic update
            setFavoriteShops((prev) => prev.filter((s) => s.id !== sellerId));
            try {
              await toggleSellerFavorite(sellerId);
            } catch {
              fetchFavorites();
            }
          },
        },
      ]
    );
  };

  const handleRemoveProduct = async (listingId: number, name: string) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${name}" from your favorite items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Optimistic update
            setFavoriteProducts((prev) => prev.filter((p) => p.listing_id !== listingId));
            try {
              await toggleProductFavorite(listingId);
            } catch {
              fetchFavorites();
            }
          },
        },
      ]
    );
  };

  const renderShopItem = ({ item }: { item: CustomerShopCard }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/sellers/${item.id}` as any)}
    >
      <View style={styles.cardRow}>
        {item.profile_image ? (
          <Image source={{ uri: item.profile_image }} style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbFallback}>
            <Text style={styles.thumbIcon}>🏪</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.category || 'General Store'} • Sector {item.sector || 'Baldia'}
          </Text>
          <View style={styles.badgeRow}>
            <Badge
              label={item.is_open ? 'Open' : 'Closed'}
              variant={item.is_open ? 'success' : 'danger'}
            />
            {item.average_rating > 0 ? (
              <Text style={styles.ratingText}>
                ★ {item.average_rating.toFixed(1)} ({item.rating_count})
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => handleRemoveShop(item.id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.heartIconActive}>❤️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: CustomerProductListing }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbFallback}>
            <Text style={styles.thumbIcon}>🛒</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>{formatMoney(item.price)}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.category || 'Grocery'} • {item.unit_type || 'Piece'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => handleRemoveProduct(item.listing_id, item.name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.heartIconActive}>❤️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen style={styles.container}>
      <Header title="My Favorites" showBack onBack={() => router.back()} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'shops' && styles.tabButtonActive]}
          onPress={() => setActiveTab('shops')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'shops' && styles.tabButtonTextActive,
            ]}
          >
            Favorite Shops {favoriteShops.length > 0 ? `(${favoriteShops.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'products' && styles.tabButtonActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'products' && styles.tabButtonTextActive,
            ]}
          >
            Favorite Products {favoriteProducts.length > 0 ? `(${favoriteProducts.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingView />
      ) : activeTab === 'shops' ? (
        <FlatList
          data={favoriteShops}
          keyExtractor={(s) => String(s.id)}
          renderItem={renderShopItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyView
              title="No Favorite Shops"
              subtitle="Save your preferred neighborhood stores by tapping the heart icon on their shop page."
              icon="❤️"
              actionTitle="Browse Shops"
              onAction={() => router.push('/(tabs)')}
            />
          }
        />
      ) : (
        <FlatList
          data={favoriteProducts}
          keyExtractor={(p) => String(p.listing_id)}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyView
              title="No Favorite Products"
              subtitle="Add items you buy often to your favorites for quick grocery reordering."
              icon="⭐"
              actionTitle="Browse Products"
              onAction={() => router.push('/(tabs)/search' as any)}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
  },
  tabButtonTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: theme.spacing.screen,
    gap: theme.spacing.md,
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: theme.spacing.md,
  },
  thumbFallback: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  thumbIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  productPrice: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  ratingText: {
    fontSize: theme.fontSize.xs,
    color: '#D97706',
    fontWeight: theme.fontWeight.semibold,
  },
  heartBtn: {
    padding: 8,
    marginLeft: theme.spacing.sm,
  },
  heartIconActive: {
    fontSize: 22,
  },
});
