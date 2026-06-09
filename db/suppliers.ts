import db, { executeTransaction } from './database';
import type { Supplier, SupplierFormData } from '../types';

export const getAllSuppliers = (): Supplier[] => {
  return db.getAllSync<Supplier>('SELECT * FROM suppliers ORDER BY name ASC');
};

export const getSupplierById = (id: number): Supplier | null => {
  return db.getFirstSync<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id]) ?? null;
};

export const searchSuppliers = (query: string): Supplier[] => {
  const term = `%${query}%`;
  return db.getAllSync<Supplier>(
    'SELECT * FROM suppliers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC', [term, term]
  );
};

export const createSupplier = (data: SupplierFormData): number => {
  let id = 0;
  executeTransaction(() => {
    const result = db.runSync(
      'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)',
      [data.name, data.phone ?? null, data.address ?? null]
    );
    id = result.lastInsertRowId;
  });
  return id;
};

export const updateSupplier = (id: number, data: Partial<SupplierFormData>): void => {
  executeTransaction(() => {
    const fields: string[] = [];
    const values: (string | null)[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone ?? null); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address ?? null); }
    if (fields.length === 0) return;
    values.push(id.toString());
    db.runSync(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
  });
};

export const deleteSupplier = (id: number): void => {
  executeTransaction(() => { db.runSync('DELETE FROM suppliers WHERE id = ?', [id]); });
};

export const getSuppliersCount = (): number => {
  const r = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM suppliers');
  return r?.count ?? 0;
};
