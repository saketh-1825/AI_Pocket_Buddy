import { create } from "zustand";

const isDesktopViewport = () => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 1024px)").matches;
};

export const useSidebarStore = create((set) => ({
  mode: (() => {
    if (!isDesktopViewport()) return "mobile-closed";
    const saved = localStorage.getItem("sidebarMode");
    return saved === "collapsed" ? "collapsed" : "expanded";
  })(),
  
  setMode: (newMode) => {
    set({ mode: newMode });
    if (newMode === "expanded" || newMode === "collapsed") {
      localStorage.setItem("sidebarMode", newMode);
    }
  },
  
  toggleSidebar: () => {
    set((state) => {
      const desktop = isDesktopViewport();
      if (desktop) {
        const next = state.mode === "expanded" ? "collapsed" : "expanded";
        localStorage.setItem("sidebarMode", next);
        return { mode: next };
      } else {
        const next = state.mode === "mobile-open" ? "mobile-closed" : "mobile-open";
        return { mode: next };
      }
    });
  },
  
  closeSidebar: () => {
    set(() => {
      const desktop = isDesktopViewport();
      if (desktop) {
        localStorage.setItem("sidebarMode", "collapsed");
        return { mode: "collapsed" };
      } else {
        return { mode: "mobile-closed" };
      }
    });
  },
  
  openSidebar: () => {
    set(() => {
      const desktop = isDesktopViewport();
      if (desktop) {
        localStorage.setItem("sidebarMode", "expanded");
        return { mode: "expanded" };
      } else {
        return { mode: "mobile-open" };
      }
    });
  }
}));
