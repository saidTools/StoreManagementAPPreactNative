import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { t } from '../../../i18n';
import { useCustomerStore } from '../../../store/useCustomerStore';
import { CustomerCard } from '../../../components/ui/CustomerCard';
import { SearchBar } from '../../../components/ui/SearchBar';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { Customer } from '../../../types';

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { customers, searchCustomers, loadCustomers } = useCustomerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'with_debt'>('all');

  useEffect(() => { loadCustomers(); }, []);

  const handleSearch = (q: string) => { setSearchQuery(q); searchCustomers(q); };
  const filtered = filter === 'with_debt' ? customers.filter(c => c.total_debt > 0) : customers;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('customers.title')}</Text>
          <Text style={styles.count}>{`${customers.length} ${t('customers.title')}`}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.navigate('/(tabs)/customers/add')}>
          <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChangeText={handleSearch} placeholder={t('customers.search')} />

      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterChipActive]} onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>{t('common.all')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filter === 'with_debt' && styles.filterChipActive]} onPress={() => setFilter('with_debt')}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={filter === 'with_debt' ? '#FFF' : colors.danger} />
          <Text style={[styles.filterText, filter === 'with_debt' && styles.filterTextActive]}>{t('customers.withDebt')}</Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <EmptyState icon="account-group" title={t('customers.noCustomers')}
          subtitle={searchQuery ? t('inventory.tryDifferent') : t('customers.addFirst')}
          actionLabel={t('customers.addCustomer')} onAction={() => router.navigate('/(tabs)/customers/add')} />
      ) : (
        <FlatList data={filtered} keyExtractor={i => i.id.toString()}
          renderItem={({ item }) => <CustomerCard customer={item} onPress={(c) => router.navigate(`/(tabs)/customers/${c.id}`)} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCustomers(); setRefreshing(false); }} />}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  title: { ...typography.heading2, color: colors.textPrimary },
  count: { ...typography.body2, color: colors.textSecondary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.md },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.body2, color: colors.textSecondary },
  filterTextActive: { color: '#FFF', fontWeight: '600' },
  list: { paddingBottom: spacing.xxl },
});
