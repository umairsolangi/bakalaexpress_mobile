import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import {
  getCustomerNotifications,
  markCustomerNotificationsRead,
  getSellerNotifications,
  markSellerNotificationsRead,
} from '../src/api/notifications';
import { InAppNotificationItem } from '../src/api/types';
import { theme } from '../src/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);

  const [notifications, setNotifications] = useState<InAppNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res =
        role === 'seller'
          ? await getSellerNotifications()
          : await getCustomerNotifications();

      if (res.data) {
        setNotifications(res.data);
        const unread = Number(res.meta?.unread_count ?? res.data.filter((n) => !n.read_at).length);
        setUnreadCount(unread);
      }
    } catch (e) {
      console.warn('[NotificationsScreen] fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      if (role === 'seller') {
        await markSellerNotificationsRead({ all: true });
      } else {
        await markCustomerNotificationsRead({ all: true });
      }
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.warn('[NotificationsScreen] mark all error:', e);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationPress = async (item: InAppNotificationItem) => {
    // Mark as read in state and call API if unread
    if (!item.read_at) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      if (role === 'seller') {
        markSellerNotificationsRead({ ids: [item.id] }).catch(() => {});
      } else {
        markCustomerNotificationsRead({ ids: [item.id] }).catch(() => {});
      }
    }

    // Navigate to associated order if available
    if (item.order_id) {
      if (role === 'seller') {
        router.push(`/(seller)/orders/${item.order_id}` as any);
      } else {
        router.push(`/orders/${item.order_id}` as any);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={isMarkingAll}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.markAllText}>
              {isMarkingAll ? 'Marking...' : 'Mark all read'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! Order status updates and announcements will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isUnread = !item.read_at;
          const isOrder = item.type === 'order_status' || item.type === 'new_order';

          return (
            <TouchableOpacity
              style={[styles.notificationCard, isUnread && styles.unreadCard]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.iconBox}>
                <Text style={styles.cardIcon}>
                  {isOrder ? '📦' : item.type === 'new_order' ? '🛒' : '📢'}
                </Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]}>
                    {item.title}
                  </Text>
                  {isUnread && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.body}
                </Text>

                <View style={styles.footerRow}>
                  <Text style={styles.timeText}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                  </Text>
                  {item.order_id && (
                    <Text style={styles.viewOrderLink}>View Order →</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: 8,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  markAllText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
    ...theme.shadow.sm,
  },
  unreadCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  cardTitleUnread: {
    fontWeight: theme.fontWeight.bold,
    color: '#065F46',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  cardDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  viewOrderLink: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
