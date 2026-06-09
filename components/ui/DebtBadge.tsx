import { StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { t } from '../../i18n';
import { formatCurrency } from '../../utils/formatCurrency';

interface DebtBadgeProps {
  amount: number;
  variant?: 'outstanding' | 'paid' | 'warning';
}

export const DebtBadge = ({ amount, variant = 'outstanding' }: DebtBadgeProps) => {
  const config = {
    outstanding: {
      icon: 'alert-circle' as const,
      bg: '#FFEBEE',
      textColor: colors.danger,
      label: t('debtBadge.debt'),
    },
    paid: {
      icon: 'check-circle' as const,
      bg: '#E8F5E9',
      textColor: colors.success,
      label: t('debtBadge.paid'),
    },
    warning: {
      icon: 'alert' as const,
      bg: '#FFF3E0',
      textColor: colors.warning,
      label: t('debtBadge.partial'),
    },
  };

  const cfg = config[variant];

  return (
    <View style={[styles.container, { backgroundColor: cfg.bg }]}>
      <MaterialCommunityIcons name={cfg.icon} size={16} color={cfg.textColor} />
      <Text style={[styles.label, { color: cfg.textColor }]}>{cfg.label}:</Text>
      <Text style={[styles.amount, { color: cfg.textColor }]}>{formatCurrency(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.caption,
    marginLeft: 4,
    fontWeight: '600',
  },
  amount: {
    ...typography.caption,
    marginLeft: 2,
    fontWeight: '700',
  },
});
