import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiDollarSign,
  FiSettings,
  FiLogOut
} from "react-icons/fi";
import { toast } from "react-toastify";

import { useSidebar } from "../../hooks/useSidebar";
import Sidebar from "./Sidebar";
import { useAuthStore } from "../../store/authStore";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen, closeSidebar } = useSidebar();
  const userName = useAuthStore((state) => state.userName) || "Saketh";
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
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
    { path: "/budgets", label: "Budgets", icon: FiDollarSign, color: "#22C55E" },
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
      {/* SIDEBAR COMPONENT (Desktop collapsible) */}
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
        {navItems.map((item) => {
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
        {/* Mobile Log Out Tab */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-grow py-1 gap-1 text-[10px] font-medium transition-colors text-[#6B7280] hover:text-[#EF4444]"
        >
          <FiLogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </nav>
    </div>
  );
}
