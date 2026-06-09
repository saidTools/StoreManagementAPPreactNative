import { create } from 'zustand';
import type { Debt } from '../types';
import * as debtDb from '../db/debts';

interface DebtState {
  debts: Debt[];
  loading: boolean;

  loadDebts: () => void;
  loadDebtsByCustomer: (customerId: number) => Debt[];
  getUnpaidDebts: () => Debt[];
  getDebtById: (id: number) => Debt | null;
  payDebt: (debtId: number, amount: number) => void;
  getTotalOutstandingDebt: () => number;
  getDebtStats: () => { total_outstanding: number; total_debts: number; paid_debts: number };
}

export const useDebtStore = create<DebtState>((set, get) => ({
  debts: [],
  loading: false,

  loadDebts: () => {
    set({ loading: true });
    const debts = debtDb.getAllDebts();
    set({ debts, loading: false });
  },

  loadDebtsByCustomer: (customerId: number) => {
    return debtDb.getDebtsByCustomer(customerId);
  },

  getUnpaidDebts: () => debtDb.getUnpaidDebts(),
  getDebtById: (id) => debtDb.getDebtById(id),

  payDebt: (debtId: number, amount: number) => {
    debtDb.payDebt(debtId, amount);
    get().loadDebts();
  },

  getTotalOutstandingDebt: () => debtDb.getTotalOutstandingDebt(),
  getDebtStats: () => debtDb.getDebtStats(),
}));
