import { create } from 'zustand';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderFormData } from '../types';
import * as poDb from '../db/purchaseOrders';

interface PurchaseOrderState {
  orders: PurchaseOrder[];
  loading: boolean;
  loadOrders: () => void;
  createOrder: (data: PurchaseOrderFormData) => number;
  getOrderById: (id: number) => PurchaseOrder | null;
  getOrderItems: (orderId: number) => PurchaseOrderItem[];
  cancelOrder: (id: number) => void;
  getOrdersBySupplier: (supplierId: number) => PurchaseOrder[];
}

export const usePurchaseOrderStore = create<PurchaseOrderState>((set, get) => ({
  orders: [],
  loading: false,

  loadOrders: () => {
    set({ loading: true });
    const orders = poDb.getAllPurchaseOrders();
    set({ orders, loading: false });
  },

  createOrder: (data: PurchaseOrderFormData) => {
    const id = poDb.createPurchaseOrder(data);
    get().loadOrders();
    return id;
  },

  getOrderById: (id: number) => poDb.getPurchaseOrderById(id),

  getOrderItems: (orderId: number) => poDb.getPurchaseOrderItems(orderId),

  cancelOrder: (id: number) => {
    poDb.cancelPurchaseOrder(id);
    get().loadOrders();
  },

  getOrdersBySupplier: (supplierId: number) => poDb.getPurchaseOrdersBySupplier(supplierId),
}));
