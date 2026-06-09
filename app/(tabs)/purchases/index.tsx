import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { usePurchaseOrderStore } from '../../../store/usePurchaseOrderStore';
import { useSupplierStore } from '../../../store/useSupplierStore';
import { useProductStore } from '../../../store/useProductStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import type { PurchaseOrder, PurchaseOrderItem } from '../../../types';

export default function PurchasesScreen() {
  const insets = useSafeAreaInsets();
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);
  const { orders, loadOrders, createOrder, getOrderById, getOrderItems, cancelOrder } = usePurchaseOrderStore();
  const { suppliers, loadSuppliers } = useSupplierStore();
  const { products, loadProducts } = useProductStore();
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<{ productId: number; productName: string; quantity: string; unitCost: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pdtSearch, setPdtSearch] = useState('');

  useEffect(() => { loadOrders(); loadSuppliers(); loadProducts(); }, []);

  const handleSelectOrder = (o: PurchaseOrder) => {
    setSelectedOrder(o);
    setOrderItems(getOrderItems(o.id));
  };

  const handleCancelOrder = (id: number) => {
    Alert.alert(t('purchases.cancelOrder'), t('purchases.reverseStock'), [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => { cancelOrder(id); setSelectedOrder(null); } },
    ]);
  };

  const handleAddItem = (p: any) => {
    if (cartItems.find((c) => c.productId === p.id)) return;
    setCartItems([...cartItems, { productId: p.id, productName: p.name, quantity: '1', unitCost: p.buy_price.toString() }]);
    setPdtSearch('');
  };

  const handleCreateOrder = () => {
    if (!selectedSupplier) { Alert.alert(t('common.error'), t('purchases.selectSupplier')); return; }
    if (cartItems.length === 0) { Alert.alert(t('common.error'), t('purchases.addAtLeastOne')); return; }
    const items = cartItems.map((c) => ({
      productId: c.productId,
      productName: c.productName,
      quantity: parseInt(c.quantity) || 1,
      unitCost: parseFloat(c.unitCost) || 0,
      subtotal: (parseInt(c.quantity) || 1) * (parseFloat(c.unitCost) || 0),
    }));
    createOrder({ supplierId: selectedSupplier, items });
    setShowForm(false);
    setCartItems([]);
    setSelectedSupplier(null);
    Alert.alert(t('purchases.orderCreated'), t('purchases.stockUpdated'));
  };

  const filteredProducts = pdtSearch
    ? products.filter((p) => p.name.toLowerCase().includes(pdtSearch.toLowerCase()))
    : products;

  if (showForm) {
    return (
      <ScrollView style={[styles.container, { paddingTop: insets.top }]} keyboardShouldPersistTaps="handled">
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.formTitle}>{t('purchases.newOrder')}</Text>
        </View>

        <Text style={styles.label}>{t('purchases.supplier')}</Text>
        <View style={styles.supplierRow}>
          {suppliers.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.supplierChip, selectedSupplier === s.id && styles.supplierChipActive]}
              onPress={() => setSelectedSupplier(s.id)}
            >
              <Text style={[styles.supplierChipText, selectedSupplier === s.id && styles.supplierChipTextActive]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('purchases.addProducts')}</Text>
        <TextInput style={styles.input} value={pdtSearch} onChangeText={setPdtSearch} placeholder={t('purchases.searchProducts')} placeholderTextColor={colors.textDisabled} />
        {filteredProducts.slice(0, 10).map((p) => (
          <TouchableOpacity key={p.id} style={styles.productRow} onPress={() => handleAddItem(p)}>
            <Text style={styles.productRowName}>{p.name}</Text>
            <Text style={styles.productRowPrice}>{formatCurrency(p.buy_price, currencyLabel)}</Text>
          </TouchableOpacity>
        ))}

        {cartItems.length > 0 && (
          <>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>{t('purchases.cartItems')}</Text>
            {cartItems.map((item, idx) => (
              <View key={item.productId} style={styles.cartItemRow}>
                <Text style={styles.cartItemName} numberOfLines={1}>{item.productName}</Text>
                <TextInput style={styles.qtyInput} value={item.quantity} onChangeText={(v) => {
                  const updated = [...cartItems];
                  updated[idx] = { ...updated[idx], quantity: v };
                  setCartItems(updated);
                }} keyboardType="numeric" placeholder={t('purchases.qty')} placeholderTextColor={colors.textDisabled} />
                <TextInput style={styles.qtyInput} value={item.unitCost} onChangeText={(v) => {
                  const updated = [...cartItems];
                  updated[idx] = { ...updated[idx], unitCost: v };
                  setCartItems(updated);
                }} keyboardType="numeric" placeholder={t('purchases.cost')} placeholderTextColor={colors.textDisabled} />
                <TouchableOpacity onPress={() => setCartItems(cartItems.filter((_, i) => i !== idx))}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateOrder}>
              <MaterialCommunityIcons name="check" size={20} color="#FFF" />
              <Text style={styles.createBtnText}>{t('purchases.createOrder')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  }

  if (selectedOrder) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => { setSelectedOrder(null); setOrderItems([]); }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{t('purchases.title')} #{selectedOrder.id}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('purchases.supplier')}</Text>
            <Text style={styles.detailValue}>{selectedOrder.supplier_name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('purchases.date')}</Text>
            <Text style={styles.detailValue}>{formatDate(selectedOrder.created_at)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('purchases.status')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: selectedOrder.status === 'completed' ? '#E8F5E9' : '#FFF3E0' }]}>
              <Text style={{ color: selectedOrder.status === 'completed' ? colors.success : colors.warning, fontWeight: '600', textTransform: 'capitalize' }}>{selectedOrder.status}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          {orderItems.map((item) => (
            <View key={item.id} style={styles.orderItemRow}>
              <Text style={styles.orderItemName} numberOfLines={1}>{item.product_name}</Text>
              <Text style={styles.orderItemQty}>x{item.quantity}</Text>
              <Text style={styles.orderItemCost}>{formatCurrency(item.subtotal, currencyLabel)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('purchases.total')}</Text>
            <Text style={styles.totalValue}>{formatCurrency(selectedOrder.total_amount, currencyLabel)}</Text>
          </View>
          {selectedOrder.status === 'completed' && (
            <TouchableOpacity style={styles.cancelOrderBtn} onPress={() => handleCancelOrder(selectedOrder.id)}>
              <MaterialCommunityIcons name="cancel" size={18} color={colors.danger} />
              <Text style={styles.cancelOrderText}>{t('purchases.cancelReverse')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('purchases.title')}</Text>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderCard} onPress={() => handleSelectOrder(item)}>
            <View style={styles.orderCardLeft}>
              <Text style={styles.orderCardSupplier}>{item.supplier_name || `${t('purchases.supplier')} #${item.supplier_id}`}</Text>
              <Text style={styles.orderCardDate}>{formatDate(item.created_at)}</Text>
            </View>
            <View style={styles.orderCardRight}>
              <Text style={styles.orderCardAmount}>{formatCurrency(item.total_amount, currencyLabel)}</Text>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'completed' ? colors.success : item.status === 'cancelled' ? colors.danger : colors.warning }]} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-list" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>{t('purchases.noOrders')}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.emptyBtnText}>+ {t('purchases.newOrder')}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.heading2, color: colors.textPrimary },
  formHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md },
  formTitle: { ...typography.heading3, color: colors.textPrimary },
  label: { ...typography.body2, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  supplierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md },
  supplierChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  supplierChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  supplierChipText: { ...typography.body2, color: colors.textSecondary },
  supplierChipTextActive: { color: '#FFF', fontWeight: '600' },
  input: { marginHorizontal: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body1, color: colors.textPrimary },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  productRowName: { ...typography.body2, color: colors.textPrimary },
  productRowPrice: { ...typography.body2, color: colors.primary },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  cartItemName: { flex: 1, ...typography.body2, color: colors.textPrimary },
  qtyInput: { width: 60, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, ...typography.body2, color: colors.textPrimary, textAlign: 'center' },
  createBtn: { flexDirection: 'row', backgroundColor: colors.success, borderRadius: borderRadius.md, padding: spacing.md, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, margin: spacing.md, marginTop: spacing.lg },
  createBtnText: { ...typography.button, color: '#FFF' },
  orderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: spacing.md, marginVertical: 3, padding: spacing.md, borderRadius: borderRadius.md, ...shadows.sm },
  orderCardLeft: { flex: 1 },
  orderCardSupplier: { ...typography.body1, fontWeight: '600', color: colors.textPrimary },
  orderCardDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  orderCardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orderCardAmount: { ...typography.body1, fontWeight: '600', color: colors.primary },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyText: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.lg },
  emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md },
  emptyBtnText: { ...typography.button, color: '#FFF' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  detailTitle: { ...typography.heading3, color: colors.textPrimary },
  detailCard: { backgroundColor: colors.card, margin: spacing.md, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  detailLabel: { ...typography.body2, color: colors.textSecondary },
  detailValue: { ...typography.body1, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  orderItemName: { flex: 1, ...typography.body2, color: colors.textPrimary },
  orderItemQty: { ...typography.body2, color: colors.textSecondary, marginHorizontal: spacing.sm },
  orderItemCost: { ...typography.body2, fontWeight: '600', color: colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { ...typography.heading4, color: colors.textPrimary },
  totalValue: { ...typography.heading4, color: colors.primary },
  cancelOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.sm },
  cancelOrderText: { ...typography.body2, color: colors.danger, fontWeight: '600' },
});
