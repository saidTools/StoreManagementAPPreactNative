import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '../../../constants/theme';
import { t } from '../../../i18n';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useCustomerStore } from '../../../store/useCustomerStore';
import { useDebtStore } from '../../../store/useDebtStore';
import type { Customer, Debt } from '../../../types';

export default function CustomerDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCustomerById } = useCustomerStore();
  const { loadDebtsByCustomer, payDebt } = useDebtStore();
  const currencyLabel = useSettingsStore((s) => s.currencyLabel);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      const c = getCustomerById(parseInt(id));
      setCustomer(c);
      if (c) {
        setDebts(loadDebtsByCustomer(c.id));
      }
    }
  }, [id]);

  const confirmPayment = () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { Alert.alert(t('customers.invalidAmount')); return; }
    if (selectedDebtId) {
      payDebt(selectedDebtId, amount);
      setShowPayment(false);
      setPayAmount('');
      if (customer) {
        setDebts(loadDebtsByCustomer(customer.id));
        setCustomer(getCustomerById(customer.id));
      }
      Alert.alert(t('common.success'), t('customers.paymentRecorded'));
    }
  };

  if (!customer) return <View style={[styles.container, { paddingTop: insets.top }]}><Text style={styles.error}>{t('customers.customerNotFound')}</Text></View>;

  const totalDebt = debts.reduce((s, d) => s + d.remaining, 0);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{customer.name.charAt(0)}</Text></View>
        <Text style={styles.customerName}>{customer.name}</Text>
        {customer.phone && (
          <TouchableOpacity style={styles.phoneRow} onPress={() => Linking.openURL(`tel:${customer.phone}`)}>
            <MaterialCommunityIcons name="phone" size={16} color={colors.primary} />
            <Text style={styles.phoneText}>{customer.phone}</Text>
          </TouchableOpacity>
        )}
      </View>

      {totalDebt > 0 && (
        <View>
          <View style={[styles.debtCard, { backgroundColor: '#FFEBEE' }]}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={colors.danger} />
            <View style={styles.debtInfo}>
              <Text style={styles.debtLabel}>{t('customers.outstandingDebt')}</Text>
              <Text style={styles.debtAmount}>{formatCurrency(totalDebt, currencyLabel)}</Text>
            </View>
          </View>
        </View>
      )}


      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('customers.debtHistory')}</Text>
        {debts.length === 0 ? (
          <Text style={styles.noData}>{t('customers.noDebtRecords')}</Text>
        ) : debts.map(debt => (
          <View key={debt.id} style={[styles.debtItem, debt.is_paid === 1 && { opacity: 0.6 }]}>
            <View style={styles.debtItemInfo}>
              <Text style={styles.debtItemAmount}>{`${formatCurrency(debt.remaining, currencyLabel)} ${t('customers.remaining')}`}</Text>
              <Text style={styles.debtItemDate}>{formatDate(debt.created_at)}</Text>
              <Text style={styles.debtItemOrig}>{`${t('customers.original')}: ${formatCurrency(debt.original_amount, currencyLabel)}`}</Text>
            </View>
            {debt.is_paid === 0 && (
              <TouchableOpacity style={styles.payBtn} onPress={() => { setSelectedDebtId(debt.id); setShowPayment(true); }}>
                <Text style={styles.payBtnText}>{t('customers.pay')}</Text>
              </TouchableOpacity>
            )}
            {debt.is_paid === 1 && <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />}
          </View>
        ))}
      </View>



      {showPayment && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('customers.recordPayment')}</Text>
            <TextInput style={styles.modalInput} value={payAmount} onChangeText={setPayAmount}
              placeholder={`${t('pos.amount')} (${currencyLabel})`} keyboardType="numeric" placeholderTextColor={colors.textDisabled} autoFocus />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowPayment(false); setPayAmount(''); }}><Text style={styles.modalCancelText}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmPayment}><Text style={styles.modalConfirmText}>{t('customers.pay')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileCard: { backgroundColor: colors.card, alignItems: 'center', padding: spacing.xl, margin: spacing.md, borderRadius: borderRadius.lg, ...shadows.md },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { ...typography.heading2, color: '#FFF' },
  customerName: { ...typography.heading3, color: colors.textPrimary },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  phoneText: { ...typography.body1, color: colors.primary, marginLeft: spacing.sm, fontWeight: '600' },
  debtCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginHorizontal: spacing.md, borderRadius: borderRadius.lg },
  debtInfo: { marginLeft: spacing.md },
  debtLabel: { ...typography.body2, color: colors.danger },
  debtAmount: { ...typography.heading4, color: colors.danger, fontWeight: '700' },
  section: { margin: spacing.md },
  sectionTitle: { ...typography.heading4, color: colors.textPrimary, marginBottom: spacing.sm },
  noData: { ...typography.body2, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl },
  debtItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm, ...shadows.sm },
  debtItemInfo: { flex: 1 },
  debtItemAmount: { ...typography.body1, fontWeight: '600', color: colors.textPrimary },
  debtItemDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  debtItemOrig: { ...typography.caption, color: colors.textSecondary },
  payBtn: { backgroundColor: colors.success, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  payBtnText: { ...typography.button, color: '#FFF' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, width: '85%', ...shadows.lg },
  modalTitle: { ...typography.heading4, color: colors.textPrimary, marginBottom: spacing.md },
  modalInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 24, fontWeight: '700', textAlign: 'center', color: colors.textPrimary },
  modalActions: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.md },
  modalCancel: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  modalCancelText: { ...typography.button, color: colors.textSecondary },
  modalConfirm: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.success, alignItems: 'center' },
  modalConfirmText: { ...typography.button, color: '#FFF' },
  error: { ...typography.body1, color: colors.danger, textAlign: 'center', marginTop: spacing.xxl },
});
