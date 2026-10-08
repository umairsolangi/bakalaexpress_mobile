import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import {
  getRiderDashboard,
  updateRiderStatus,
  getAvailableOrders,
  getCurrentOrders,
  acceptRiderOrder,
  pickupRiderOrder,
  deliverRiderOrder,
  getRiderHistory,
} from '../../../api/rider';
import {
  RiderAvailableOrder,
  RiderDashboardData,
  RiderHistoryOrder,
  RiderOrderDetail,
  RiderProfile,
} from '../../../api/types';
import { Screen } from '../../../components/Screen';
import { Header } from '../../../components/Header';
import { Badge } from '../../../components/Badge';
import { Button } from '../../../components/Button';
import { EmptyView } from '../../../components/EmptyView';
import { formatMoney } from '../../../utils/money';
import { theme } from '../../../theme';
import { t } from '../../../i18n';

export const RiderHomeScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user) as RiderProfile | null;
  const isApproved = user?.is_approved === true;

  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'history'>('active');

  // Dashboard & Status State
  const [dashboard, setDashboard] = useState<RiderDashboardData | null>(null);
  const [isOnline, setIsOnline] = useState(user?.status === 'online');
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Lists
  const [activeOrders, setActiveOrders] = useState<RiderOrderDetail[]>([]);
  const [availableOrders, setAvailableOrders] = useState<RiderAvailableOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<RiderHistoryOrder[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchDashboardAndActive = useCallback(async () => {
    try {
      const [dashRes, currentRes] = await Promise.all([
        getRiderDashboard(),
        getCurrentOrders(),
      ]);

      if (dashRes.data) {
        setDashboard(dashRes.data);
        setIsOnline(dashRes.data.rider.status === 'online');
      }
      if (currentRes.data) {
        setActiveOrders(currentRes.data);
      }
    } catch {
      // Quiet on error
    }
  }, []);

  const fetchTabContent = useCallback(async () => {
    try {
      if (activeTab === 'active') {
        const res = await getCurrentOrders();
        setActiveOrders(res.data || []);
      } else if (activeTab === 'available') {
        if (isOnline) {
          const res = await getAvailableOrders();
          setAvailableOrders(res.data || []);
        } else {
          setAvailableOrders([]);
        }
      } else if (activeTab === 'history') {
        const res = await getRiderHistory();
        setHistoryOrders(res.data || []);
      }
    } catch {
      // Quiet on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, isOnline]);

  useEffect(() => {
    fetchDashboardAndActive();
    fetchTabContent();
  }, [fetchDashboardAndActive, fetchTabContent]);

  // Polling available orders every 7 seconds when rider is online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      fetchDashboardAndActive();
      if (activeTab === 'available') {
        getAvailableOrders().then((res) => {
          if (res.data) setAvailableOrders(res.data);
        }).catch(() => {});
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [isOnline, activeTab, fetchDashboardAndActive]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardAndActive();
    fetchTabContent();
  };

  const handleToggleStatus = async () => {
    const nextStatus = isOnline ? 'offline' : 'online';
    setIsTogglingStatus(true);
    try {
      const res = await updateRiderStatus(nextStatus);
      if (res.data) {
        setIsOnline(res.data.status === 'online');
        Alert.alert(
          'Status Updated',
          nextStatus === 'online'
            ? 'You are now Online. Orders ready for pickup will appear in Available Orders.'
            : 'You are now Offline.'
        );
      }
    } catch (err: any) {
      Alert.alert('Status Error', err?.message || 'Could not update rider status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    setActionLoadingId(orderId);
    try {
      const res = await acceptRiderOrder(orderId);
      if (res.data) {
        Alert.alert('Order Accepted! 🛵', `You have accepted Order #${orderId}. Please proceed to the shop for pickup.`);
        setActiveTab('active');
        fetchDashboardAndActive();
      }
    } catch (err: any) {
      Alert.alert('Accept Failed', err?.message || 'Order could not be accepted.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePickupOrder = async (orderId: number) => {
    Alert.alert(
      'Confirm Pickup',
      `Have you collected all items for Order #${orderId} from the shop?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Pickup',
          onPress: async () => {
            setActionLoadingId(orderId);
            try {
              const res = await pickupRiderOrder(orderId);
              if (res.data) {
                Alert.alert('Picked Up! 📦', 'Order marked as picked up. Deliver to customer doorstep.');
                fetchDashboardAndActive();
              }
            } catch (err: any) {
              Alert.alert('Pickup Failed', err?.message || 'Could not update status.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeliverOrder = async (orderId: number, collectAmount: string) => {
    Alert.alert(
      'Complete Delivery & Collect Cash',
      `Collect PKR ${collectAmount} (Cash on Delivery) from customer before confirming.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivery 🎉',
          onPress: async () => {
            setActionLoadingId(orderId);
            try {
              const res = await deliverRiderOrder(orderId);
              if (res.data) {
                Alert.alert('Delivered! 🎉', `Order #${orderId} successfully completed.`);
                fetchDashboardAndActive();
              }
            } catch (err: any) {
              Alert.alert('Delivery Failed', err?.message || 'Could not complete delivery.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const renderActiveCard = ({ item }: { item: RiderOrderDetail }) => {
    const isPickupStage = item.can_pickup;
    const isDeliverStage = item.can_deliver;
    const isActionLoading = actionLoadingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardOrderId}>Order #{item.id}</Text>
            <Text style={styles.cardSubtitle}>
              {isPickupStage ? 'Step 1: Pickup from Shop' : 'Step 2: Deliver to Customer'}
            </Text>
          </View>
          <Badge
            label={item.status_label}
            variant={isPickupStage ? 'warning' : 'info'}
          />
        </View>

        <View style={styles.divider} />

        {/* Shop Address */}
        <View style={styles.locationBlock}>
          <Text style={styles.locLabel}>🏪 SHOP PICKUP</Text>
          <Text style={styles.locName}>{item.seller.name}</Text>
          <Text style={styles.locAddress}>{item.seller.address || `Sector ${item.seller.sector || 'Baldia'}`}</Text>
        </View>

        {/* Customer Address */}
        <View style={styles.locationBlock}>
          <Text style={styles.locLabel}>📍 CUSTOMER DROP-OFF</Text>
          <Text style={styles.locName}>{item.customer.name}</Text>
          <Text style={styles.locAddress}>{item.customer.address}</Text>
          {item.customer.phone ? (
            <Text style={styles.customerPhone}>📞 {item.customer.phone}</Text>
          ) : null}
          {item.customer.delivery_instructions ? (
            <Text style={styles.deliveryNote}>"{item.customer.delivery_instructions}"</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Cash to Collect */}
        <View style={styles.codRow}>
          <Text style={styles.codLabel}>Cash to Collect (COD):</Text>
          <Text style={styles.codValue}>{formatMoney(item.amount_to_collect)}</Text>
        </View>

        {/* Action Button */}
        {isPickupStage ? (
          <Button
            title={isActionLoading ? 'Updating...' : 'Confirm Items Picked Up 📦'}
            onPress={() => handlePickupOrder(item.id)}
            loading={isActionLoading}
            style={styles.actionBtn}
          />
        ) : isDeliverStage ? (
          <Button
            title={isActionLoading ? 'Updating...' : `Delivered & Collected ${formatMoney(item.amount_to_collect)} 🎉`}
            onPress={() => handleDeliverOrder(item.id, item.amount_to_collect)}
            loading={isActionLoading}
            variant="secondary"
            style={styles.actionBtn}
          />
        ) : null}
      </View>
    );
  };

  const renderAvailableCard = ({ item }: { item: RiderAvailableOrder }) => {
    const isActionLoading = actionLoadingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardOrderId}>Order #{item.id}</Text>
            <Text style={styles.cardSubtitle}>
              {item.item_count} items ready for pickup
            </Text>
          </View>
          <Badge label="Ready for Pickup" variant="warning" />
        </View>

        <View style={styles.divider} />

        <View style={styles.locationBlock}>
          <Text style={styles.locLabel}>🏪 SHOP</Text>
          <Text style={styles.locName}>{item.seller.name}</Text>
          <Text style={styles.locAddress}>
            {item.seller.full_address || `Sector ${item.seller.sector || 'Baldia'}`}
          </Text>
        </View>

        <View style={styles.locationBlock}>
          <Text style={styles.locLabel}>📍 DESTINATION AREA</Text>
          <Text style={styles.locAddress}>
            {item.customer_area_hint || 'Baldia Town customer'}
          </Text>
        </View>

        <View style={styles.codRow}>
          <Text style={styles.codLabel}>Cash to Collect:</Text>
          <Text style={styles.codValue}>{formatMoney(item.amount_to_collect)}</Text>
        </View>

        <Button
          title={isActionLoading ? 'Claiming...' : 'Accept Delivery 🛵'}
          onPress={() => handleAcceptOrder(item.id)}
          loading={isActionLoading}
          style={styles.actionBtn}
        />
      </View>
    );
  };

  const renderHistoryCard = ({ item }: { item: RiderHistoryOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardOrderId}>Order #{item.id}</Text>
          <Text style={styles.cardSubtitle}>
            {item.delivered_at ? new Date(item.delivered_at).toLocaleString() : ''}
          </Text>
        </View>
        <Badge label="Delivered" variant="success" />
      </View>

      <View style={styles.divider} />

      <Text style={styles.historyDetail}>Merchant: {item.seller_name}</Text>
      <Text style={styles.historyDetail}>Customer: {item.customer_name} ({item.customer_area_hint || 'Baldia Town'})</Text>

      <View style={styles.codRow}>
        <Text style={styles.codLabel}>Cash Collected:</Text>
        <Text style={styles.codValue}>{formatMoney(item.total_amount)}</Text>
      </View>
    </View>
  );

  return (
    <Screen style={styles.container}>
      {/* Top Header */}
      <Header
        title="Rider Dashboard"
        rightElement={
          <TouchableOpacity
            style={styles.accountIconBtn}
            onPress={() => router.push('/(rider)/account' as any)}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        }
      />

      {/* Online / Offline Switch Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusIndicator, isOnline ? styles.onlineIndicator : styles.offlineIndicator]} />
          <View>
            <Text style={styles.riderName}>{user?.name || 'Rider Partner'}</Text>
            <Text style={styles.statusText}>{isOnline ? 'Online • Ready for orders' : 'Offline • Not receiving orders'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, isOnline ? styles.toggleBtnOffline : styles.toggleBtnOnline]}
          onPress={handleToggleStatus}
          disabled={isTogglingStatus}
        >
          {isTogglingStatus ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.toggleBtnText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{dashboard?.today_delivered_count ?? 0}</Text>
          <Text style={styles.statLabel}>Today's Trips</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{formatMoney(dashboard?.today_earnings ?? '0.00')}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'active' && styles.tabButtonTextActive]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'available' && styles.tabButtonActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'available' && styles.tabButtonTextActive]}>
            Available ({availableOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Lists */}
      {activeTab === 'active' ? (
        <FlatList
          data={activeOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderActiveCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <EmptyView
              title="No Active Orders"
              subtitle="You don't have any ongoing deliveries. Check Available Orders to accept incoming requests."
              icon="🛵"
              actionTitle="View Available Orders"
              onAction={() => setActiveTab('available')}
            />
          }
        />
      ) : activeTab === 'available' ? (
        <FlatList
          data={availableOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAvailableCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <EmptyView
              title={isOnline ? 'No Orders Ready Right Now' : 'You are Currently Offline'}
              subtitle={
                isOnline
                  ? 'Orders will appear here as soon as partner shops mark them ready for pickup.'
                  : 'Tap "Go Online" at the top to receive nearby delivery requests in Baldia Town.'
              }
              icon={isOnline ? '⏳' : '💤'}
              actionTitle={!isOnline ? 'Go Online' : undefined}
              onAction={!isOnline ? handleToggleStatus : undefined}
            />
          }
        />
      ) : (
        <FlatList
          data={historyOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderHistoryCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <EmptyView
              title="No Completed Trips"
              subtitle="Your successfully delivered customer orders will be listed here."
              icon="📜"
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  accountIconBtn: {
    padding: 6,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.screen,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  onlineIndicator: {
    backgroundColor: '#10B981',
  },
  offlineIndicator: {
    backgroundColor: '#94A3B8',
  },
  riderName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  toggleBtnOnline: {
    backgroundColor: theme.colors.primary,
  },
  toggleBtnOffline: {
    backgroundColor: '#64748B',
  },
  toggleBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  statsRow: {
    flexDirection: 'row',
    padding: theme.spacing.screen,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  statNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.fontSize.xs,
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
    gap: theme.spacing.xs,
    ...theme.shadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardOrderId: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 6,
  },
  locationBlock: {
    gap: 2,
    marginVertical: 2,
  },
  locLabel: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  locName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  locAddress: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  customerPhone: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
    marginTop: 2,
  },
  deliveryNote: {
    fontSize: theme.fontSize.xs,
    color: '#D97706',
    fontStyle: 'italic',
    marginTop: 2,
  },
  codRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginVertical: 4,
  },
  codLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: '#92400E',
  },
  codValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: '#92400E',
  },
  historyDetail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  actionBtn: {
    marginTop: theme.spacing.xs,
  },
});
