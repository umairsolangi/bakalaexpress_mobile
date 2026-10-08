import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSellerEarnings } from '../../src/api/seller';
import { SellerEarningsData } from '../../src/api/types';
import { theme } from '../../src/theme';

export default function SellerEarningsScreen() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<SellerEarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEarnings = async () => {
    try {
      const res = await getSellerEarnings();
      if (res.data) {
        setEarnings(res.data);
      }
    } catch (e) {
      console.warn('[SellerEarningsScreen] fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEarnings();
  };

  if (isLoading || !earnings) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading earnings summary...</Text>
      </View>
    );
  }

  const { summary, monthly_chart, discounts_note } = earnings;

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
        <Text style={styles.headerTitle}>Earnings & Revenue</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Main Lifetime Sales Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>All-Time Net Sales</Text>
          <Text style={styles.heroAmount}>₨ {summary.all_time}</Text>
          <Text style={styles.heroSubtext}>
            Across {summary.total_completed_orders} completed customer deliveries
          </Text>
        </View>

        {/* Time Period Breakdown Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Today</Text>
            <Text style={styles.gridValue}>₨ {summary.today}</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>This Week</Text>
            <Text style={styles.gridValue}>₨ {summary.this_week}</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>This Month</Text>
            <Text style={styles.gridValue}>₨ {summary.this_month}</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>This Year</Text>
            <Text style={styles.gridValue}>₨ {summary.this_year}</Text>
          </View>
        </View>

        {/* Monthly Breakdown List */}
        {monthly_chart && monthly_chart.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Months Breakdown</Text>
            {monthly_chart.map((item, idx) => (
              <View key={idx} style={styles.monthRow}>
                <View>
                  <Text style={styles.monthName}>{item.month}</Text>
                  <Text style={styles.monthOrders}>{item.orders_count} orders</Text>
                </View>
                <Text style={styles.monthSales}>₨ {item.sales.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Informational Policy Note */}
        {discounts_note ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>ℹ️</Text>
            <Text style={styles.noteText}>{discounts_note}</Text>
          </View>
        ) : null}
      </ScrollView>
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
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadow.md,
  },
  heroLabel: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: theme.fontWeight.medium,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtext: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  gridLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  monthName: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  monthOrders: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  monthSales: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  noteIcon: {
    fontSize: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
});
