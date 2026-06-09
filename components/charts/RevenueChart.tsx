import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { t } from '../../i18n';

interface RevenueChartProps {
  data: { label: string; value: number }[];
  title?: string;
}

export const RevenueChart = ({ data, title = t('charts.revenue') }: RevenueChartProps) => {
  const chartData = data.map((item) => ({
    label: item.label,
    value: Math.max(item.value, 0),
    frontColor: item.value >= 0 ? colors.primary : colors.danger,
  }));

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>{t('common.noData')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <BarChart
        data={chartData}
        barWidth={28}
        spacing={12}
        roundedTop
        roundedBottom
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={styles.axisText}
        noOfSections={4}
        maxValue={Math.max(...chartData.map(d => d.value)) * 1.2 || 100}
        barBorderRadius={4}
        isAnimated
        animationDuration={500}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  axisText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
