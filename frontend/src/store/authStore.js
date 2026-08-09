import { create } from "zustand";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || null,
  userName: localStorage.getItem("userName") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  
  setAuth: (token, userName) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userName", userName);
    set({ token, userName, isAuthenticated: true });
  },
  
  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    set({ token: null, userName: null, isAuthenticated: false });
  }
}));
