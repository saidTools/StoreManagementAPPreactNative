import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { useProductStore } from '../../../store/useProductStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { ProductForm } from '../../../components/forms/ProductForm';
import type { Product, ProductFormData } from '../../../types';

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProductById, updateProduct, deleteProduct } = useProductStore();
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);
  const [product, setProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);

  const productId = id ? parseInt(id) : 0;

  useEffect(() => {
    if (id) setProduct(getProductById(parseInt(id)));
  }, [id]);

  const handleUpdate = (data: ProductFormData) => {
    if (!product) return;
    updateProduct(product.id, data);
    setProduct({ ...product, ...data, updated_at: new Date().toISOString() });
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(t('inventory.deleteProduct'), t('inventory.deleteConfirm', { name: product?.name ?? '' }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { if (product) { deleteProduct(product.id); router.back(); } } },
    ]);
  };

  if (!product) return <View style={[styles.container, { paddingTop: insets.top }]}><Text style={styles.error}>{t('inventory.productNotFound')}</Text></View>;

  if (editing) return <View style={[styles.container, { paddingTop: insets.top }]}>
    <ProductForm initialValues={product} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
  </View>;

  const margin = product.sell_price > 0 ? ((product.sell_price - product.buy_price) / product.sell_price * 100) : 0;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.headerBtn}><MaterialCommunityIcons name="pencil" size={20} color={colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}><MaterialCommunityIcons name="delete" size={20} color={colors.danger} /></TouchableOpacity>
          </View>
        </View>
        {product.category && <Text style={styles.category}>{product.category}</Text>}
      </View>

      {product.image_uri && <Image source={{ uri: product.image_uri }} style={styles.image} />}

      <View style={styles.grid}>
        {[
          { label: t('inventory.sellPrice'), value: formatCurrency(product.sell_price, currencyLabel), color: colors.primary },
          { label: t('inventory.buyPrice'), value: formatCurrency(product.buy_price, currencyLabel), color: colors.textSecondary },
          { label: t('inventory.margin'), value: `${margin.toFixed(1)}%`, color: colors.success },
          { label: t('inventory.quantity'), value: product.quantity.toString(), color: product.quantity <= product.low_stock_threshold ? colors.warning : colors.textPrimary },
        ].map((item, i) => (
          <View key={i} style={styles.infoCard}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={[styles.infoValue, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      {product.barcode && <View style={styles.detailRow}><MaterialCommunityIcons name="barcode" size={18} color={colors.textSecondary} /><Text style={styles.detailText}>{t('inventory.barcode')}: {product.barcode}</Text></View>}
      <View style={styles.detailRow}><MaterialCommunityIcons name="calendar" size={18} color={colors.textSecondary} /><Text style={styles.detailText}>{t('inventory.updated')}: {formatDate(product.updated_at)}</Text></View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, backgroundColor: colors.card },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { ...typography.heading2, color: colors.textPrimary, flex: 1 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: { padding: spacing.sm },
  category: { ...typography.body2, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  image: { width: '100%', height: 200, resizeMode: 'cover' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm },
  infoCard: { flex: 1, minWidth: '45%', backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, ...shadows.sm },
  infoLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  infoValue: { ...typography.heading4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  detailText: { ...typography.body2, color: colors.textPrimary, marginLeft: spacing.sm },
  error: { ...typography.body1, color: colors.danger, textAlign: 'center', marginTop: spacing.xxl },
  section: { marginTop: spacing.sm, marginHorizontal: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md, ...shadows.sm, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  sectionTitle: { ...typography.body1, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  emptyText: { ...typography.body2, color: colors.textSecondary, padding: spacing.md, textAlign: 'center' },
});
