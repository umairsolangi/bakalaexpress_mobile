import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { CartItem, useCartStore } from '../../store/cartStore';
import { AppImage } from '../../components/AppImage';
import { formatMoney, multiplyMoney } from '../../utils/money';
import { theme } from '../../theme';
import { t } from '../../i18n';

export interface CartItemRowProps {
  item: CartItem;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const incrementQuantity = useCartStore((s) => s.incrementQuantity);
  const decrementQuantity = useCartStore((s) => s.decrementQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineTotal = multiplyMoney(item.unitPrice, item.quantity);

  const handleIncrement = () => {
    const success = incrementQuantity(item.listingId);
    if (!success) {
      Alert.alert(t('cartTitle'), t('itemStockExceeded'));
    }
  };

  const handleRemove = () => {
    removeItem(item.listingId);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <AppImage
          uri={item.image}
          style={styles.image}
          fallbackText={item.name}
        />
      </View>

      <View style={styles.contentWrap}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.unitPrice}>
          {formatMoney(item.unitPrice)} each
        </Text>
        <Text style={styles.lineTotal}>{formatMoney(lineTotal)}</Text>
      </View>

      <View style={styles.actionWrap}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => decrementQuantity(item.listingId)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.stepperMinus}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperCount}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={handleIncrement}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.stepperPlus}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imageWrap: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentWrap: {
    flex: 1,
  },
  name: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  unitPrice: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  lineTotal: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryDark,
  },
  actionWrap: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardMuted,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 36,
    paddingHorizontal: 2,
  },
  stepperButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMinus: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  stepperPlus: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  stepperCount: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
});
