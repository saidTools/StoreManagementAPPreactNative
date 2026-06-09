import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { useProductStore } from '../../../store/useProductStore';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useSettingsStore } from '../../../store/useSettingsStore';

export default function StockAdjustScreen() {
  const insets = useSafeAreaInsets();
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);
  const { products, loadProducts, updateProduct } = useProductStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newQty, setNewQty] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => { loadProducts(); }, []);

  const selectedProduct = selectedId ? products.find((p) => p.id === selectedId) : null;
  const display = search ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : products;

  const handleAdjust = () => {
    if (!selectedProduct) return;
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty < 0) { Alert.alert(t('common.error'), t('stockAdjust.enterValid')); return; }
    updateProduct(selectedProduct.id, { quantity: qty });
    Alert.alert(t('common.done'), t('stockAdjust.updated', { name: selectedProduct.name, qty }));
    setSelectedId(null);
    setNewQty('');
    setReason('');
  };

  if (selectedProduct) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedId(null); setNewQty(''); }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('stockAdjust.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.productName}>{selectedProduct.name}</Text>
          {selectedProduct.barcode && <Text style={styles.productMeta}>{t('inventory.barcode')}: {selectedProduct.barcode}</Text>}
          <Text style={styles.currentStock}>{t('stockAdjust.current')}: <Text style={styles.currentStockValue}>{selectedProduct.quantity}</Text></Text>

          <Text style={styles.label}>{t('stockAdjust.newQuantity')}</Text>
          <TextInput style={styles.input} value={newQty} onChangeText={setNewQty} keyboardType="numeric" placeholder={t('stockAdjust.enterCount')} placeholderTextColor={colors.textDisabled} autoFocus />

          <Text style={styles.label}>{t('stockAdjust.reasonOptional')}</Text>
          <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder={t('stockAdjust.reasonPlaceholder')} placeholderTextColor={colors.textDisabled} />

          <TouchableOpacity style={styles.saveBtn} onPress={handleAdjust}>
            <MaterialCommunityIcons name="check" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>{t('stockAdjust.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('stockAdjust.stockCount')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder={t('stockAdjust.search')} placeholderTextColor={colors.textDisabled} />
      </View>

      <FlatList
        data={display}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => { setSelectedId(item.id); setNewQty(item.quantity.toString()); }}>
            <View style={styles.productInfo}>
              <Text style={styles.productCardName}>{item.name}</Text>
              <Text style={styles.productCardPrice}>{formatCurrency(item.sell_price, currencyLabel)}</Text>
            </View>
            <View style={[styles.qtyBadge, { backgroundColor: item.quantity <= item.low_stock_threshold ? '#FFF3E0' : '#E8F5E9' }]}>
              <Text style={{ fontWeight: '600', color: item.quantity <= item.low_stock_threshold ? colors.warning : colors.success }}>{item.quantity}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md },
  title: { ...typography.heading3, color: colors.textPrimary, flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  searchInput: { flex: 1, ...typography.body1, color: colors.textPrimary, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: spacing.md, marginVertical: 3, padding: spacing.md, borderRadius: borderRadius.md, ...shadows.sm },
  productInfo: { flex: 1 },
  productCardName: { ...typography.body1, fontWeight: '600', color: colors.textPrimary },
  productCardPrice: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  qtyBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  card: { margin: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.md },
  productName: { ...typography.heading3, color: colors.textPrimary },
  productMeta: { ...typography.body2, color: colors.textSecondary, marginTop: spacing.xs },
  currentStock: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.md },
  currentStockValue: { fontWeight: '700', color: colors.primary, fontSize: 18 },
  label: { ...typography.body2, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, ...typography.body1, color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  saveBtn: { flexDirection: 'row', backgroundColor: colors.success, borderRadius: borderRadius.md, padding: spacing.md, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  saveBtnText: { ...typography.button, color: '#FFF' },
});
