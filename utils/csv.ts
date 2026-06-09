import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Paths, File } from 'expo-file-system';
import type { Product, Customer } from '../types';

const getShareUri = (file: File): string =>
  Platform.OS === 'android' && file.contentUri ? file.contentUri : file.uri;

export const exportProductsCSV = async (products: Product[]): Promise<void> => {
  const rows = products.map((p) =>
    `"${p.name}","${p.barcode || ''}",${p.buy_price},${p.sell_price},${p.quantity},${p.low_stock_threshold},"${p.category || ''}"`
  );
  const csv = `name,barcode,buy_price,sell_price,quantity,low_stock_threshold,category\n${rows.join('\n')}`;
  const file = new File(Paths.cache, 'products_export.csv');
  await file.write(csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(getShareUri(file), { mimeType: 'text/csv' });
  }
};

export const exportCustomersCSV = async (customers: Customer[]): Promise<void> => {
  const rows = customers.map((c) => `"${c.name}","${c.phone || ''}"`);
  const csv = `name,phone\n${rows.join('\n')}`;
  const file = new File(Paths.cache, 'customers_export.csv');
  await file.write(csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(getShareUri(file), { mimeType: 'text/csv' });
  }
};

export const importProductsCSV = async () => {
  const result = await DocumentPicker.getDocumentAsync({ type: 'text/*' });
  if (result.canceled || !result.assets?.[0]) return [];
  const file = new File(result.assets[0].uri);
  const content = await file.text();
  const lines = content.trim().split('\n').slice(1);
  return lines.map((line) => {
    const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    return {
      name: cols[0],
      barcode: cols[1] || undefined,
      buyPrice: parseFloat(cols[2]) || 0,
      sellPrice: parseFloat(cols[3]) || 0,
      quantity: parseInt(cols[4]) || 0,
      lowStockThreshold: parseInt(cols[5]) || 5,
      category: cols[6] || undefined,
    };
  });
};

export const importCustomersCSV = async () => {
  const result = await DocumentPicker.getDocumentAsync({ type: 'text/*' });
  if (result.canceled || !result.assets?.[0]) return [];
  const file = new File(result.assets[0].uri);
  const content = await file.text();
  const lines = content.trim().split('\n').slice(1);
  return lines.map((line) => {
    const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    return { name: cols[0], phone: cols[1] || undefined };
  });
};
