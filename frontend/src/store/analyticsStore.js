import { create } from "zustand";

export const useAnalyticsStore = create((set) => ({
  activePeriod: "30d", 
  startDate: null,
  endDate: null,
  
  setActivePeriod: (activePeriod) => set({ activePeriod }),
  setDateRange: (startDate, endDate) => set({ startDate, endDate }),
}));
