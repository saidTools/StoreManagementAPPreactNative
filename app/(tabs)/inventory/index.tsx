import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { useProductStore } from '../../../store/useProductStore';
import { ProductCard } from '../../../components/ui/ProductCard';
import { SearchBar } from '../../../components/ui/SearchBar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProductListSkeleton } from '../../../components/ui/LoadingSkeleton';
import type { Product } from '../../../types';

const CATEGORIES = ['All', 'Food', 'Clothing', 'Electronics', 'Other'];

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { products, searchProducts, filterByCategory, loadProducts, deleteProduct } = useProductStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadProducts();
    setLoaded(true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
    setRefreshing(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    query ? searchProducts(query) : loadProducts();
  };

  const handleCategoryFilter = (cat: string) => {
    setSelectedCategory(cat);
    cat === 'All' ? (searchQuery ? searchProducts(searchQuery) : loadProducts()) : filterByCategory(cat);
  };

  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('inventory.title')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/inventory/adjust')}>
            <MaterialCommunityIcons name="counter" size={22} color={colors.warning} />
          </TouchableOpacity>
          <Text style={styles.count}>{products.length}</Text>
        </View>
      </View>

      <SearchBar value={searchQuery} onChangeText={handleSearch} placeholder={t('inventory.search')} />

      <FlatList horizontal data={CATEGORIES} keyExtractor={i => i} showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.categoryChip, selectedCategory === item && styles.categoryChipSelected]} onPress={() => handleCategoryFilter(item)}>
            <Text style={[styles.categoryChipText, selectedCategory === item && styles.categoryChipTextSelected]}>{t(`inventory.${item.toLowerCase()}`)}</Text>
          </TouchableOpacity>
        )}
      />

      {!loaded ? <ProductListSkeleton /> : filteredProducts.length === 0 ? (
        <EmptyState icon="package-variant" title={t('inventory.noProducts')}
          subtitle={searchQuery ? t('inventory.tryDifferent') : t('inventory.addFirst')}
          actionLabel={t('inventory.addProduct')} onAction={() => router.navigate('/(tabs)/inventory/add')} />
      ) : (
        <FlatList data={filteredProducts} keyExtractor={i => i.id.toString()}
          renderItem={({ item }) => <ProductCard product={item} onPress={(p) => router.navigate(`/(tabs)/inventory/${p.id}`)} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
      )}

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => router.navigate('/(tabs)/inventory/add')} activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  title: { ...typography.heading2, color: colors.textPrimary },
  count: { ...typography.body2, color: colors.textSecondary },
  categoriesList: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  categoryChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: spacing.sm },
  categoryChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  categoryChipText: { ...typography.body2, color: colors.textSecondary },
  categoryChipTextSelected: { color: '#FFF', fontWeight: '600' },
  list: { paddingBottom: 80 },
  fab: { position: 'absolute', right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
});
