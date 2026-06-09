import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate, formatTime, getDateRange } from '../../../utils/formatDate';
import { useSaleStore } from '../../../store/useSaleStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { generateWhatsAppText } from '../../../utils/generateInvoice';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { resolveShareUri } from '../../../utils/shareUtils';
import type { Sale, SaleItem, ReturnItem } from '../../../types';

const FILTERS = ['All', 'Today', 'Week', 'Month'] as const;
const filterLabels: Record<string, string> = {
  All: t('common.all'),
  Today: t('common.today'),
  Week: t('common.week'),
  Month: t('common.month'),
};

export default function SalesHistoryScreen() {
  const insets = useSafeAreaInsets();
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);
  const { loadSales, getSalesByDateRange, getSaleItems, searchSales } = useSaleStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  useEffect(() => { refreshSales(); }, []);

  const refreshSales = useCallback(() => {
    if (activeFilter === 'All') {
      loadSales(200, 0);
      const allSales = useSaleStore.getState().sales;
      setSales(allSales);
    } else {
      const { start, end } = getDateRange(activeFilter.toLowerCase() as any);
      setSales(getSalesByDateRange(start, end));
    }
  }, [activeFilter]);

  const onRefresh = () => { setRefreshing(true); refreshSales(); setRefreshing(false); };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSales(searchSales(query, 200));
    } else {
      refreshSales();
    }
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setSaleItems(getSaleItems(sale.id));
  };

  const buildInvoiceData = (sale: Sale, items: SaleItem[]) => {
    const shopName = useSettingsStore.getState().shopName;
    return {
      shopName,
      items: items.map((i) => ({
        productName: i.product_name || `#${i.product_id}`,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.subtotal,
      })),
      subtotal: sale.total_amount + sale.discount,
      discount: sale.discount,
      total: sale.total_amount,
      amountPaid: sale.amount_paid,
      changeGiven: sale.change_given,
      customerName: sale.customer_name || undefined,
      note: sale.note || undefined,
    };
  };

  const handleShareWhatsApp = async (sale: Sale, items: SaleItem[]) => {
    const data = buildInvoiceData(sale, items);
    const text = generateWhatsAppText(data);
    Alert.alert(t('sales.shareWhatsApp'), text.length > 200
      ? t('sales.invoiceCopied')
      : text);
  };

  const handlePrintPDF = async (sale: Sale, items: SaleItem[]) => {
    const { generateInvoiceHTML } = await import('../../../utils/generateInvoice');
    const data = buildInvoiceData(sale, items);
    const html = generateInvoiceHTML(data);
    const { uri } = await Print.printToFileAsync({ html });
    const shareUri = await resolveShareUri(uri);
    await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf' });
  };

  const isDebtSale = (sale: Sale): boolean => {
    return sale.amount_paid === 0 && sale.total_amount > 0;
  };

  const handleReturnSale = () => {
    if (!selectedSale) return;
    Alert.alert(
      t('sales.returnSale'),
      t('sales.returnConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('sales.return'),
          style: 'destructive',
          onPress: () => {
            useSaleStore.getState().returnSale(selectedSale.id);
            setSelectedSale(null);
            refreshSales();
            Alert.alert(t('sales.returnCompleted'), t('sales.returnRestored'));
          },
        },
      ]
    );
  };

  if (selectedSale) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => { setSelectedSale(null); setSaleItems([]); }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{t('sales.saleId', { id: selectedSale.id })}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.invoiceCard}>
          <View style={styles.invoiceShopRow}>
            <MaterialCommunityIcons name="store" size={18} color={colors.primary} />
            <Text style={styles.invoiceShop}>{useSettingsStore.getState().shopName}</Text>
          </View>
          <Text style={styles.invoiceDate}>{formatDate(selectedSale.created_at)} at {formatTime(selectedSale.created_at)}</Text>

          {selectedSale.customer_name && (
            <View style={styles.invoiceCustRow}>
              <MaterialCommunityIcons name="account" size={16} color={colors.textSecondary} />
              <Text style={styles.invoiceCust}>{selectedSale.customer_name}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {saleItems.map((item) => (
            <View key={item.id} style={styles.invoiceItemRow}>
              <Text style={styles.invoiceItemName} numberOfLines={1}>
                {item.product_name || `#${item.product_id}`}
              </Text>
              <Text style={styles.invoiceItemQty}>x{item.quantity}</Text>
              <Text style={styles.invoiceItemPrice}>{formatCurrency(item.subtotal, currencyLabel)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.invoiceTotalRow}>
            <Text>{t('sales.subtotal')}</Text>
            <Text>{formatCurrency(selectedSale.total_amount + selectedSale.discount, currencyLabel)}</Text>
          </View>
          {selectedSale.discount > 0 && (
            <View style={styles.invoiceTotalRow}>
              <Text style={{ color: colors.success }}>{t('sales.discount')}</Text>
              <Text style={{ color: colors.success }}>-{formatCurrency(selectedSale.discount, currencyLabel)}</Text>
            </View>
          )}
          <View style={[styles.invoiceTotalRow, styles.invoiceFinalRow]}>
            <Text style={styles.invoiceFinalLabel}>{t('sales.total')}</Text>
            <Text style={styles.invoiceFinalValue}>{formatCurrency(selectedSale.total_amount, currencyLabel)}</Text>
          </View>

          <View style={styles.invoicePaymentRow}>
            <Text>{t('sales.paid')}: {formatCurrency(selectedSale.amount_paid, currencyLabel)}</Text>
            {selectedSale.change_given > 0 && <Text>{t('sales.change')}: {formatCurrency(selectedSale.change_given, currencyLabel)}</Text>}
          </View>

          {isDebtSale(selectedSale) && (
            <View style={styles.debtBadge}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.debtText}>{t('sales.debtSale')}</Text>
            </View>
          )}

          {selectedSale.note && <Text style={styles.invoiceNote}>{t('invoice.note')}: {selectedSale.note}</Text>}

          <View style={styles.invoiceActions}>
            <TouchableOpacity style={styles.invoiceActionBtn} onPress={() => handleShareWhatsApp(selectedSale, saleItems)}>
              <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
              <Text style={styles.invoiceActionText}>{t('sales.whatsapp')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.invoiceActionBtn} onPress={() => handlePrintPDF(selectedSale, saleItems)}>
              <MaterialCommunityIcons name="file-pdf-box" size={18} color={colors.danger} />
              <Text style={styles.invoiceActionText}>{t('sales.pdf')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.returnBtn} onPress={handleReturnSale}>
              <MaterialCommunityIcons name="reply" size={18} color="#FFF" />
              <Text style={styles.returnBtnText}>{t('sales.return')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('sales.title')}</Text>
        <Text style={styles.subtitle}>{sales.length} {t('tabs.sales')}</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => { setActiveFilter(f); setSearchQuery(''); }}
          >
            <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{filterLabels[f]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder={t('sales.search')}
          placeholderTextColor={colors.textDisabled}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.saleCard} onPress={() => handleViewSale(item)}>
            <View style={styles.saleCardLeft}>
              <View style={[styles.saleIcon, isDebtSale(item) ? { backgroundColor: '#FFEBEE' } : { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons
                  name={isDebtSale(item) ? 'account-clock' : 'cash'}
                  size={20}
                  color={isDebtSale(item) ? colors.danger : colors.primary}
                />
              </View>
              <View>
                <Text style={styles.saleAmount}>{formatCurrency(item.total_amount, currencyLabel)}</Text>
                <Text style={styles.saleDate}>{formatDate(item.created_at)}</Text>
              </View>
            </View>
            <View style={styles.saleCardRight}>
              {item.customer_name && <Text style={styles.saleCustomer} numberOfLines={1}>{item.customer_name}</Text>}
              <Text style={styles.saleTime}>{formatTime(item.created_at)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="receipt" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>{t('sales.noSales')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.heading2, color: colors.textPrimary },
  subtitle: { ...typography.body2, color: colors.textSecondary, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { ...typography.body2, color: colors.textSecondary },
  filterChipTextActive: { color: '#FFF', fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body1, color: colors.textPrimary, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  listContent: { paddingBottom: spacing.xxl },
  saleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    marginHorizontal: spacing.md, marginVertical: 3, padding: spacing.md,
    borderRadius: borderRadius.md, ...shadows.sm,
  },
  saleCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  saleIcon: { width: 40, height: 40, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  saleAmount: { ...typography.body1, fontWeight: '600', color: colors.textPrimary },
  saleDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  saleCardRight: { alignItems: 'flex-end', marginRight: spacing.sm },
  saleCustomer: { ...typography.body2, fontWeight: '500', color: colors.primary, maxWidth: 100 },
  saleTime: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyText: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.md },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  detailTitle: { ...typography.heading3, color: colors.textPrimary },
  invoiceCard: { backgroundColor: colors.card, margin: spacing.md, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.md },
  invoiceShopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  invoiceShop: { ...typography.heading4, color: colors.textPrimary, marginLeft: spacing.sm },
  invoiceDate: { ...typography.body2, color: colors.textSecondary, marginBottom: spacing.sm },
  invoiceCustRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  invoiceCust: { ...typography.body2, color: colors.primary, marginLeft: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  invoiceItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  invoiceItemName: { flex: 1, ...typography.body2, color: colors.textPrimary },
  invoiceItemQty: { ...typography.body2, color: colors.textSecondary, marginHorizontal: spacing.sm },
  invoiceItemPrice: { ...typography.body2, fontWeight: '600', color: colors.textPrimary },
  invoiceTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  invoiceFinalRow: { borderTopWidth: 2, borderTopColor: colors.primary, marginTop: spacing.xs, paddingTop: spacing.sm },
  invoiceFinalLabel: { ...typography.heading4, color: colors.textPrimary },
  invoiceFinalValue: { ...typography.heading4, color: colors.primary },
  invoicePaymentRow: { marginTop: spacing.sm },
  debtBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', padding: spacing.sm, borderRadius: borderRadius.md, marginTop: spacing.sm },
  debtText: { ...typography.body2, color: colors.danger, fontWeight: '600', marginLeft: spacing.sm },
  invoiceNote: { ...typography.body2, fontStyle: 'italic', color: colors.textSecondary, marginTop: spacing.sm },
  invoiceActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, justifyContent: 'flex-end' },
  invoiceActionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  invoiceActionText: { ...typography.body2, fontWeight: '600', color: colors.textPrimary },
  returnBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.warning, gap: spacing.xs },
  returnBtnText: { ...typography.body2, fontWeight: '600', color: '#FFF' },
});
