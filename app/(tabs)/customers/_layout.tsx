import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';
import { t } from '../../../i18n';

export default function CustomersLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: colors.card },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: { fontWeight: '600' },
      headerBackTitle: t('common.back'),
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ title: t('customers.addCustomer') }} />
      <Stack.Screen name="[id]" options={{ title: t('customers.customerDetails') }} />
    </Stack>
  );
}
