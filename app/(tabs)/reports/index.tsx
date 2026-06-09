import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateShort, getDateRange } from '../../../utils/formatDate';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useSaleStore } from '../../../store/useSaleStore';
import { useDebtStore } from '../../../store/useDebtStore';
import { RevenueChart } from '../../../components/charts/RevenueChart';
import { TopProductsChart } from '../../../components/charts/TopProductsChart';
import * as saleDb from '../../../db/sales';
import * as expensesDb from '../../../db/expenses';

type DateFilter = 'today' | 'week' | 'month';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);
  const shopName = useSettingsStore((s) => s.shopName);
  const { getSalesStats, getSalesByDateRange } = useSaleStore();
  const { getTotalOutstandingDebt } = useDebtStore();

  const [filter, setFilter] = useState<DateFilter>('today');
  const [stats, setStats] = useState({ total_revenue: 0, total_transactions: 0, total_cost: 0 });
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [debtOutstanding, setDebtOutstanding] = useState(0);
  const [revenueData, setRevenueData] = useState<{ label: string; value: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(() => {
    const { start, end } = getDateRange(filter);
    const salesStats = getSalesStats(start, end);
    setStats(salesStats);
    setExpensesTotal(expensesDb.getExpensesStats(start, end).total);
    setDebtOutstanding(getTotalOutstandingDebt());

    const sales = getSalesByDateRange(start, end);
    const dayData: Record<string, number> = {};
    const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {};

    for (const sale of sales) {
      const key = sale.created_at?.split('T')[0] || 'unknown';
      dayData[key] = (dayData[key] || 0) + sale.total_amount;

      const items = saleDb.getSaleItems(sale.id);
      for (const item of items) {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: item.product_name || `#${item.product_id}`, quantity: 0, revenue: 0 };
        }
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].revenue += item.subtotal;
      }
    }

    const sortedDays = Object.entries(dayData).sort(([a], [b]) => a.localeCompare(b)).slice(-(filter === 'today' ? 1 : filter === 'week' ? 7 : 30));
    setRevenueData(sortedDays.map(([d, v]) => ({ label: formatDateShort(d), value: Math.round(v) })));
    setTopProducts(Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10));
    setLoaded(true);
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = async () => {
    const dateRangeStr = { today: t('reports.today'), week: t('reports.week'), month: t('reports.month') }[filter];
    const netProfit = stats.total_revenue - (stats.total_cost ?? 0) - expensesTotal;
    const text = `${t('reports.salesReport')} - ${shopName}\n${dateRangeStr}\n\n${t('reports.revenue')}: ${formatCurrency(stats.total_revenue, currencyLabel)}\n${t('reports.expenses')}: ${formatCurrency(expensesTotal, currencyLabel)}\n${t('reports.netProfit')}: ${formatCurrency(netProfit, currencyLabel)}\n${t('reports.transactions')}: ${stats.total_transactions}`;
    await Share.share({ title: t('reports.salesReport'), message: text });
  };

  const netProfit = stats.total_revenue - (stats.total_cost ?? 0) - expensesTotal;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('reports.title')}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <MaterialCommunityIcons name="file-export" size={18} color={colors.primary} />
            <Text style={styles.exportText}>{t('reports.export')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['today', 'week', 'month'] as DateFilter[]).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'today' ? t('reports.today') : f === 'week' ? t('reports.week') : t('reports.month')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loaded && (
        <>
          <View style={styles.statsGrid}>
            {[
              { label: t('reports.revenue'), value: formatCurrency(stats.total_revenue, currencyLabel), color: colors.textPrimary },
              { label: t('reports.expenses'), value: formatCurrency(expensesTotal, currencyLabel), color: colors.danger },
              { label: t('reports.netProfit'), value: formatCurrency(netProfit, currencyLabel), color: netProfit >= 0 ? colors.success : colors.danger },
              { label: t('reports.transactions'), value: stats.total_transactions.toString(), color: colors.textPrimary },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              </View>
            ))}
          </View>

          {revenueData.length > 0 && <RevenueChart data={revenueData} />}

          {topProducts.length > 0 && <TopProductsChart data={topProducts} />}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('reports.debtSummary')}</Text>
            <View style={styles.debtCard}>
              <Text style={styles.debtLabel}>{t('reports.outstandingDebt')}</Text>
              <Text style={styles.debtValue}>{formatCurrency(debtOutstanding, currencyLabel)}</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  title: { ...typography.heading2, color: colors.textPrimary },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  exportText: { ...typography.button, color: colors.primary },
  filterRow: { flexDirection: 'row', marginHorizontal: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 2 },
  filterBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md - 2 },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { ...typography.button, color: colors.textSecondary },
  filterTextActive: { color: '#FFF' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  statValue: { ...typography.heading4, marginTop: spacing.xs },
  section: { margin: spacing.md, marginBottom: spacing.xxl },
  sectionTitle: { ...typography.heading4, color: colors.textPrimary, marginBottom: spacing.sm },
  debtCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFEBEE', padding: spacing.md, borderRadius: borderRadius.lg },
  debtLabel: { ...typography.body1, color: colors.danger },
  debtValue: { ...typography.heading4, color: colors.danger, fontWeight: '700' },
});
