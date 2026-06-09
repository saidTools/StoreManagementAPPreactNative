import db, { executeTransaction } from './database';
import type { Debt } from '../types';

export const getAllDebts = (): Debt[] => {
  return db.getAllSync<Debt>(
    `SELECT d.*, c.name as customer_name, c.phone as customer_phone
     FROM debts d LEFT JOIN customers c ON d.customer_id = c.id ORDER BY d.created_at DESC`
  );
};

export const getDebtsByCustomer = (customerId: number): Debt[] => {
  return db.getAllSync<Debt>(
    `SELECT d.*, c.name as customer_name FROM debts d
     LEFT JOIN customers c ON d.customer_id = c.id WHERE d.customer_id = ? ORDER BY d.created_at DESC`, [customerId]
  );
};

export const getUnpaidDebts = (): Debt[] => {
  return db.getAllSync<Debt>(
    `SELECT d.*, c.name as customer_name, c.phone as customer_phone
     FROM debts d LEFT JOIN customers c ON d.customer_id = c.id WHERE d.is_paid = 0 ORDER BY d.created_at DESC`
  );
};

export const getDebtById = (id: number): Debt | null => {
  return db.getFirstSync<Debt>(
    `SELECT d.*, c.name as customer_name, c.phone as customer_phone
     FROM debts d LEFT JOIN customers c ON d.customer_id = c.id WHERE d.id = ?`, [id]
  ) ?? null;
};

export const createDebt = (data: { customerId: number; saleId?: number; originalAmount: number }): number => {
  let id = 0;
  executeTransaction(() => {
    const r = db.runSync(
      'INSERT INTO debts (customer_id, sale_id, original_amount, paid_amount, remaining, is_paid) VALUES (?, ?, ?, ?, ?, ?)',
      [data.customerId, data.saleId ?? null, data.originalAmount, 0, data.originalAmount, 0]
    );
    id = r.lastInsertRowId;
    db.runSync('UPDATE customers SET total_debt = total_debt + ? WHERE id = ?', [data.originalAmount, data.customerId]);
  });
  return id;
};

export const payDebt = (debtId: number, amount: number): void => {
  executeTransaction(() => {
    const debt = db.getFirstSync<{ remaining: number; customer_id: number }>(
      'SELECT remaining, customer_id FROM debts WHERE id = ?', [debtId]
    );
    if (!debt) return;
    const newRemaining = Math.max(0, debt.remaining - amount);
    const isPaid = newRemaining <= 0 ? 1 : 0;
    db.runSync(
      'UPDATE debts SET paid_amount = paid_amount + ?, remaining = ?, is_paid = ?, paid_at = datetime(\'now\') WHERE id = ?',
      [amount, newRemaining, isPaid, debtId]
    );
    db.runSync('UPDATE customers SET total_debt = total_debt - ? WHERE id = ?', [amount, debt.customer_id]);
  });
};

export const getTotalOutstandingDebt = (): number => {
  const r = db.getFirstSync<{ total: number }>('SELECT COALESCE(SUM(remaining), 0) as total FROM debts WHERE is_paid = 0');
  return r?.total ?? 0;
};

export const getDebtStats = () => {
  const r = db.getFirstSync<{ total_outstanding: number; total_debts: number; paid_debts: number }>(
    `SELECT COALESCE(SUM(CASE WHEN is_paid = 0 THEN remaining ELSE 0 END), 0) as total_outstanding,
            COUNT(*) as total_debts, COALESCE(SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END), 0) as paid_debts FROM debts`
  );
  return r ?? { total_outstanding: 0, total_debts: 0, paid_debts: 0 };
};
