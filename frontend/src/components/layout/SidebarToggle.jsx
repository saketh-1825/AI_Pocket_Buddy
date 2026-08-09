import { useSidebar } from "../../hooks/useSidebar";
import { FiMenu } from "react-icons/fi";

export default function SidebarToggle() {
  const { isMobileOpen, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="w-10 h-10 flex lg:hidden items-center justify-center text-[#6B7280] hover:text-[#111827] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] shadow-sm rounded-xl transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-primary/20 focus:outline-none shrink-0"
      aria-label="Toggle navigation menu"
      aria-expanded={isMobileOpen}
    >
      <FiMenu className="h-5 w-5 shrink-0" />
    </button>
  );
}
