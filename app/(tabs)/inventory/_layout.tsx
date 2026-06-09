import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';

export default function InventoryLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: colors.card },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: { fontWeight: '600' },
      headerBackTitle: 'Back',
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ title: 'Add Product' }} />
      <Stack.Screen name="[id]" options={{ title: 'Product Details' }} />
      <Stack.Screen name="adjust" options={{ title: 'Stock Adjust' }} />
    </Stack>
  );
}
