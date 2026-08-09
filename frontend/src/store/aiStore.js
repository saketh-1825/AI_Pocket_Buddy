import { create } from "zustand";

export const useAIStore = create((set) => ({
  isAiDrawerOpen: false,
  aiChatHistory: [],
  
  toggleAiDrawer: () => set((state) => ({ isAiDrawerOpen: !state.isAiDrawerOpen })),
  setAiDrawerOpen: (isOpen) => set({ isAiDrawerOpen: isOpen }),
  addChatMessage: (msg) => set((state) => ({ aiChatHistory: [...state.aiChatHistory, msg] })),
  clearChatHistory: () => set({ aiChatHistory: [] }),
}));
