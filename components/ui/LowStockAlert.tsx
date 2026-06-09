import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { t } from '../../i18n';
import type { Product } from '../../types';

interface LowStockAlertProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onDismiss?: () => void;
}

export const LowStockAlert = ({ products, onViewProduct, onDismiss }: LowStockAlertProps) => {
  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="alert" size={20} color={colors.warning} />
          <Text style={styles.title}>{t('lowStock.title')}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{products.length}</Text>
          </View>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {products.slice(0, 5).map((product) => (
        <TouchableOpacity
          key={product.id}
          style={styles.item}
          onPress={() => onViewProduct(product)}
          activeOpacity={0.7}
        >
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>{t('lowStock.stock')}:</Text>
            <Text style={[styles.stockValue, product.quantity === 0 && styles.outOfStock]}>
              {product.quantity}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textDisabled} />
        </TouchableOpacity>
      ))}
      {products.length > 5 && (
        <Text style={styles.moreText}>{t('lowStock.more', { count: products.length - 5 })}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  countBadge: {
    backgroundColor: colors.warning,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  countText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  productName: {
    ...typography.body2,
    color: colors.textPrimary,
    flex: 1,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  stockLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: 4,
  },
  stockValue: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.warning,
  },
  outOfStock: {
    color: colors.danger,
  },
  moreText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
