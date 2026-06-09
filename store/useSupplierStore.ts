import { create } from 'zustand';
import type { Supplier, SupplierFormData } from '../types';
import * as supplierDb from '../db/suppliers';

interface SupplierState {
  suppliers: Supplier[];
  loading: boolean;
  loadSuppliers: () => void;
  searchSuppliers: (query: string) => Supplier[];
  addSupplier: (data: SupplierFormData) => number;
  updateSupplier: (id: number, data: Partial<SupplierFormData>) => void;
  deleteSupplier: (id: number) => void;
  getSupplierById: (id: number) => Supplier | null;
  getSuppliersCount: () => number;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  loading: false,

  loadSuppliers: () => {
    set({ loading: true });
    const suppliers = supplierDb.getAllSuppliers();
    set({ suppliers, loading: false });
  },

  searchSuppliers: (query: string) => supplierDb.searchSuppliers(query),

  addSupplier: (data: SupplierFormData) => {
    const id = supplierDb.createSupplier(data);
    get().loadSuppliers();
    return id;
  },

  updateSupplier: (id: number, data: Partial<SupplierFormData>) => {
    supplierDb.updateSupplier(id, data);
    get().loadSuppliers();
  },

  deleteSupplier: (id: number) => {
    supplierDb.deleteSupplier(id);
    get().loadSuppliers();
  },

  getSupplierById: (id: number) => supplierDb.getSupplierById(id),

  getSuppliersCount: () => supplierDb.getSuppliersCount(),
}));
