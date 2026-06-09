import db, { executeTransaction } from './database';
import type { Product, ProductFormData } from '../types';

export const getAllProducts = (): Product[] => {
  return db.getAllSync<Product>('SELECT * FROM products ORDER BY name ASC');
};

export const getProductById = (id: number): Product | null => {
  return db.getFirstSync<Product>('SELECT * FROM products WHERE id = ?', [id]) ?? null;
};

export const getProductByBarcode = (barcode: string): Product | null => {
  return db.getFirstSync<Product>('SELECT * FROM products WHERE barcode = ?', [barcode]) ?? null;
};

export const searchProducts = (query: string): Product[] => {
  const searchTerm = `%${query}%`;
  return db.getAllSync<Product>(
    'SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? ORDER BY name ASC',
    [searchTerm, searchTerm]
  );
};

export const getProductsByCategory = (category: string): Product[] => {
  return db.getAllSync<Product>(
    'SELECT * FROM products WHERE category = ? ORDER BY name ASC', [category]
  );
};

export const getLowStockProducts = (): Product[] => {
  return db.getAllSync<Product>(
    'SELECT * FROM products WHERE quantity <= low_stock_threshold AND low_stock_threshold > 0 ORDER BY quantity ASC'
  );
};

export const getProductsCount = (): number => {
  const r = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM products');
  return r?.count ?? 0;
};

export const createProduct = (data: ProductFormData): number => {
  let id = 0;
  executeTransaction(() => {
    const result = db.runSync(
      `INSERT INTO products (name, barcode, buy_price, sell_price, quantity, low_stock_threshold, category, image_uri)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.barcode ?? null, data.buyPrice, data.sellPrice, data.quantity, data.lowStockThreshold ?? 5, data.category ?? null, data.imageUri ?? null]
    );
    id = result.lastInsertRowId;
  });
  return id;
};

export const updateProduct = (id: number, data: Partial<ProductFormData>): void => {
  executeTransaction(() => {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.barcode !== undefined) { fields.push('barcode = ?'); values.push(data.barcode); }
    if (data.buyPrice !== undefined) { fields.push('buy_price = ?'); values.push(data.buyPrice); }
    if (data.sellPrice !== undefined) { fields.push('sell_price = ?'); values.push(data.sellPrice); }
    if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }
    if (data.lowStockThreshold !== undefined) { fields.push('low_stock_threshold = ?'); values.push(data.lowStockThreshold); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.imageUri !== undefined) { fields.push('image_uri = ?'); values.push(data.imageUri); }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.runSync(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
  });
};

export const deleteProduct = (id: number): void => {
  executeTransaction(() => { db.runSync('DELETE FROM products WHERE id = ?', [id]); });
};

export const updateProductQuantity = (id: number, quantityChange: number): void => {
  executeTransaction(() => {
    db.runSync("UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?", [quantityChange, id]);
  });
};

export const getCategories = (): string[] => {
  return db.getAllSync<{ category: string }>(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category"
  ).map(r => r.category);
};

