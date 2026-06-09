import { create } from 'zustand';
import type { Sale, SaleItem, SaleFormData, CartItem, ReturnSale, ReturnItem } from '../types';
import * as saleDb from '../db/sales';

interface SaleState {
  sales: Sale[];
  cart: CartItem[];
  loading: boolean;

  loadSales: (limit?: number, offset?: number) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  createSale: (data: SaleFormData) => number;
  getSaleById: (id: number) => Sale | null;
  getSaleItems: (saleId: number) => SaleItem[];
  getTodaySales: () => Sale[];
  getSalesByDateRange: (start: string, end: string) => Sale[];
  getSalesStats: (start: string, end: string) => {
    total_revenue: number;
    total_transactions: number;
    total_discount: number;
    total_paid: number;
    total_cost: number;
  };
  deleteSale: (id: number) => void;
  returnSale: (saleId: number, reason?: string) => void;
  getReturns: () => (ReturnSale & { items: ReturnItem[] })[];
  getSalesCount: () => number;
  searchSales: (query: string, limit?: number, offset?: number) => Sale[];
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: [],
  cart: [],
  loading: false,

  loadSales: (limit = 100, offset = 0) => {
    set({ loading: true });
    const sales = saleDb.getAllSales(limit, offset);
    set({ sales, loading: false });
  },

  addToCart: (item: CartItem) => {
    set((state) => {
      const existing = state.cart.findIndex((ci) => ci.productId === item.productId);
      if (existing >= 0) {
        const updated = [...state.cart];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + item.quantity,
          subtotal: (updated[existing].quantity + item.quantity) * updated[existing].unitPrice,
        };
        return { cart: updated };
      }
      return { cart: [...state.cart, item] };
    });
  },

  removeFromCart: (productId: number) => {
    set((state) => ({
      cart: state.cart.filter((ci) => ci.productId !== productId),
    }));
  },

  updateCartQuantity: (productId: number, quantity: number) => {
    set((state) => ({
      cart: state.cart.map((ci) =>
        ci.productId === productId
          ? { ...ci, quantity, subtotal: quantity * ci.unitPrice }
          : ci
      ),
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  createSale: (data: SaleFormData) => {
    const id = saleDb.createSale(data);
    get().loadSales();
    return id;
  },

  getSaleById: (id: number) => saleDb.getSaleById(id),
  getSaleItems: (saleId: number) => saleDb.getSaleItems(saleId),
  getTodaySales: () => saleDb.getTodaySales(),
  getSalesByDateRange: (start, end) => saleDb.getSalesByDateRange(start, end),
  getSalesStats: (start, end) => saleDb.getSalesStats(start, end),
  deleteSale: (id: number) => {
    saleDb.deleteSale(id);
    get().loadSales();
  },
  returnSale: (saleId: number, reason?: string) => {
    saleDb.returnSale(saleId, reason);
    get().loadSales();
  },
  getReturns: () => saleDb.getReturns(),
  getSalesCount: () => saleDb.getSalesCount(),
  searchSales: (query: string, limit?: number, offset?: number) => saleDb.searchSales(query, limit, offset),

  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getCartItemCount: () => {
    return get().cart.length;
  },
}));
