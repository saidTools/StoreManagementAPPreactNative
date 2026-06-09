import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onLongPress?: (product: Product) => void;
}

export const ProductCard = ({ product, onPress, onLongPress }: ProductCardProps) => {
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);
  const isLowStock = product.quantity <= product.low_stock_threshold && product.low_stock_threshold > 0;
  const isOutOfStock = product.quantity <= 0;

  return (
    <TouchableOpacity
      style={[styles.container, isLowStock && styles.lowStockContainer]}
      onPress={() => onPress(product)}
      onLongPress={() => onLongPress?.(product)}
      activeOpacity={0.7}
      accessibilityLabel={`${product.name}, ${product.quantity} in stock, ${formatCurrency(product.sell_price, currencyLabel)}`}
    >
      {product.image_uri ? (
        <Image source={{ uri: product.image_uri }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <MaterialCommunityIcons name="package-variant" size={22} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {product.category && (
          <View style={styles.categoryRow}>
            <View style={styles.categoryDot} />
            <Text style={styles.category}>{product.category}</Text>
          </View>
        )}
        <Text style={styles.price}>{formatCurrency(product.sell_price, currencyLabel)}</Text>
      </View>
      <View style={styles.badgeContainer}>
        <View style={[styles.quantityBadge, isOutOfStock && styles.outOfStockBadge, isLowStock && !isOutOfStock && styles.lowStockBadge]}>
          <Text style={[styles.quantityText, (isLowStock || isOutOfStock) && styles.lowStockQuantityText]}>
            {product.quantity}
          </Text>
        </View>
        {isLowStock && (
          <MaterialCommunityIcons name="alert" size={14} color={colors.warning} style={styles.alertIcon} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    ...shadows.sm,
  },
  lowStockContainer: {
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  imagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  name: { ...typography.body1, color: colors.textPrimary, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  categoryDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginRight: spacing.xs },
  category: { ...typography.caption, color: colors.textSecondary, textTransform: 'none' },
  price: { ...typography.body2, color: colors.primary, fontWeight: '700', marginTop: 4 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center' },
  quantityBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  lowStockBadge: { backgroundColor: colors.warning },
  outOfStockBadge: { backgroundColor: colors.danger },
  quantityText: { ...typography.caption, color: '#FFFFFF', fontWeight: '700' },
  lowStockQuantityText: { color: '#FFFFFF' },
  alertIcon: { marginLeft: spacing.xs },
});
