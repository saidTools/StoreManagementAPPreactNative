import db, { executeTransaction } from './database';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderFormData } from '../types';

export const getAllPurchaseOrders = (): PurchaseOrder[] => {
  return db.getAllSync<PurchaseOrder>(
    `SELECT po.*, s.name as supplier_name FROM purchase_orders po
     LEFT JOIN suppliers s ON po.supplier_id = s.id
     ORDER BY po.created_at DESC`
  );
};

export const getPurchaseOrderById = (id: number): PurchaseOrder | null => {
  return db.getFirstSync<PurchaseOrder>(
    `SELECT po.*, s.name as supplier_name FROM purchase_orders po
     LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?`, [id]
  ) ?? null;
};

export const getPurchaseOrderItems = (orderId: number): PurchaseOrderItem[] => {
  return db.getAllSync<PurchaseOrderItem>(
    'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [orderId]
  );
};

export const createPurchaseOrder = (data: PurchaseOrderFormData): number => {
  let orderId = 0;
  const total = data.items.reduce((sum, i) => sum + i.subtotal, 0);
  executeTransaction(() => {
    const result = db.runSync(
      'INSERT INTO purchase_orders (supplier_id, total_amount, status) VALUES (?, ?, ?)',
      [data.supplierId, total, 'completed']
    );
    orderId = result.lastInsertRowId;

    for (const item of data.items) {
      db.runSync(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, quantity, unit_cost, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.productName, item.quantity, item.unitCost, item.subtotal]
      );
      db.runSync("UPDATE products SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?",
        [item.quantity, item.productId]);
    }
  });
  return orderId;
};

export const cancelPurchaseOrder = (id: number): void => {
  executeTransaction(() => {
    const items = db.getAllSync<{ product_id: number; quantity: number }>(
      'SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = ?', [id]
    );
    for (const item of items) {
      db.runSync("UPDATE products SET quantity = MAX(0, quantity - ?), updated_at = datetime('now') WHERE id = ?",
        [item.quantity, item.product_id]);
    }
    db.runSync("UPDATE purchase_orders SET status = 'cancelled' WHERE id = ?", [id]);
  });
};

export const getPurchaseOrdersBySupplier = (supplierId: number): PurchaseOrder[] => {
  return db.getAllSync<PurchaseOrder>(
    'SELECT * FROM purchase_orders WHERE supplier_id = ? ORDER BY created_at DESC', [supplierId]
  );
};
