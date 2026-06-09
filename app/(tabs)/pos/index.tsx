import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, ScrollView, Alert, Dimensions, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { formatCurrency } from '../../../utils/formatCurrency';
import { t } from '../../../i18n';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useProductStore } from '../../../store/useProductStore';
import { useSaleStore } from '../../../store/useSaleStore';
import { useCustomerStore } from '../../../store/useCustomerStore';
import { SearchBar } from '../../../components/ui/SearchBar';
import type { Customer } from '../../../types';

const { height: SCREEN_H } = Dimensions.get('window');

export default function POSScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);
  const { products, loadProducts, searchProducts, getProductByBarcode } = useProductStore();
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, createSale, getCartTotal } = useSaleStore();
  const { customers, loadCustomers } = useCustomerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [checkout, setCheckout] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [amountPaid, setAmountPaid] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'debt'>('cash');
  const [note, setNote] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => { loadProducts(); loadCustomers(); }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchProducts(query);
  };

  const handleAddToCart = (p: any) => {
    if (p.quantity <= 0) { Alert.alert(t('pos.outOfStock')); return; }
    addToCart({ productId: p.id, productName: p.name, quantity: 1, unitPrice: p.sell_price, subtotal: p.sell_price, buyPrice: p.buy_price });
  };

  const handleScanBarcode = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) { Alert.alert(t('common.permission'), t('pos.cameraPermission')); return; }
    }
    setScannerOpen(true);
  };

  const handleBarcodeScanned = (data: string) => {
    setScannerOpen(false);
    const product = getProductByBarcode(data);
    if (!product) { Alert.alert(t('pos.notFound'), t('pos.noProductBarcode', { code: data })); return; }
    handleAddToCart(product);
  };

  const handleBarcodeLookup = () => {
    const code = barcode.trim();
    if (!code) return;
    const product = getProductByBarcode(code);
    if (!product) { Alert.alert(t('pos.notFound'), t('pos.noProductBarcode', { code })); return; }
    handleAddToCart(product);
    setBarcode('');
  };

  const cartTotal = getCartTotal();
  const discountAmount = discountType === 'percentage' ? cartTotal * (discount / 100) : discount;
  const totalAfterDiscount = Math.max(0, cartTotal - discountAmount);

  const handleCheckout = () => {
    if (cart.length === 0) { Alert.alert(t('pos.emptyCart')); return; }
    if (paymentMode === 'debt' && !customer) { Alert.alert(t('pos.selectCustomer'), t('pos.selectCustomerMsg')); return; }
    if (paymentMode === 'cash' && (!amountPaid || parseFloat(amountPaid) < totalAfterDiscount)) {
      Alert.alert(t('pos.insufficientPayment'), t('pos.minPayment', { amount: formatCurrency(totalAfterDiscount, currencyLabel) }));
      return;
    }
    const paid = paymentMode === 'cash' ? parseFloat(amountPaid) : 0;
    const saleId = createSale({
      customerId: customer?.id, totalAmount: totalAfterDiscount, discount: discountAmount,
      amountPaid: paid, changeGiven: Math.max(0, paid - totalAfterDiscount), note: note || undefined,
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.subtotal, buyPrice: i.buyPrice })),
      isDebt: paymentMode === 'debt', debtAmount: paymentMode === 'debt' ? totalAfterDiscount : 0,
    });
    const currentNote = note;
    const currentCustomer = customer;
    const saleItems = cart.map(i => ({ id: 0, sale_id: saleId, product_id: i.productId, product_name: i.productName, quantity: i.quantity, unit_price: i.unitPrice, subtotal: i.subtotal }));
    clearCart(); setCheckout(false); setDiscount(0); setAmountPaid(''); setCustomer(null); setPaymentMode('cash'); setNote('');

    const sale = { id: saleId, customer_id: currentCustomer?.id ?? null, total_amount: totalAfterDiscount, discount: discountAmount, amount_paid: paid, change_given: Math.max(0, paid - totalAfterDiscount), note: currentNote || null, created_at: new Date().toISOString(), customer_name: currentCustomer?.name };

    Alert.alert(t('pos.saleCompleted'), t('pos.printReceipt'), [
      { text: t('common.skip'), style: 'cancel' },
      { text: t('pos.printPDF'), onPress: async () => {
          const { printReceiptPDF } = await import('../../../utils/printReceipt');
          await printReceiptPDF(sale, saleItems);
      }},
      { text: t('pos.printThermal'), onPress: async () => {
          const { printThermalReceipt } = await import('../../../utils/printReceipt');
          await printThermalReceipt(sale, saleItems);
      }},
    ]);
  };

  const displayProducts = searchQuery ? products : products.slice(0, 50);

  return checkout ? (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} keyboardShouldPersistTaps="handled">
      <Text style={styles.checkoutTitle}>{t('pos.checkout')}</Text>
      {cart.map(item => (
        <View key={item.productId} style={styles.cRow}>
          <Text style={styles.cName}>{item.productName}</Text>
          <Text style={styles.cQty}>x{item.quantity}</Text>
          <Text style={styles.cPrice}>{formatCurrency(item.subtotal, currencyLabel)}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.cTotal}><Text>{t('pos.subtotal')}</Text><Text>{formatCurrency(cartTotal, currencyLabel)}</Text></View>

      <Text style={styles.label}>{t('pos.discount')}</Text>
      <View style={styles.discountRow}>
        <TouchableOpacity style={[styles.dBtn, discountType === 'fixed' && styles.dBtnActive]} onPress={() => setDiscountType('fixed')}><Text style={[styles.dBtnText, discountType === 'fixed' && styles.dBtnTextActive]}>DA</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.dBtn, discountType === 'percentage' && styles.dBtnActive]} onPress={() => setDiscountType('percentage')}><Text style={[styles.dBtnText, discountType === 'percentage' && styles.dBtnTextActive]}>%</Text></TouchableOpacity>
      </View>
      <TextInput style={styles.input} value={discount > 0 ? discount.toString() : ''} onChangeText={v => setDiscount(parseFloat(v) || 0)} placeholder="0" keyboardType="numeric" placeholderTextColor={colors.textDisabled} />

      <View style={styles.cTotal}><Text style={styles.totalLabel}>{t('pos.total')}</Text><Text style={styles.totalValue}>{formatCurrency(totalAfterDiscount, currencyLabel)}</Text></View>

      <Text style={styles.label}>{t('pos.payment')}</Text>
      <View style={styles.payRow}>
        <TouchableOpacity style={[styles.payBtn, paymentMode === 'cash' && styles.payBtnActive]} onPress={() => setPaymentMode('cash')}>
          <MaterialCommunityIcons name="cash" size={20} color={paymentMode === 'cash' ? '#FFF' : colors.textPrimary} />
          <Text style={[styles.payBtnText, paymentMode === 'cash' && styles.payBtnTextActive]}>{t('pos.cash')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.payBtn, paymentMode === 'debt' && styles.payBtnActive]} onPress={() => setPaymentMode('debt')}>
          <MaterialCommunityIcons name="account-clock" size={20} color={paymentMode === 'debt' ? '#FFF' : colors.textPrimary} />
          <Text style={[styles.payBtnText, paymentMode === 'debt' && styles.payBtnTextActive]}>{t('pos.debt')}</Text>
        </TouchableOpacity>
      </View>

      {paymentMode === 'debt' && (
        <FlatList data={customers} keyExtractor={i => i.id.toString()} style={styles.customerList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.custOpt, customer?.id === item.id && styles.custOptSel]} onPress={() => setCustomer(item)}>
              <Text>{item.name}</Text>
              {item.total_debt > 0 && <Text style={styles.custDebt}>{formatCurrency(item.total_debt, currencyLabel)}</Text>}
            </TouchableOpacity>
          )}
        />
      )}

      {paymentMode === 'cash' && (
        <TextInput style={[styles.input, styles.amountInput]} value={amountPaid} onChangeText={setAmountPaid}
          placeholder={`${t('pos.amount')} in ${currencyLabel}`} keyboardType="numeric" placeholderTextColor={colors.textDisabled} autoFocus />
      )}

      <TextInput style={[styles.input, { minHeight: 50, textAlignVertical: 'top', marginTop: spacing.md }]}
        value={note} onChangeText={setNote} placeholder={t('pos.noteOptional')} placeholderTextColor={colors.textDisabled} multiline />

      <View style={styles.checkoutActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setCheckout(false)}><Text style={styles.cancelText}>{t('common.back')}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleCheckout}>
          <MaterialCommunityIcons name="check" size={20} color="#FFF" />
          <Text style={styles.confirmText}>{paymentMode === 'debt' ? t('pos.confirmDebt') : t('pos.confirmSale')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  ) : (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('pos.title')}</Text>
        {cart.length > 0 && <TouchableOpacity onPress={clearCart}><MaterialCommunityIcons name="cart-off" size={20} color={colors.danger} /></TouchableOpacity>}
      </View>

      <SearchBar value={searchQuery} onChangeText={handleSearch} placeholder={t('pos.searchProduct')} />

      <View style={styles.barcodeSection}>
        <View style={styles.barcodeRow}>
          <MaterialCommunityIcons name="barcode-scan" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.barcodeInput}
            value={barcode}
            onChangeText={setBarcode}
            placeholder={t('pos.scanBarcode')}
            placeholderTextColor={colors.textDisabled}
            onSubmitEditing={handleBarcodeLookup}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.barcodeScanBtn} onPress={handleScanBarcode}>
            <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.barcodeAddBtn} onPress={handleBarcodeLookup}>
            <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList data={displayProducts} keyExtractor={i => i.id.toString()} style={styles.productList}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.pItem, item.quantity <= 0 && styles.pItemOut]} onPress={() => handleAddToCart(item)}>
            <View style={styles.pInfo}>
              <Text style={styles.pName}>{item.name}</Text>
              <Text style={styles.pPrice}>{formatCurrency(item.sell_price, currencyLabel)}</Text>
            </View>
            <MaterialCommunityIcons name="plus-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('pos.noProducts')}</Text>}
      />

      <View style={[styles.cartPanel, { maxHeight: SCREEN_H * 0.3 }]}>
        <Text style={styles.cartTitle}>{t('pos.cart', { count: cart.length })}</Text>
        {cart.length === 0 ? <Text style={styles.empty}>{t('pos.cartEmpty')}</Text> : (
          <FlatList data={cart} keyExtractor={i => i.productId.toString()}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Text style={styles.ciName} numberOfLines={1}>{item.productName}</Text>
                <View style={styles.ciControls}>
                  <TouchableOpacity onPress={() => item.quantity <= 1 ? removeFromCart(item.productId) : updateCartQuantity(item.productId, item.quantity - 1)} style={styles.qtyBtn}><MaterialCommunityIcons name="minus" size={16} /></TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateCartQuantity(item.productId, item.quantity + 1)} style={styles.qtyBtn}><MaterialCommunityIcons name="plus" size={16} /></TouchableOpacity>
                </View>
                <Text style={styles.ciSub}>{formatCurrency(item.subtotal, currencyLabel)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.productId)}><MaterialCommunityIcons name="close" size={18} color={colors.danger} /></TouchableOpacity>
              </View>
            )}
          />
        )}
        <View style={styles.cartFooter}>
          <Text style={styles.footerTotal}>{formatCurrency(cartTotal, currencyLabel)}</Text>
          <TouchableOpacity style={[styles.checkoutBtn, cart.length === 0 && styles.checkoutBtnDisabled]} onPress={() => cart.length > 0 && setCheckout(true)} disabled={cart.length === 0}>
            <Text style={styles.checkoutBtnText}>{t('pos.checkout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'code93', 'upc_a', 'upc_e', 'itf14', 'qr'] }}
            onBarcodeScanned={(result) => handleBarcodeScanned(result.data)}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>{t('pos.scanPrompt')}</Text>
            <View style={styles.scannerFrame} />
            <TouchableOpacity style={styles.scannerClose} onPress={() => setScannerOpen(false)}>
              <MaterialCommunityIcons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card, borderBottomLeftRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.xl },
  title: { ...typography.heading2, color: colors.textPrimary },
  productList: { flex: 1 },
  pItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: spacing.md, marginVertical: 3, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm, gap: spacing.sm },
  pItemOut: { opacity: 0.4 },
  pInfo: { flex: 1 },
  pName: { ...typography.body1, fontWeight: '600', color: colors.textPrimary },
  pPrice: { ...typography.body2, color: colors.primary, fontWeight: '600', marginTop: 2 },
  empty: { ...typography.body2, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  cartPanel: { backgroundColor: colors.card, borderTopWidth: 0, ...shadows.md, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
  cartTitle: { ...typography.heading4, color: colors.textPrimary, padding: spacing.md, paddingBottom: spacing.xs },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  ciName: { flex: 1, ...typography.body2, fontWeight: '600', color: colors.textPrimary },
  ciControls: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.sm, gap: spacing.xs },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.divider, justifyContent: 'center', alignItems: 'center' },
  qtyText: { ...typography.body1, fontWeight: '600', color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
  ciSub: { ...typography.body2, fontWeight: '700', color: colors.textPrimary, marginRight: spacing.sm, minWidth: 60, textAlign: 'right' },
  cartFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  footerTotal: { ...typography.heading2, color: colors.primary, fontWeight: '800' },
  checkoutBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 6, borderRadius: borderRadius.lg },
  checkoutBtnDisabled: { backgroundColor: colors.textDisabled },
  checkoutBtnText: { ...typography.button, color: '#FFF', fontSize: 16, fontWeight: '700' },
  barcodeSection: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  barcodeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingLeft: spacing.sm },
  barcodeInput: { flex: 1, ...typography.body1, color: colors.textPrimary, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  barcodeScanBtn: { backgroundColor: colors.warning, padding: spacing.sm },
  barcodeAddBtn: { backgroundColor: colors.primary, padding: spacing.sm, borderTopRightRadius: borderRadius.md - 1, borderBottomRightRadius: borderRadius.md - 1 },
  checkoutTitle: { ...typography.heading3, color: colors.textPrimary, marginBottom: spacing.md },
  cRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  cName: { flex: 1, ...typography.body1, color: colors.textPrimary },
  cQty: { ...typography.body2, color: colors.textSecondary, marginHorizontal: spacing.sm },
  cPrice: { ...typography.body1, fontWeight: '600', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  cTotal: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.xs },
  totalLabel: { ...typography.body1, color: colors.textSecondary },
  totalValue: { ...typography.heading3, color: colors.primary },
  label: { ...typography.body2, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  discountRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  dBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  dBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dBtnText: { ...typography.body2, color: colors.textPrimary },
  dBtnTextActive: { color: '#FFF', fontWeight: '600' },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, ...typography.body1, color: colors.textPrimary },
  payRow: { flexDirection: 'row', gap: spacing.md },
  payBtn: { flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  payBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  payBtnText: { ...typography.button, color: colors.textPrimary },
  payBtnTextActive: { color: '#FFF' },
  customerList: { maxHeight: 150, marginTop: spacing.sm },
  custOpt: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  custOptSel: { backgroundColor: '#E3F2FD' },
  custDebt: { ...typography.caption, color: colors.danger },
  amountInput: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: spacing.md },
  checkoutActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.xxl },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { ...typography.button, color: colors.textSecondary },
  confirmBtn: { flex: 1, flexDirection: 'row', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  confirmText: { ...typography.button, color: '#FFF' },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerText: { ...typography.body1, color: '#FFF', marginBottom: spacing.lg },
  scannerFrame: { width: 250, height: 250, borderWidth: 2, borderColor: colors.primary, borderRadius: borderRadius.md, backgroundColor: 'transparent' },
  scannerClose: { position: 'absolute', bottom: 60, padding: spacing.md, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30 },
});
