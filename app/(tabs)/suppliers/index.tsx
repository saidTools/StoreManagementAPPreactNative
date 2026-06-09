import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { useSupplierStore } from '../../../store/useSupplierStore';
import type { Supplier } from '../../../types';

export default function SuppliersScreen() {
  const insets = useSafeAreaInsets();
  const { suppliers, loadSuppliers, deleteSupplier } = useSupplierStore();
  const [search, setSearch] = useState('');

  useEffect(() => { loadSuppliers(); }, []);

  const displaySuppliers = search
    ? useSupplierStore.getState().searchSuppliers(search)
    : suppliers;

  const handleDelete = (s: Supplier) => {
    Alert.alert(t('suppliers.deleteSupplier'), t('suppliers.deleteConfirm', { name: s.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteSupplier(s.id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('suppliers.title')}</Text>
        <TouchableOpacity onPress={() => router.navigate('/(tabs)/suppliers/add')}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('suppliers.search')}
          placeholderTextColor={colors.textDisabled}
        />
      </View>

      <FlatList
        data={displaySuppliers}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.phone && <Text style={styles.cardPhone}>{item.phone}</Text>}
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <MaterialCommunityIcons name="delete-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="truck" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>{t('suppliers.noSuppliers')}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.navigate('/(tabs)/suppliers/add')}>
              <Text style={styles.addBtnText}>{t('suppliers.add')}</Text>
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
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  searchInput: { flex: 1, ...typography.body1, color: colors.textPrimary, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, marginHorizontal: spacing.md, marginVertical: 3, padding: spacing.md, borderRadius: borderRadius.md, ...shadows.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  avatarText: { ...typography.heading4, color: colors.primary },
  cardName: { ...typography.body1, fontWeight: '600', color: colors.textPrimary },
  cardPhone: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyText: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.lg },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md },
  addBtnText: { ...typography.button, color: '#FFF' },
});
