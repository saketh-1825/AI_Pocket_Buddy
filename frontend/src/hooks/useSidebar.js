import { useEffect } from "react";
import { useSidebarStore } from "../store/sidebarStore";

export function useSidebar() {
  const mode = useSidebarStore((state) => state.mode);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);
  const openSidebar = useSidebarStore((state) => state.openSidebar);
  const setMode = useSidebarStore((state) => state.setMode);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    
    const handleViewportChange = (e) => {
      if (e.matches) {
        const saved = localStorage.getItem("sidebarMode");
        setMode(saved === "collapsed" ? "collapsed" : "expanded");
      } else {
        setMode("mobile-closed");
      }
    };

    // Sync state on mount if needed
    if (mediaQuery.matches) {
      const saved = localStorage.getItem("sidebarMode");
      const expectedMode = saved === "collapsed" ? "collapsed" : "expanded";
      if (mode !== expectedMode && mode !== "mobile-open" && mode !== "mobile-closed") {
        setMode(expectedMode);
      }
    } else if (mode !== "mobile-closed" && mode !== "mobile-open") {
      setMode("mobile-closed");
    }

    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, [setMode, mode]);

  return {
    mode,
    isExpanded: mode === "expanded",
    isCollapsed: mode === "collapsed",
    isMobileOpen: mode === "mobile-open",
    isMobileClosed: mode === "mobile-closed",
    toggleSidebar,
    closeSidebar,
    openSidebar
  };
}
