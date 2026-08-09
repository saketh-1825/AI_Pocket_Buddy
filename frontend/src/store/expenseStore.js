import { create } from "zustand";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../services/api/expenses";

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  
  fetchExpenses: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getExpenses();
      set({ expenses: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
  
  addExpense: async (expenseData) => {
    set({ loading: true, error: null });
    try {
      const res = await createExpense(expenseData);
      await get().fetchExpenses();
      return res;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  
  updateExpense: async (id, expenseData) => {
    set({ loading: true, error: null });
    try {
      const res = await updateExpense(id, expenseData);
      await get().fetchExpenses();
      return res;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  
  deleteExpense: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await deleteExpense(id);
      await get().fetchExpenses();
      return res;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
