import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronDown,
  FiX,
  FiChevronRight
} from "react-icons/fi";

export default function ExploreMenu({ categoriesCount = 0 }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const userName = localStorage.getItem("userName") || "User";

  // Click away listener to close dropdown when tapping outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Responsive animation configuration
  const getDropdownVariants = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    return {
      hidden: {
        opacity: 0,
        y: isMobile ? "100%" : -10,
        scale: isMobile ? 1 : 0.95
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 350,
          damping: 30,
          duration: 0.25
        }
      },
      exit: {
        opacity: 0,
        y: isMobile ? "100%" : -10,
        scale: isMobile ? 1 : 0.95,
        transition: {
          duration: 0.2,
          ease: "easeInOut"
        }
      }
    };
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* TRIGGER BUTTON */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-2.5 rounded-full bg-white border border-default hover:bg-slate-50 text-[#64748B] font-semibold text-sm transition-all duration-300 flex items-center gap-1.5 select-none shadow-sm"
      >
        <span>Explore</span>
        <FiChevronDown className="h-4 w-4 text-[#64748B] transition-transform duration-300" />
      </motion.button>

      {/* MOBILE BACKDROP */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm sm:hidden z-40" />
        )}
      </AnimatePresence>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={getDropdownVariants()}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:bottom-auto sm:mt-3 w-full sm:w-[340px] bg-surface border border-default sm:rounded-dialog rounded-t-dialog p-5 shadow-md z-50 overflow-hidden"
          >
            {/* Header branding (only on desktop/tablet layout) */}
            <div className="flex justify-between items-center border-b border-default pb-4 mb-4 select-none">
              <div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
                  Explore
                </h3>
                <p className="text-xs font-semibold text-[#0F172A] mt-0.5">
                  Discover AI Powered Finance
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="sm:hidden text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable features container */}
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              <ExploreMenuItem
                icon="📈"
                title="Analytics"
                subtitle="Track spending trends and reports"
                onClick={() => {
                  navigate("/analytics");
                  setIsOpen(false);
                }}
              />
              <ExploreMenuItem
                icon="💰"
                title="Budgets"
                subtitle="Set monthly category limits"
                onClick={() => {
                  navigate("/budgets");
                  setIsOpen(false);
                }}
              />
              <ExploreMenuItem
                icon="🤖"
                title="AI Buddy"
                subtitle="Insights, chatbot & recommendations"
                onClick={() => {
                  navigate("/ai-buddy");
                  setIsOpen(false);
                }}
              />
              <ExploreMenuItem
                icon="🔥"
                title="Heatmap"
                subtitle="365-day calendar activity"
                onClick={() => {
                  navigate("/heatmap");
                  setIsOpen(false);
                }}
              />

              <ExploreMenuItem
                icon="🔮"
                title="Forecasting"
                subtitle="Future spending prediction"
                badgeText="Coming Soon"
                isComingSoon={true}
              />
              <ExploreMenuItem
                icon="⚙"
                title="Settings"
                subtitle="App preferences"
                badgeText="Coming Soon"
                isComingSoon={true}
              />
            </div>

            {/* USER PROFILE FOOTER */}
            <div className="border-t border-default pt-4 mt-4 select-none">
              <div className="flex justify-between items-center px-2">
                <div>
                  <p className="text-[9px] uppercase font-extrabold tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Logged in
                  </p>
                  <p className="text-xs font-bold text-[#0F172A] mt-0.5">{userName}</p>
                </div>
                <button 
                  disabled 
                  className="text-[10px] uppercase font-bold tracking-wider text-[#4F46E5] opacity-60 flex items-center gap-0.5"
                >
                  Manage Profile →
                </button>
              </div>
            </div>

            {/* MOBILE CLOSE MENU BUTTON */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 sm:hidden bg-slate-50 hover:bg-slate-100 text-[#0F172A] rounded-btn py-3 text-xs font-bold uppercase tracking-wider transition-colors border border-default"
            >
              Close Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExploreMenuItem({ 
  icon: Icon, 
  title, 
  subtitle, 
  badgeText, 
  isComingSoon = false, 
  onClick 
}) {
  return (
    <motion.div
      whileHover={!isComingSoon ? { scale: 1.01 } : {}}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onClick={!isComingSoon ? onClick : undefined}
      className={`flex items-center justify-between p-3.5 rounded-xl border border-transparent transition-all duration-300 ${
        isComingSoon 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:bg-slate-50 hover:border-slate-100 cursor-pointer group"
      }`}
    >
      <div className="flex items-center gap-3.5">
        {/* Icon Container */}
        {Icon && (
          <div className={`p-2 rounded-xl flex items-center justify-center w-9.5 h-9.5 ${
            isComingSoon 
              ? "bg-slate-100 text-slate-400" 
              : "bg-[#4F46E5]/10 text-[#4F46E5] group-hover:bg-[#4F46E5]/15 transition-colors"
          }`}>
            {typeof Icon === "string" ? (
              <span className="text-base select-none leading-none">{Icon}</span>
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </div>
        )}

        {/* Text Container */}
        <div>
          <h5 className="text-sm font-bold text-[#0F172A] font-sans flex items-center gap-2">
            {title}
            {badgeText && (
              <span className={`inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                isComingSoon 
                  ? "bg-slate-100 border-slate-200 text-slate-500" 
                  : "bg-[#4F46E5]/10 border-[#4F46E5]/20 text-[#4F46E5]"
              }`}>
                {badgeText}
              </span>
            )}
          </h5>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium font-sans">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right chevron or open indicator */}
      {!isComingSoon && (
        <FiChevronRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#0F172A] transition-colors group-hover:translate-x-0.5 transition-transform" />
      )}
    </motion.div>
  );
}

