import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CustomerShopCard } from '../../api/types';
import { AppImage } from '../../components/AppImage';
import { Badge } from '../../components/Badge';
import { formatShopTime } from '../../utils/date';
import { theme } from '../../theme';
import { t } from '../../i18n';

export interface ShopCardProps {
  shop: CustomerShopCard;
}

export const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const router = useRouter();

  const isAcceptingOrders = Boolean(shop.accepting_orders);
  const hoursText =
    shop.opens_at && shop.closes_at
      ? `${formatShopTime(shop.opens_at)} - ${formatShopTime(shop.closes_at)}`
      : null;

  const handlePress = () => {
    router.push({
      pathname: '/sellers/[id]',
      params: { id: String(shop.id) },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.card, !isAcceptingOrders && styles.closedCard]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <AppImage
          uri={shop.profile_image}
          style={styles.image}
          fallbackText={shop.name}
        />
        <View style={styles.badgeOverlay}>
          {isAcceptingOrders ? (
            <Badge label={t('shopOpenBadge')} variant="success" />
          ) : (
            <Badge label={t('shopClosedBadge')} variant="danger" />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.name, !isAcceptingOrders && styles.closedText]}
            numberOfLines={1}
          >
            {shop.name}
          </Text>
        </View>

        <View style={styles.metaRow}>
          {shop.category ? (
            <Text style={styles.category} numberOfLines={1}>
              {shop.category}
            </Text>
          ) : null}
          {shop.area || shop.sector ? (
            <Text style={styles.area} numberOfLines={1}>
              • {shop.area || `Sector ${shop.sector}`}
            </Text>
          ) : null}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>
              {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : 'New'}
            </Text>
            {shop.rating_count > 0 ? (
              <Text style={styles.ratingCount}>({shop.rating_count})</Text>
            ) : null}
          </View>

          {hoursText ? (
            <Text style={styles.hoursText} numberOfLines={1}>
              🕒 {hoursText}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadow.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closedCard: {
    opacity: 0.68,
    backgroundColor: '#F8FAFC',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
  },
  closedText: {
    color: theme.colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  category: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primaryDark,
    fontWeight: theme.fontWeight.semibold,
  },
  area: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.cardMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  ratingStar: {
    color: '#D97706',
    fontSize: 12,
  },
  ratingText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  ratingCount: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  hoursText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
