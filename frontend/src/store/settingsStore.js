import { create } from "zustand";

export const useSettingsStore = create((set) => ({
  theme: "light", 
  currency: "INR",
  language: "en",
  
  setTheme: (theme) => set({ theme }),
  setCurrency: (currency) => set({ currency }),
  setLanguage: (language) => set({ language }),
}));
