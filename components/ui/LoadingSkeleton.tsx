import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadiusVal?: number;
  style?: object;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadiusVal = 4, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadiusVal,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const ProductListSkeleton = () => (
  <View style={styles.listContainer}>
    {[1, 2, 3, 4, 5].map((i) => (
      <View key={i} style={styles.row}>
        <Skeleton width={48} height={48} borderRadiusVal={8} />
        <View style={styles.rowContent}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="30%" height={12} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={32} height={24} borderRadiusVal={12} />
      </View>
    ))}
  </View>
);

export const StatsCardSkeleton = () => (
  <View style={styles.statsRow}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.statsCard}>
        <Skeleton width={32} height={32} borderRadiusVal={8} />
        <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
        <Skeleton width="50%" height={20} style={{ marginTop: 4 }} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  listContainer: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statsCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
});
