import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../../hooks/useSidebar";
import {
  FiGrid,
  FiDollarSign,
  FiTag,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiMenu
} from "react-icons/fi";

export default function Sidebar({ handleLogout, userName }) {
  const userEmail = localStorage.getItem("userEmail") || `${userName.toLowerCase().replace(/\s+/g, "")}@example.com`;
  const location = useLocation();
  const { isCollapsed, isMobileOpen, closeSidebar, openSidebar } = useSidebar();

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

  const sidebarClasses = `
    fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E5E7EB] flex flex-col justify-between select-none transition-all duration-200 ease-in-out transform lg:z-30
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    w-[280px]
    ${isCollapsed ? "lg:w-[72px]" : "lg:w-[220px]"}
  `;

  return (
    <aside className={sidebarClasses} role="navigation">
      <div className="flex flex-col">
        {/* Logo / Header */}
        <div className={`h-20 flex items-center border-b border-[#E5E7EB] transition-all duration-200 ${isCollapsed ? "px-0 justify-center" : "pl-6 pr-4 justify-between"
          } w-full`}>
          {isMobileOpen ? (
            /* Mobile Open State Drawer Header */
            <>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-extrabold text-[#4F46E5] shrink-0">
                  PB
                </span>
                <span className="text-[18px] font-extrabold tracking-tight text-[#111827] truncate">
                  Pocket Buddy
                </span>
              </div>
              {/* Mobile Close Button */}
              <button
                onClick={closeSidebar}
                className="w-9 h-9 flex items-center justify-center bg-transparent text-[#6B7280] hover:text-[#111827] cursor-pointer transition-colors shrink-0 focus:outline-none"
                aria-label="Close menu drawer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </>
          ) : isCollapsed ? (
            /* Desktop Collapsed State Header */
            <div
              onClick={openSidebar}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openSidebar();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Expand sidebar"
              className="w-10 h-10 flex items-center justify-center relative cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-150"
            >
              {/* Logo "PB" text */}
              <span className="text-[20px] font-extrabold text-[#4F46E5] absolute inset-0 flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0">
                PB
              </span>
              {/* Hamburger Icon */}
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 text-[#6B7280]">
                <FiMenu className="h-5 w-5" />
              </span>
            </div>
          ) : (
            /* Desktop Expanded State Header */
            <>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-extrabold text-[#4F46E5] shrink-0">
                  PB
                </span>
                <span className="text-[18px] font-extrabold tracking-tight text-[#111827] truncate">
                  Pocket Buddy
                </span>
              </div>

              {/* Desktop Collapse Button */}
              <button
                onClick={closeSidebar}
                className="hidden lg:flex w-9 h-9 items-center justify-center bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] rounded-xl cursor-pointer transition-all duration-200 shrink-0 shadow-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                aria-label="Collapse navigation sidebar"
              >
                <FiChevronLeft className="h-5 w-5 text-[#6B7280]" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Links */}
        <nav className={`p-4 space-y-1 mt-4 transition-all duration-200 ${isCollapsed ? "px-2" : "px-4"}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (isMobileOpen) {
                    closeSidebar();
                  }
                }}
                className={`flex items-center gap-3 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 relative group ${active
                  ? "text-[#4F46E5] bg-[#EEF2FF]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]"
                  } ${isCollapsed ? "px-0 justify-center" : "px-4 justify-start"}`}
                style={{ transform: "translateZ(0)" }}
              >
                <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "w-full"}`}>
                  <Icon
                    className="h-4.5 w-4.5 shrink-0 transition-colors duration-200"
                    style={{ color: active ? "#4F46E5" : item.color }}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#111827] text-[12px] font-semibold rounded-lg shadow-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-150 delay-150 transform translate-x-[-10px] group-hover:translate-x-0" role="tooltip">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile / Logout Footer */}
      <div className={`p-4 border-t border-[#E5E7EB] select-none bg-white transition-all duration-200 ${isCollapsed ? "px-2" : "px-4"
        }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 px-2 mb-4">
              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E2E8F0] shrink-0">
                <span className="text-[12px] font-bold text-[#4F46E5]">
                  {userName.substring(0, 2).toUpperCase()}
                </span>
              </div>
              {/* User details */}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-[#111827] truncate leading-none">{userName}</p>
                <p className="text-[12px] text-[#6B7280] font-medium truncate mt-1.5 leading-none">{userEmail}</p>
              </div>

            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-[#6B7280] hover:text-[#EF4444] hover:bg-[#F8FAFC] transition-all duration-200 text-left cursor-pointer focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              <FiLogOut className="h-4.5 w-4.5 shrink-0 text-[#6B7280]" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Collapsed Avatar initials bubble */}
            <div className="relative group">
              <div
                className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center border border-[#E2E8F0] cursor-pointer"
              >
                <span className="text-[12px] font-bold text-[#4F46E5]">
                  {userName.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#111827] text-[12px] font-semibold rounded-lg shadow-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all duration-150 delay-150 transform translate-x-[-10px] group-hover:translate-x-0" role="tooltip">
                {userName} ({userEmail})
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
