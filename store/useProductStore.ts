import { create } from 'zustand';
import type { Product, ProductFormData } from '../types';
import * as productDb from '../db/products';

interface ProductState {
  products: Product[];
  searchQuery: string;
  selectedCategory: string | null;
  loading: boolean;

  loadProducts: () => void;
  searchProducts: (query: string) => void;
  filterByCategory: (category: string | null) => void;
  addProduct: (data: ProductFormData) => number;
  updateProduct: (id: number, data: Partial<ProductFormData>) => void;
  deleteProduct: (id: number) => void;
  getProductById: (id: number) => Product | null;
  getProductByBarcode: (barcode: string) => Product | null;
  getLowStockProducts: () => Product[];
  getProductsCount: () => number;
  getCategories: () => string[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  searchQuery: '',
  selectedCategory: null,
  loading: false,

  loadProducts: () => {
    set({ loading: true });
    const products = productDb.getAllProducts();
    set({ products, loading: false });
  },

  searchProducts: (query: string) => {
    set({ searchQuery: query, loading: true });
    const products = query
      ? productDb.searchProducts(query)
      : productDb.getAllProducts();
    set({ products, loading: false });
  },

  filterByCategory: (category: string | null) => {
    set({ selectedCategory: category, loading: true });
    const products = category
      ? productDb.getProductsByCategory(category)
      : productDb.getAllProducts();
    set({ products, loading: false });
  },

  addProduct: (data: ProductFormData) => {
    const id = productDb.createProduct(data);
    get().loadProducts();
    return id;
  },

  updateProduct: (id: number, data: Partial<ProductFormData>) => {
    productDb.updateProduct(id, data);
    get().loadProducts();
  },

  deleteProduct: (id: number) => {
    productDb.deleteProduct(id);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  getProductById: (id: number) => {
    return productDb.getProductById(id);
  },
  getProductByBarcode: (barcode: string) => {
    return productDb.getProductByBarcode(barcode);
  },

  getLowStockProducts: () => {
    return productDb.getLowStockProducts();
  },

  getProductsCount: () => {
    return productDb.getProductsCount();
  },

  getCategories: () => {
    return productDb.getCategories();
  },

}));
