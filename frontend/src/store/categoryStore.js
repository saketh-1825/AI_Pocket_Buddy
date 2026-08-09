import { create } from "zustand";
import { getCategories, createCategory, deleteCategory, restoreCategory } from "../services/api/categories";

export const useCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  
  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getCategories();
      
      // Deterministic order: default categories by display_order first, then customs alphabetically
      const sorted = [...data].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        
        if (a.is_default && b.is_default) {
          return (a.display_order || 999) - (b.display_order || 999);
        }
        
        return a.name.localeCompare(b.name);
      });
      
      set({ categories: sorted, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
  
  addCategory: async (categoryData) => {
    set({ loading: true, error: null });
    try {
      const newCat = await createCategory(categoryData);
      await get().fetchCategories();
      return newCat;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to create category";
      set({ error: errMsg, loading: false });
      throw err;
    }
  },
  
  deleteCategory: async (id) => {
    set({ error: null });
    try {
      await deleteCategory(id);
      await get().fetchCategories();
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to delete category";
      set({ error: errMsg });
      throw err;
    }
  },
  
  restoreCategory: async (id) => {
    set({ error: null });
    try {
      await restoreCategory(id);
      await get().fetchCategories();
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to restore category";
      set({ error: errMsg });
      throw err;
    }
  }
}));
