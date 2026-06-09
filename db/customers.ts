import db, { executeTransaction } from './database';
import type { Customer, CustomerFormData } from '../types';

export const getAllCustomers = (): Customer[] => {
  return db.getAllSync<Customer>('SELECT * FROM customers ORDER BY name ASC');
};

export const getCustomerById = (id: number): Customer | null => {
  return db.getFirstSync<Customer>('SELECT * FROM customers WHERE id = ?', [id]) ?? null;
};

export const searchCustomers = (query: string): Customer[] => {
  const t = `%${query}%`;
  return db.getAllSync<Customer>(
    'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC', [t, t]
  );
};

export const getCustomersWithDebt = (): Customer[] => {
  return db.getAllSync<Customer>(
    `SELECT c.*, COALESCE(SUM(d.remaining), 0) as total_debt
     FROM customers c LEFT JOIN debts d ON c.id = d.customer_id AND d.is_paid = 0
     GROUP BY c.id HAVING total_debt > 0 ORDER BY total_debt DESC`
  );
};

export const createCustomer = (data: CustomerFormData): number => {
  let id = 0;
  executeTransaction(() => {
    const r = db.runSync('INSERT INTO customers (name, phone) VALUES (?, ?)', [data.name, data.phone ?? null]);
    id = r.lastInsertRowId;
  });
  return id;
};

export const updateCustomer = (id: number, data: Partial<CustomerFormData>): void => {
  executeTransaction(() => {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }

    if (fields.length === 0) return;
    values.push(id);
    db.runSync(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
  });
};

export const deleteCustomer = (id: number): void => {
  executeTransaction(() => { db.runSync('DELETE FROM customers WHERE id = ?', [id]); });
};

export const updateCustomerDebt = (customerId: number, amount: number): void => {
  executeTransaction(() => {
    db.runSync('UPDATE customers SET total_debt = total_debt + ? WHERE id = ?', [amount, customerId]);
  });
};

export const getCustomerDebtTotal = (customerId: number): number => {
  const r = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(remaining), 0) as total FROM debts WHERE customer_id = ? AND is_paid = 0', [customerId]
  );
  return r?.total ?? 0;
};
