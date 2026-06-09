import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { t } from '../../../i18n';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { useSupplierStore } from '../../../store/useSupplierStore';

export default function AddSupplierScreen() {
  const insets = useSafeAreaInsets();
  const { addSupplier } = useSupplierStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) { Alert.alert(t('common.error'), t('supplierForm.nameRequired')); return; }
    addSupplier({ name: name.trim(), phone: phone.trim() || undefined, address: address.trim() || undefined });
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('tabs.addSupplier')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t('supplierForm.name')}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('supplierForm.namePlaceholder')} placeholderTextColor={colors.textDisabled} />

        <Text style={styles.label}>{t('supplierForm.phone')}</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('supplierForm.phonePlaceholder')} placeholderTextColor={colors.textDisabled} keyboardType="phone-pad" />

        <Text style={styles.label}>{t('supplierForm.address')}</Text>
        <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]} value={address} onChangeText={setAddress} placeholder={t('supplierForm.addressOptional')} placeholderTextColor={colors.textDisabled} multiline />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <MaterialCommunityIcons name="check" size={20} color="#FFF" />
          <Text style={styles.submitText}>{t('supplierForm.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.md },
  title: { ...typography.heading2, color: colors.textPrimary, flex: 1 },
  form: { padding: spacing.md },
  label: { ...typography.body2, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, ...typography.body1, color: colors.textPrimary },
  submitBtn: { flexDirection: 'row', backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  submitText: { ...typography.button, color: '#FFF' },
});
