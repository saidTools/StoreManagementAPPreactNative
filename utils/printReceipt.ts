import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatCurrency } from './formatCurrency';
import { formatDateTime } from './formatDate';
import { resolveShareUri } from './shareUtils';
import type { Sale, SaleItem } from '../types';

export const printReceiptPDF = async (sale: Sale, items: SaleItem[]): Promise<void> => {
  try {
    const shopName = useSettingsStore.getState().shopName;
    const currencyLabel = useSettingsStore.getState().currencyLabel;
    const itemsHtml = items.map((item) => `
      <tr>
        <td>${item.product_name || `#${item.product_id}`} x${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(item.subtotal, currencyLabel)}</td>
      </tr>
    `).join('');

    const html = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          @page { margin: 5mm; }
          body { font-family: 'Courier New', monospace; font-size: 10px; width: 58mm; margin: 0; padding: 0; }
          .header { text-align: center; margin-bottom: 5px; }
          .header h2 { margin: 0; font-size: 12px; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; }
          .total { font-weight: bold; font-size: 12px; }
          .footer { text-align: center; margin-top: 10px; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${shopName}</h2>
          <p>${formatDateTime(sale.created_at)}</p>
        </div>
        <div class="line"></div>
        <table>${itemsHtml}</table>
        <div class="line"></div>
        <table>
          ${sale.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${formatCurrency(sale.discount, currencyLabel)}</td></tr>` : ''}
          <tr class="total"><td>TOTAL</td><td style="text-align:right">${formatCurrency(sale.total_amount, currencyLabel)}</td></tr>
          <tr><td>Paid</td><td style="text-align:right">${formatCurrency(sale.amount_paid, currencyLabel)}</td></tr>
          ${sale.change_given > 0 ? `<tr><td>Change</td><td style="text-align:right">${formatCurrency(sale.change_given, currencyLabel)}</td></tr>` : ''}
        </table>
        ${sale.customer_name ? `<p>Customer: ${sale.customer_name}</p>` : ''}
        ${sale.note ? `<p>${sale.note}</p>` : ''}
        <div class="line"></div>
        <div class="footer">
          <p>Thank you for your purchase!</p>
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html, width: 226, height: 500 });
    const shareUri = await resolveShareUri(uri);
    await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf' });
  } catch (e) {
    Alert.alert('Print Error', e instanceof Error ? e.message : 'Could not generate PDF.');
  }
};

export const generateThermalReceiptText = (sale: Sale, items: SaleItem[]): string => {
  const shopName = useSettingsStore.getState().shopName;
  const currencyLabel = useSettingsStore.getState().currencyLabel;
  const fmt = (n: number) => formatCurrency(n, currencyLabel);

  const lines: string[] = [
    `        ${shopName}`,
    `  ${formatDateTime(sale.created_at)}`,
    '─'.repeat(32),
  ];

  for (const item of items) {
    const name = (item.product_name || `#${item.product_id}`).padEnd(16).slice(0, 16);
    const qty = `x${item.quantity}`.padStart(4);
    const price = fmt(item.subtotal).padStart(10);
    lines.push(`${name}${qty}${price}`);
  }

  lines.push('─'.repeat(32));
  if (sale.discount > 0) {
    lines.push(`Discount          -${fmt(sale.discount)}`.padEnd(32));
  }
  lines.push(`TOTAL             ${fmt(sale.total_amount)}`.padEnd(32));
  lines.push(`Paid              ${fmt(sale.amount_paid)}`.padEnd(32));
  if (sale.change_given > 0) {
    lines.push(`Change            ${fmt(sale.change_given)}`.padEnd(32));
  }
  if (sale.customer_name) lines.push(`Customer: ${sale.customer_name}`);
  if (sale.note) lines.push(`Note: ${sale.note}`);
  lines.push('');
  lines.push('   Thank you for your purchase!');
  lines.push('');
  lines.push('');

  return lines.join('\n');
};

export const printThermalReceipt = async (sale: Sale, items: SaleItem[]): Promise<void> => {
  const text = generateThermalReceiptText(sale, items);
  try {
    const { Paths } = await import('expo-file-system');
    const file = Paths.cache.createFile('receipt.txt', 'text/plain');
    file.write(text);
    if (await Sharing.isAvailableAsync()) {
      const shareUri = Platform.OS === 'android' ? file.contentUri : file.uri;
      await Sharing.shareAsync(shareUri, { mimeType: 'text/plain' });
    } else {
      Alert.alert('Sharing Not Available', 'Cannot share receipt on this device.');
    }
  } catch (e) {
    Alert.alert('Print Error', e instanceof Error ? e.message : 'Could not generate receipt file.');
  }
};
