import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getActiveOrders, getOrderHistory } from '../../src/api/orders';
import { OrderListItem } from '../../src/api/types';
import { Screen } from '../../src/components/Screen';
import { Header } from '../../src/components/Header';
import { Badge } from '../../src/components/Badge';
import { EmptyView } from '../../src/components/EmptyView';
import { LoadingView } from '../../src/components/LoadingView';
import { formatMoney } from '../../src/utils/money';
import { theme } from '../../src/theme';

export default function OrdersListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [activeOrders, setActiveOrders] = useState<OrderListItem[]>([]);
  const [historyOrders, setHistoryOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      if (activeTab === 'active') {
        const res = await getActiveOrders();
        setActiveOrders(res.data || []);
      } else {
        const res = await getOrderHistory();
        setHistoryOrders(res.data || []);
      }
    } catch {
      // Ignore network errors gracefully on poll
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setIsLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const currentList = activeTab === 'active' ? activeOrders : historyOrders;

  const renderBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      default:
        return 'info';
    }
  };

  const renderOrderItem = ({ item }: { item: OrderListItem }) => {
    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/orders/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.shopMetaRow}>
            {item.seller.image ? (
              <Image source={{ uri: item.seller.image }} style={styles.shopImage} />
            ) : (
              <View style={styles.shopImageFallback}>
                <Text style={styles.shopFallbackIcon}>🏪</Text>
              </View>
            )}
            <View style={styles.shopInfo}>
              <Text style={styles.shopName} numberOfLines={1}>
                {item.seller.name}
              </Text>
              <Text style={styles.orderDate}>
                Order #{item.id} • {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
              </Text>
            </View>
          </View>
          <Badge
            label={item.status_label}
            variant={renderBadgeVariant(item.status)}
          />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <Text style={styles.itemCountText}>
            {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
          </Text>

          <View style={styles.footerRight}>
            {item.unread_messages > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>💬 {item.unread_messages} new</Text>
              </View>
            ) : null}
            <Text style={styles.totalAmountText}>{formatMoney(item.total_amount)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={styles.container}>
      <Header
        title="My Orders"
        showBack
        onBack={() => router.back()}
      />

      {/* Tabs Switcher */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'active' && styles.tabButtonTextActive,
            ]}
          >
            Active Orders {activeOrders.length > 0 ? `(${activeOrders.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'history' && styles.tabButtonTextActive,
            ]}
          >
            Past Orders
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderItem}
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
              title={activeTab === 'active' ? 'No Active Orders' : 'No Order History'}
              subtitle={
                activeTab === 'active'
                  ? 'You do not have any ongoing grocery deliveries.'
                  : 'Your completed or past grocery orders will appear here.'
              }
              icon="📦"
              actionTitle="Browse Shops"
              onAction={() => router.push('/(tabs)')}
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
  orderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  shopImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  shopImageFallback: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  shopFallbackIcon: {
    fontSize: 20,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  orderDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  unreadBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  unreadText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: theme.fontWeight.bold,
  },
  totalAmountText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
});
