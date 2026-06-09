import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate, formatTime, getDateRange } from '../../../utils/formatDate';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useProductStore } from '../../../store/useProductStore';
import { useSaleStore } from '../../../store/useSaleStore';
import { useDebtStore } from '../../../store/useDebtStore';
import { LowStockAlert } from '../../../components/ui/LowStockAlert';
import { StatsCardSkeleton } from '../../../components/ui/LoadingSkeleton';
import type { Product, Sale } from '../../../types';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const shopName = useSettingsStore((s) => s.shopName);
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);
  const { loadProducts, getLowStockProducts } = useProductStore();
  const { loadSales, getTodaySales, getSalesStats, getSaleItems } = useSaleStore();
  const { loadDebts, getTotalOutstandingDebt, getUnpaidDebts } = useDebtStore();

  const [refreshing, setRefreshing] = useState(false);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [stats, setStats] = useState({ total_revenue: 0, total_transactions: 0, total_discount: 0, total_cost: 0 });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [outstandingDebt, setOutstandingDebt] = useState(0);
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number; rev: number }[]>([]);

  const loadData = useCallback(() => {
    loadProducts();
    loadSales();
    loadDebts();
    const { start, end } = getDateRange('today');
    const todayStats = getSalesStats(start, end);
    setStats(todayStats);
    const sales = getTodaySales();
    setTodaySales(sales);
    setRecentSales(sales.slice(0, 5));
    setLowStockProducts(getLowStockProducts());
    setOutstandingDebt(getTotalOutstandingDebt());

    const productMap: Record<number, { name: string; qty: number; rev: number }> = {};
    for (const s of sales) {
      const items = getSaleItems(s.id);
      for (const item of items) {
        if (!productMap[item.product_id]) {
          productMap[item.product_id] = { name: item.product_name || `#${item.product_id}`, qty: 0, rev: 0 };
        }
        productMap[item.product_id].qty += item.quantity;
        productMap[item.product_id].rev += item.subtotal;
      }
    }
    setTopProducts(Object.values(productMap).sort((a, b) => b.rev - a.rev).slice(0, 5));
    setLoaded(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const todayProfit = stats.total_revenue - (stats.total_cost ?? 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View>
          <Text style={styles.greeting}>{t(new Date().getHours() < 12 ? 'dashboard.goodMorning' : new Date().getHours() < 18 ? 'dashboard.goodAfternoon' : 'dashboard.goodEvening')}</Text>
          <Text style={styles.shopName}>{shopName}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.navigate('/settings')}>
          <MaterialCommunityIcons name="cog" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {!loaded ? <StatsCardSkeleton /> : (
        <>
          <View style={styles.statsRow}>
            {[
              { icon: 'currency-usd' as const, bg: '#E8F1FF', color: colors.primary, label: t('dashboard.todaySales'), value: formatCurrency(stats.total_revenue, currencyLabel) },
              { icon: 'chart-line' as const, bg: '#E8F8ED', color: colors.success, label: t('dashboard.profit'), value: formatCurrency(todayProfit, currencyLabel) },
              { icon: 'receipt' as const, bg: '#FFF4E5', color: colors.warning, label: t('dashboard.sales'), value: stats.total_transactions.toString() },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                  <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {lowStockProducts.length > 0 && (
            <LowStockAlert products={lowStockProducts}
              onViewProduct={(p) => router.navigate(`/(tabs)/inventory/${p.id}`)}
            />
          )}

          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.navigate('/(tabs)/pos')}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="cart-plus" size={22} color="#FFF" />
              </View>
              <Text style={styles.actionLabel}>{t('dashboard.newSale')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.navigate('/(tabs)/inventory/add')}>
              <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
                <MaterialCommunityIcons name="package-variant-plus" size={22} color="#FFF" />
              </View>
              <Text style={styles.actionLabel}>{t('dashboard.addProduct')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.navigate('/(tabs)/sales')}>
              <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                <MaterialCommunityIcons name="receipt" size={22} color="#FFF" />
              </View>
              <Text style={styles.actionLabel}>{t('dashboard.sales')}</Text>
            </TouchableOpacity>

          </View>

          {outstandingDebt > 0 && (
            <TouchableOpacity style={styles.debtBanner} onPress={() => router.navigate('/(tabs)/customers')}>
              <View style={styles.debtBannerIcon}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.danger} />
              </View>
              <Text style={styles.debtBannerText}>{formatCurrency(outstandingDebt, currencyLabel)} {t('dashboard.outstandingDebts')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}

          {topProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('dashboard.topProducts')}</Text>
              {topProducts.map((p, i) => (
                <View key={i} style={styles.topProductRow}>
                  <View style={[styles.rankBadge, { backgroundColor: i === 0 ? '#FFD60A' : i === 1 ? '#E5E5EA' : i === 2 ? '#F4A460' : '#F2F2F7' }]}>
                    <Text style={[styles.rankText, { color: i > 2 ? colors.textSecondary : '#1C1C1E' }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.topProductName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.topProductMeta}>x{p.qty} · {formatCurrency(p.rev, currencyLabel)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('dashboard.sales')}</Text>
              <TouchableOpacity onPress={() => router.navigate('/(tabs)/sales')}>
                <Text style={styles.viewAll}>{t('dashboard.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            {recentSales.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="receipt" size={36} color={colors.textDisabled} />
                <Text style={styles.emptyText}>{t('dashboard.noSalesToday')}</Text>
                <TouchableOpacity style={styles.startSellingBtn} onPress={() => router.navigate('/(tabs)/pos')}>
                  <Text style={styles.startSellingText}>{t('dashboard.startSelling')}</Text>
                </TouchableOpacity>
              </View>
            ) : recentSales.map((sale) => (
              <TouchableOpacity key={sale.id} style={styles.saleItem} onPress={() => router.navigate('/(tabs)/sales')}>
                <View style={styles.saleItemLeft}>
                  <View style={[styles.saleDot, { backgroundColor: sale.amount_paid > 0 ? colors.success : colors.warning }]} />
                  <View>
                    <Text style={styles.saleItemAmount}>{formatCurrency(sale.total_amount, currencyLabel)}</Text>
                    <Text style={styles.saleItemTime}>{formatTime(sale.created_at)} · {formatDate(sale.created_at)}</Text>
                  </View>
                </View>
                {sale.customer_name && <Text style={styles.saleItemCustomer}>{sale.customer_name}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, backgroundColor: colors.card,
    borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl,
  },
  greeting: { ...typography.body2, color: colors.textSecondary, marginBottom: 2 },
  shopName: { ...typography.heading1, color: colors.textPrimary },
  settingsBtn: { padding: spacing.sm, backgroundColor: colors.background, borderRadius: borderRadius.full },
  statsRow: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: -spacing.md, gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center', ...shadows.sm,
  },
  statIcon: { width: 36, height: 36, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  statValue: { ...typography.heading4, fontWeight: '800' },
  actionGrid: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md, gap: spacing.sm },
  actionCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center', ...shadows.sm,
  },
  actionIcon: { width: 42, height: 42, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  actionLabel: { ...typography.caption, color: colors.textPrimary, fontWeight: '600', textTransform: 'none' },
  debtBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF2F2',
    marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md,
    borderRadius: borderRadius.lg, gap: spacing.sm,
    borderWidth: 1, borderColor: '#FFD9D9',
  },
  debtBannerIcon: { width: 32, height: 32, borderRadius: borderRadius.full, backgroundColor: '#FFE5E5', justifyContent: 'center', alignItems: 'center' },
  debtBannerText: { flex: 1, ...typography.body2, color: colors.danger, fontWeight: '600' },
  section: { marginTop: spacing.lg, marginHorizontal: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  viewAll: { ...typography.body2, color: colors.primary, fontWeight: '600' },
  sectionTitle: { ...typography.heading4, color: colors.textPrimary },
  topProductRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: borderRadius.md, padding: spacing.sm + 2, marginBottom: spacing.xs, ...shadows.sm, gap: spacing.sm,
  },
  rankBadge: { width: 24, height: 24, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  rankText: { ...typography.caption, fontWeight: '700', fontSize: 11 },
  topProductName: { flex: 1, ...typography.body2, color: colors.textPrimary },
  topProductMeta: { ...typography.caption, color: colors.textSecondary, textTransform: 'none' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: colors.card, borderRadius: borderRadius.lg, ...shadows.sm },
  emptyText: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.md },
  startSellingBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  startSellingText: { ...typography.button, color: '#FFF' },
  saleItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, ...shadows.sm,
  },
  saleItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  saleDot: { width: 8, height: 8, borderRadius: 4 },
  saleItemAmount: { ...typography.body1, fontWeight: '600', color: colors.textPrimary },
  saleItemTime: { ...typography.caption, color: colors.textSecondary, textTransform: 'none', marginTop: 2 },
  saleItemCustomer: { ...typography.body2, color: colors.primary, fontWeight: '500' },
});
