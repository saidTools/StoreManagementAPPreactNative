import db, { executeTransaction } from './database';
import type { Expense, ExpenseFormData } from '../types';

export const getAllExpenses = (limit = 100, offset = 0): Expense[] => {
  return db.getAllSync<Expense>('SELECT * FROM expenses ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
};

export const getExpensesByDateRange = (startDate: string, endDate: string): Expense[] => {
  return db.getAllSync<Expense>(
    'SELECT * FROM expenses WHERE date(created_at) BETWEEN date(?) AND date(?) ORDER BY created_at DESC', [startDate, endDate]
  );
};

export const getTodayExpenses = (): Expense[] => {
  const today = new Date().toISOString().split('T')[0];
  return db.getAllSync<Expense>(
    'SELECT * FROM expenses WHERE date(created_at) = date(?) ORDER BY created_at DESC', [today]
  );
};

export const getExpensesStats = (startDate: string, endDate: string) => {
  const r = db.getFirstSync<{ total: number; count: number }>(
    'SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM expenses WHERE date(created_at) BETWEEN date(?) AND date(?)',
    [startDate, endDate]
  );
  return r ?? { total: 0, count: 0 };
};

export const createExpense = (data: ExpenseFormData): number => {
  let id = 0;
  executeTransaction(() => {
    const r = db.runSync('INSERT INTO expenses (label, amount, category) VALUES (?, ?, ?)',
      [data.label, data.amount, data.category ?? null]);
    id = r.lastInsertRowId;
  });
  return id;
};

export const updateExpense = (id: number, data: Partial<ExpenseFormData>): void => {
  executeTransaction(() => {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    if (data.label !== undefined) { fields.push('label = ?'); values.push(data.label); }
    if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (fields.length === 0) return;
    values.push(id);
    db.runSync(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`, values);
  });
};

export const deleteExpense = (id: number): void => {
  executeTransaction(() => { db.runSync('DELETE FROM expenses WHERE id = ?', [id]); });
};

export const getExpenseCategories = (): string[] => {
  return db.getAllSync<{ category: string }>(
    "SELECT DISTINCT category FROM expenses WHERE category IS NOT NULL AND category != '' ORDER BY category"
  ).map(r => r.category);
};
