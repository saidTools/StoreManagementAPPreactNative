import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';
import { t } from '../../i18n';

const TAB_ICONS: Record<string, { filled: React.ComponentProps<typeof MaterialCommunityIcons>['name']; outline: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }> = {
  dashboard: { filled: 'view-dashboard', outline: 'view-dashboard-outline' },
  inventory: { filled: 'package-variant-closed', outline: 'package-variant' },
  pos: { filled: 'cart', outline: 'cart-outline' },
  customers: { filled: 'account-group', outline: 'account-group-outline' },
  reports: { filled: 'chart-box', outline: 'chart-box-outline' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }: { route: { name: string } }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: any; size: number }) => {
          const base = route.name.split('/')[0];
          const icons = TAB_ICONS[base];
          const iconName = icons?.outline ?? 'help-circle';
          return (
            <MaterialCommunityIcons
              name={focused ? (icons?.filled ?? iconName) : iconName}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      })}
    >
      <Tabs.Screen name="dashboard/index" options={{ title: t('tabs.dashboard') }} />
      <Tabs.Screen name="inventory" options={{ title: t('tabs.inventory') }} />
      <Tabs.Screen name="pos/index" options={{ title: t('tabs.pos') }} />
      <Tabs.Screen name="customers" options={{ title: t('tabs.customers') }} />
      <Tabs.Screen name="reports/index" options={{ title: t('tabs.reports') }} />
      <Tabs.Screen name="sales/index" options={{ title: t('tabs.sales'), href: null }} />
      <Tabs.Screen name="suppliers/index" options={{ title: t('tabs.suppliers'), href: null }} />
      <Tabs.Screen name="suppliers/add" options={{ title: t('tabs.addSupplier'), href: null }} />
      <Tabs.Screen name="purchases/index" options={{ title: t('tabs.purchases'), href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 6,
    height: Platform.OS === 'ios' ? 85 : 60,
  },
  tabBarLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
});
