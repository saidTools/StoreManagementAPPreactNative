import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { t } from '../../i18n';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { Sale, SaleItem } from '../../types';

interface InvoicePreviewProps {
  sale: Sale;
  items: SaleItem[];
  onShare?: () => void;
  onPrint?: () => void;
}

export const InvoicePreview = ({ sale, items, onShare, onPrint }: InvoicePreviewProps) => {
  const shopName = useSettingsStore((s) => s.shopName);
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="receipt" size={24} color={colors.primary} />
        <Text style={styles.title}>{t('invoice.title')}</Text>
      </View>

      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{shopName}</Text>
        <Text style={styles.date}>{formatDateTime(sale.created_at)}</Text>
      </View>

      <View style={styles.divider} />

      {items.map((item, index) => (
        <View key={item.id || index} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.product_name || `Product #${item.product_id}`}</Text>
            <Text style={styles.itemMeta}>x{item.quantity} @ {formatCurrency(item.unit_price, currencyLabel)}</Text>
          </View>
          <Text style={styles.itemSubtotal}>{formatCurrency(item.subtotal, currencyLabel)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('invoice.subtotal')}</Text>
        <Text style={styles.totalValue}>{formatCurrency(sale.total_amount + sale.discount, currencyLabel)}</Text>
      </View>

      {sale.discount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('invoice.discount')}</Text>
          <Text style={[styles.totalValue, styles.discountValue]}>-{formatCurrency(sale.discount, currencyLabel)}</Text>
        </View>
      )}

      <View style={[styles.totalRow, styles.finalTotal]}>
        <Text style={styles.finalLabel}>{t('invoice.total')}</Text>
        <Text style={styles.finalValue}>{formatCurrency(sale.total_amount, currencyLabel)}</Text>
      </View>

      <View style={styles.paymentInfo}>
        <Text style={styles.paymentText}>{t('invoice.paid')}: {formatCurrency(sale.amount_paid, currencyLabel)}</Text>
        {sale.change_given > 0 && (
          <Text style={styles.paymentText}>{t('invoice.change')}: {formatCurrency(sale.change_given, currencyLabel)}</Text>
        )}
      </View>

      {sale.note && (
        <Text style={styles.note}>{t('invoice.note')}: {sale.note}</Text>
      )}

      {sale.customer_name && (
        <Text style={styles.customer}>{t('invoice.customer')}: {sale.customer_name}</Text>
      )}

      {(onShare || onPrint) && (
        <View style={styles.actions}>
          {onShare && (
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <MaterialCommunityIcons name="share-variant" size={18} color={colors.primary} />
              <Text style={styles.actionText}>{t('invoice.share')}</Text>
            </TouchableOpacity>
          )}
          {onPrint && (
            <TouchableOpacity style={styles.actionButton} onPress={onPrint}>
              <MaterialCommunityIcons name="file-pdf-box" size={18} color={colors.danger} />
              <Text style={styles.actionText}>{t('invoice.pdf')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  shopInfo: {
    marginBottom: spacing.md,
  },
  shopName: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  date: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    ...typography.body2,
    color: colors.textPrimary,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemSubtotal: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  totalValue: {
    ...typography.body2,
    color: colors.textPrimary,
  },
  discountValue: {
    color: colors.success,
  },
  finalTotal: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  finalLabel: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  finalValue: {
    ...typography.heading4,
    color: colors.primary,
  },
  paymentInfo: {
    marginTop: spacing.sm,
  },
  paymentText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  note: {
    ...typography.body2,
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  customer: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
});
