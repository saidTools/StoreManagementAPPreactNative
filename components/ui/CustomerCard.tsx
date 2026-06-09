import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Customer } from '../../types';

interface CustomerCardProps {
  customer: Customer;
  onPress: (customer: Customer) => void;
}

export const CustomerCard = ({ customer, onPress }: CustomerCardProps) => {
  const hasDebt = customer.total_debt > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(customer)}
      activeOpacity={0.7}
      accessibilityLabel={`${customer.name}, debt: ${formatCurrency(customer.total_debt)}`}
    >
      <View style={[styles.avatar, hasDebt && styles.avatarDanger]}>
        <Text style={styles.avatarText}>
          {customer.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{customer.name}</Text>
        {customer.phone && (
          <Text style={styles.phone}>{customer.phone}</Text>
        )}
      </View>
      {hasDebt && (
        <View style={styles.debtBadge}>
          <MaterialCommunityIcons name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.debtText}>{formatCurrency(customer.total_debt)}</Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDisabled} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    ...shadows.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarDanger: {
    backgroundColor: colors.danger,
  },
  avatarText: {
    ...typography.body1,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  phone: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  debtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  debtText: {
    ...typography.caption,
    color: colors.danger,
    marginLeft: 4,
    fontWeight: '600',
  },
});
