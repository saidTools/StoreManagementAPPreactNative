import { StyleSheet, View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { t } from '../../i18n';

interface TopProductsChartProps {
  data: { name: string; quantity: number; revenue: number }[];
  title?: string;
}

export const TopProductsChart = ({ data, title = t('charts.topProducts') }: TopProductsChartProps) => {
  const chartData = data.slice(0, 10).map((item, index) => ({
    label: item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name,
    value: Math.max(item.revenue, 0),
    frontColor: colors.success,
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
        barWidth={24}
        spacing={10}
        roundedTop
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={styles.axisText}
        noOfSections={3}
        barBorderRadius={4}
        isAnimated
        animationDuration={500}
        horizontal
      />
      {data.length > 10 && (
        <Text style={styles.moreText}>{t('charts.moreProducts', { count: data.length - 10 })}</Text>
      )}
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
  moreText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
