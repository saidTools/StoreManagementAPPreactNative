import { create } from 'zustand';
import type { Customer, CustomerFormData } from '../types';
import * as customerDb from '../db/customers';

interface CustomerState {
  customers: Customer[];
  searchQuery: string;
  loading: boolean;

  loadCustomers: () => void;
  searchCustomers: (query: string) => void;
  addCustomer: (data: CustomerFormData) => number;
  updateCustomer: (id: number, data: Partial<CustomerFormData>) => void;
  deleteCustomer: (id: number) => void;
  getCustomerById: (id: number) => Customer | null;
  getCustomersWithDebt: () => Customer[];
  getCustomerDebtTotal: (id: number) => number;
  getCustomersCount: () => number;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  searchQuery: '',
  loading: false,

  loadCustomers: () => {
    set({ loading: true });
    const customers = customerDb.getAllCustomers();
    set({ customers, loading: false });
  },

  searchCustomers: (query: string) => {
    set({ searchQuery: query, loading: true });
    const customers = query
      ? customerDb.searchCustomers(query)
      : customerDb.getAllCustomers();
    set({ customers, loading: false });
  },

  addCustomer: (data: CustomerFormData) => {
    const id = customerDb.createCustomer(data);
    get().loadCustomers();
    return id;
  },

  updateCustomer: (id, data) => {
    customerDb.updateCustomer(id, data);
    get().loadCustomers();
  },

  deleteCustomer: (id) => {
    customerDb.deleteCustomer(id);
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }));
  },

  getCustomerById: (id) => customerDb.getCustomerById(id),
  getCustomersWithDebt: () => customerDb.getCustomersWithDebt(),
  getCustomerDebtTotal: (id) => customerDb.getCustomerDebtTotal(id),
  getCustomersCount: () => customerDb.getAllCustomers().length,
}));
