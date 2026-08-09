import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiTrendingUp,
  FiDollarSign,
  FiTag,
  FiCalendar,
  FiMoreHorizontal,
  FiLogOut,
  FiZap,
  FiSettings
} from "react-icons/fi";
import { toast } from "react-toastify";

import { useSidebar } from "../../hooks/useSidebar";
import Sidebar from "./Sidebar";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen, closeSidebar } = useSidebar();
  const [showMoreMobile, setShowMoreMobile] = useState(false);
  const userName = localStorage.getItem("userName") || "Saketh";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    toast.info("Logged out successfully", { theme: "light" });
    navigate("/login");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isMobileOpen) {
        closeSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, closeSidebar]);

  const navItems = [
    { path: "/", label: "Dashboard", icon: FiGrid, color: "#4F46E5" },
    { path: "/analytics", label: "Analytics", icon: FiTrendingUp, color: "#0EA5E9" },
    { path: "/budgets", label: "Budgets", icon: FiDollarSign, color: "#22C55E" },
    { path: "/heatmap", label: "Heatmap", icon: FiCalendar, color: "#8B5CF6" },
    { path: "/ai-buddy", label: "AI Insights", icon: FiZap, color: "#14B8A6" },
    { path: "/settings", label: "Settings", icon: FiSettings, color: "#6B7280" },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#111827] font-sans flex overflow-x-hidden">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-200"
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR COMPONENT (Desktop collapsible + Mobile overlay drawer) */}
      <Sidebar handleLogout={handleLogout} userName={userName} />

      {/* MAIN CONTAINER */}
      <div className={`flex-grow min-h-screen flex flex-col bg-[#F6F8FC] transition-all duration-200 ease-in-out ${
        isCollapsed ? "lg:pl-[72px]" : "lg:pl-[220px]"
      }`}>

        <main className="flex-grow px-8 py-6 md:py-8 pb-28 lg:pb-8 max-w-[1400px] w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] h-16 px-4 flex items-center justify-between select-none">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-grow py-1 gap-1 text-[10px] font-medium transition-colors ${
                active ? "text-[#4F46E5]" : "text-[#6B7280]"
              }`}
            >
              <Icon className="h-5 w-5" style={{ color: active ? "#4F46E5" : item.color }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* Mobile "More" Tab */}
        <button
          onClick={() => setShowMoreMobile(!showMoreMobile)}
          className={`flex flex-col items-center justify-center flex-grow py-1 gap-1 text-[10px] font-medium transition-colors ${
            showMoreMobile || isActive("/heatmap") || isActive("/settings") || isActive("/ai-buddy")
              ? "text-[#4F46E5]"
              : "text-[#6B7280]"
          }`}
        >
          <FiMoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {/* MOBILE MORE MENU OVERLAY */}
      <AnimatePresence>
        {showMoreMobile && (
          <div className="lg:hidden fixed inset-0 z-30 flex items-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMobile(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Options Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full bg-white border-t border-default rounded-t-dialog p-5 pb-8 space-y-4 z-40 shadow-md"
            >
              <div className="flex justify-between items-center pb-2 border-b border-default">
                <span className="text-[12px] font-bold uppercase tracking-widest text-[#6B7280]">
                  More Options
                </span>
                <span className="text-[14px] text-[#111827] font-semibold">{userName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  to="/ai-buddy"
                  onClick={() => setShowMoreMobile(false)}
                  className={`flex flex-col items-center gap-2 p-2.5 rounded-btn border transition-all ${
                    isActive("/ai-buddy")
                      ? "bg-[#EEF2FF] border-default text-[#4F46E5]"
                      : "bg-white border-default text-[#6B7280]"
                  }`}
                >
                  <FiZap className="h-5 w-5" style={{ color: "#14B8A6" }} />
                  <span className="text-[11px] font-semibold text-[#111827] text-center">AI Insights</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowMoreMobile(false)}
                  className={`flex flex-col items-center gap-2 p-2.5 rounded-btn border transition-all ${
                    isActive("/settings")
                      ? "bg-[#EEF2FF] border-default text-[#4F46E5]"
                      : "bg-white border-default text-[#6B7280]"
                  }`}
                >
                  <FiSettings className="h-5 w-5" style={{ color: "#6B7280" }} />
                  <span className="text-[11px] font-semibold text-[#111827] text-center">Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMoreMobile(false);
                    handleLogout();
                  }}
                  className="flex flex-col items-center gap-2 p-2.5 rounded-btn border bg-white border-default text-[#6B7280] hover:text-[#EF4444]"
                >
                  <FiLogOut className="h-5 w-5" />
                  <span className="text-[11px] font-semibold text-[#111827] text-center">Log Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
