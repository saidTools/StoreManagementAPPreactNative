import db, { executeTransaction } from './database';
import type { Sale, SaleItem, SaleFormData, ReturnSale, ReturnItem } from '../types';

export const getAllSales = (limit = 100, offset = 0): Sale[] => {
  return db.getAllSync<Sale>(
    `SELECT s.*, c.name as customer_name FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     ORDER BY s.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]
  );
};

export const getSaleById = (id: number): Sale | null => {
  return db.getFirstSync<Sale>(
    `SELECT s.*, c.name as customer_name, c.phone as customer_phone
     FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ?`, [id]
  ) ?? null;
};

export const getSaleItems = (saleId: number): SaleItem[] => {
  return db.getAllSync<SaleItem>(
    `SELECT si.*, p.name as product_name, p.barcode
     FROM sale_items si LEFT JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`, [saleId]
  );
};

export const getTodaySales = (): Sale[] => {
  const today = new Date().toISOString().split('T')[0];
  return db.getAllSync<Sale>(
    `SELECT s.*, c.name as customer_name FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     WHERE date(s.created_at) = date(?) ORDER BY s.created_at DESC`, [today]
  );
};

export const getSalesByDateRange = (startDate: string, endDate: string): Sale[] => {
  return db.getAllSync<Sale>(
    `SELECT s.*, c.name as customer_name FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     WHERE date(s.created_at) BETWEEN date(?) AND date(?) ORDER BY s.created_at DESC`, [startDate, endDate]
  );
};

export const getSalesStats = (startDate: string, endDate: string) => {
  const r = db.getFirstSync<{ total_revenue: number; total_transactions: number; total_cost: number; total_discount: number; total_paid: number }>(
    `SELECT COALESCE(SUM(s.total_amount),0) as total_revenue, COUNT(*) as total_transactions,
            COALESCE(SUM(s.discount),0) as total_discount, COALESCE(SUM(s.amount_paid),0) as total_paid,
            COALESCE((SELECT SUM(si.quantity * si.buy_price) FROM sale_items si JOIN sales s2 ON si.sale_id = s2.id WHERE date(s2.created_at) BETWEEN date(?) AND date(?)),0) as total_cost
     FROM sales s WHERE date(s.created_at) BETWEEN date(?) AND date(?)`, [startDate, endDate, startDate, endDate]
  );
  return r ?? { total_revenue: 0, total_transactions: 0, total_cost: 0, total_discount: 0, total_paid: 0 };
};

export const createSale = (data: SaleFormData): number => {
  let saleId = 0;
  const debtAmount = data.debtAmount ?? 0;
  executeTransaction(() => {
    const result = db.runSync(
      `INSERT INTO sales (customer_id, total_amount, discount, amount_paid, change_given, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.customerId ?? null, data.totalAmount, data.discount ?? 0, data.amountPaid, data.changeGiven ?? 0, data.note ?? null]
    );
    saleId = result.lastInsertRowId;

    for (const item of data.items) {
      db.runSync('INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, buy_price) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, item.productId, item.quantity, item.unitPrice, item.subtotal, item.buyPrice]);
      db.runSync("UPDATE products SET quantity = quantity - ?, updated_at = datetime('now') WHERE id = ?",
        [item.quantity, item.productId]);
    }

    if (data.customerId && data.isDebt && debtAmount > 0) {
      db.runSync('INSERT INTO debts (customer_id, sale_id, original_amount, paid_amount, remaining, is_paid) VALUES (?, ?, ?, ?, ?, ?)',
        [data.customerId, saleId, debtAmount, 0, debtAmount, 0]);
      db.runSync('UPDATE customers SET total_debt = total_debt + ? WHERE id = ?', [debtAmount, data.customerId]);
    }
  });
  return saleId;
};

export const deleteSale = (id: number): void => {
  executeTransaction(() => {
    const items = db.getAllSync<{ product_id: number; quantity: number }>(
      'SELECT product_id, quantity FROM sale_items WHERE sale_id = ?', [id]);
    for (const item of items) {
      db.runSync("UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?", [item.quantity, item.product_id]);
    }
    db.runSync('DELETE FROM sale_items WHERE sale_id = ?', [id]);
    db.runSync('DELETE FROM debts WHERE sale_id = ?', [id]);
    db.runSync('DELETE FROM sales WHERE id = ?', [id]);
  });
};

export const returnSale = (saleId: number, reason?: string): void => {
  executeTransaction(() => {
    const sale = db.getFirstSync<Sale>('SELECT * FROM sales WHERE id = ?', [saleId]);
    if (!sale) return;

    const items = db.getAllSync<SaleItem>('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    for (const item of items) {
      db.runSync("UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?",
        [item.quantity, item.product_id]);
    }

    const result = db.runSync(
      'INSERT INTO return_sales (sale_id, total_amount, reason) VALUES (?, ?, ?)',
      [saleId, sale.total_amount, reason ?? null]
    );
    const returnId = result.lastInsertRowId;

    for (const item of items) {
      db.runSync(
        'INSERT INTO return_items (return_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [returnId, item.product_id, item.quantity, item.unit_price, item.subtotal]
      );
    }

    const debt = db.getFirstSync<{ id: number; remaining: number }>(
      'SELECT id, remaining FROM debts WHERE sale_id = ?', [saleId]
    );
    if (debt) {
      db.runSync('UPDATE debts SET remaining = 0, is_paid = 1, paid_at = datetime(\'now\') WHERE id = ?', [debt.id]);
      db.runSync('UPDATE customers SET total_debt = MAX(0, total_debt - ?) WHERE id = ?',
        [debt.remaining, sale.customer_id]);
    }
  });
};

export const getReturns = (): (ReturnSale & { items: ReturnItem[] })[] => {
  const returns = db.getAllSync<ReturnSale>(
    'SELECT rs.*, s.total_amount as original_total FROM return_sales rs ORDER BY rs.created_at DESC'
  );
  return returns.map((r) => ({
    ...r,
    items: db.getAllSync<ReturnItem>('SELECT * FROM return_items WHERE return_id = ?', [r.id]),
  }));
};

export const getSalesCount = (): number => {
  const r = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM sales');
  return r?.count ?? 0;
};

export const searchSales = (query: string, limit = 100, offset = 0): Sale[] => {
  const searchTerm = `%${query}%`;
  return db.getAllSync<Sale>(
    `SELECT s.*, c.name as customer_name FROM sales s
     LEFT JOIN customers c ON s.customer_id = c.id
     WHERE c.name LIKE ? OR CAST(s.total_amount AS TEXT) LIKE ?
     ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
    [searchTerm, searchTerm, limit, offset]
  );
};
