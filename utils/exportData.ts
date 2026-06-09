import { Platform } from 'react-native';
import { Paths, File, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import db from '../db/database';
import type { SQLiteBindValue } from 'expo-sqlite';

export interface BackupData {
  version: number;
  exported_at: string;
  shop_name: string;
  products: Record<string, unknown>[];
  customers: Record<string, unknown>[];
  sales: Record<string, unknown>[];
  sale_items: Record<string, unknown>[];
  debts: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
}

const getBackupDir = (): Directory => {
  const dir = new Directory(Paths.document, 'backups');
  if (!dir.exists) {
    dir.create({ idempotent: true });
  }
  return dir;
};

export const exportBackup = async (shopName: string): Promise<string> => {
  const data: BackupData = {
    version: 1,
    exported_at: new Date().toISOString(),
    shop_name: shopName,
    products: db.getAllSync('SELECT * FROM products'),
    customers: db.getAllSync('SELECT * FROM customers'),
    sales: db.getAllSync('SELECT * FROM sales'),
    sale_items: db.getAllSync('SELECT * FROM sale_items'),
    debts: db.getAllSync('SELECT * FROM debts'),
    expenses: db.getAllSync('SELECT * FROM expenses'),
  };

  const json = JSON.stringify(data, null, 2);
  const filename = `shopmanager_backup_${new Date().toISOString().split('T')[0]}.json`;
  const dir = getBackupDir();
  const file = new File(dir, filename);
  file.write(json);

  return file.uri;
};

export const shareBackupFile = async (filePath: string): Promise<void> => {
  if (await Sharing.isAvailableAsync()) {
    const shareUri = Platform.OS === 'android' ? new File(filePath).contentUri : filePath;
    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/json',
      dialogTitle: 'Share backup file',
    });
  }
};

export const importBackup = async (filePath: string): Promise<void> => {
  const file = new File(filePath);
  const json = await file.text();
  const data: BackupData = JSON.parse(json);

  db.withTransactionSync(() => {
    db.runSync('DELETE FROM sale_items');
    db.runSync('DELETE FROM debts');
    db.runSync('DELETE FROM sales');
    db.runSync('DELETE FROM expenses');
    db.runSync('DELETE FROM customers');
    db.runSync('DELETE FROM products');

    const insertRows = (table: string, rows: Record<string, unknown>[]) => {
      for (const row of rows) {
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(k => row[k]);
        db.runSync(
          `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
          values as SQLiteBindValue[]
        );
      }
    };

    insertRows('products', data.products);
    insertRows('customers', data.customers);
    insertRows('sales', data.sales);
    insertRows('sale_items', data.sale_items);
    insertRows('debts', data.debts);
    insertRows('expenses', data.expenses);
  });
};

export const exportReport = async (
  shopName: string,
  reportData: { revenue: number; expenses: number; netProfit: number; transactions: number },
  dateRange: string
): Promise<string> => {
  const html = `
    <html>
    <head><meta charset="utf-8"><title>Report - ${shopName}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { color: #1B6CA8; }
      .stat { margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; }
    </style></head>
    <body>
      <h1>${shopName}</h1>
      <h2>Report - ${dateRange}</h2>
      <div class="stat">Revenue: ${reportData.revenue} DA</div>
      <div class="stat">Expenses: ${reportData.expenses} DA</div>
      <div class="stat">Net Profit: ${reportData.netProfit} DA</div>
      <div class="stat">Transactions: ${reportData.transactions}</div>
    </body></html>
  `;

  const filename = `report_${dateRange.replace(/\//g, '-')}.html`;
  const dir = getBackupDir();
  const file = new File(dir, filename);
  file.write(html);
  return file.uri;
};
