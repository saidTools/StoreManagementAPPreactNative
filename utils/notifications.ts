import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as productDb from '../db/products';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('low-stock', {
      name: 'Low Stock Alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return true;
};

export const scheduleLowStockCheck = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Stock Check',
      body: 'Checking inventory levels...',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 86400, repeats: true } as any,
  });
};

export const checkAndNotifyLowStock = async (): Promise<void> => {
  const lowStockItems = productDb.getLowStockProducts();
  if (lowStockItems.length === 0) return;
  const names = lowStockItems.slice(0, 3).map((p) => `${p.name} (${p.quantity} left)`).join(', ');
  const more = lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : '';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Low Stock Alert - ${lowStockItems.length} items`,
      body: `${names}${more}`,
      data: { type: 'low-stock' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 } as any,
  });
};
