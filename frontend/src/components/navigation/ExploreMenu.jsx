import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiActivity,
  FiCpu,
  FiDollarSign,
  FiTrendingUp,
  FiTag,
  FiSettings,
  FiZap,
  FiChevronDown,
  FiX
} from "react-icons/fi";

import ExploreSection from "./ExploreSection";
import ExploreMenuItem from "./ExploreMenuItem";

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
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-2.5 rounded-full text-white font-semibold text-sm transition-all duration-300 flex items-center gap-1.5 select-none"
        style={{
          background: "linear-gradient(90deg, rgba(168,85,247,0.18), rgba(107,33,168,0.12))",
          border: "1px solid rgba(168,85,247,0.2)",
          backdropFilter: "blur(12px)",
          boxShadow: isOpen ? "0 0 25px rgba(168,85,247,0.25)" : "none"
        }}
      >
        <span>Explore</span>
        <FiChevronDown className={`h-4 w-4 text-[#A855F7] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      {/* MOBILE BACKDROP */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm sm:hidden z-40" />
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
            className="fixed inset-x-0 bottom-0 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:bottom-auto sm:mt-3 w-full sm:w-[340px] bg-[#16161A] border border-[#A855F7]/15 sm:rounded-2xl rounded-t-[24px] p-5 shadow-2xl z-50 overflow-hidden"
            style={{
              boxShadow: "0 0 40px rgba(168, 85, 247, 0.15)"
            }}
          >
            {/* Header branding (only on desktop/tablet layout) */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4 select-none">
              <div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#9CA3AF]">
                  Explore
                </h3>
                <p className="text-xs font-semibold text-white mt-0.5">
                  Discover AI Powered Finance
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="sm:hidden text-[#9CA3AF] hover:text-white transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable features container */}
            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
              {/* ANALYTICS SECTION */}
              <ExploreSection title="Analytics">
                <ExploreMenuItem
                  icon={FiActivity}
                  title="Analytics"
                  subtitle="Track trends and reports"
                  badgeText="6 Reports"
                  onClick={() => {
                    navigate("/analytics");
                    setIsOpen(false);
                  }}
                />
                <ExploreMenuItem
                  icon={FiCpu}
                  title="AI Insights"
                  subtitle="Smart recommendations"
                  badgeText="Coming Soon"
                  isComingSoon={true}
                />
              </ExploreSection>

              {/* FINANCE SECTION */}
              <ExploreSection title="Finance">
                <ExploreMenuItem
                  icon={FiDollarSign}
                  title="Budgets"
                  subtitle="Set monthly limits"
                  badgeText="Coming Soon"
                  isComingSoon={true}
                />
                <ExploreMenuItem
                  icon={FiTrendingUp}
                  title="Forecasting"
                  subtitle="Future spending prediction"
                  badgeText="Coming Soon"
                  isComingSoon={true}
                />
              </ExploreSection>

              {/* MANAGEMENT SECTION */}
              <ExploreSection title="Management">
                <ExploreMenuItem
                  icon={FiTag}
                  title="Category Manager"
                  subtitle="Manage expense categories"
                  badgeText={categoriesCount > 0 ? `${categoriesCount} Active` : "Categories"}
                  onClick={() => {
                    navigate("/categories");
                    setIsOpen(false);
                  }}
                />
                <ExploreMenuItem
                  icon={FiSettings}
                  title="Settings"
                  subtitle="App preferences"
                  badgeText="Coming Soon"
                  isComingSoon={true}
                />
              </ExploreSection>

              {/* AI SECTION */}
              <ExploreSection title="AI">
                <ExploreMenuItem
                  icon={FiZap}
                  title="AI Buddy"
                  subtitle="Personal finance assistant"
                  badgeText="Coming Soon"
                  isComingSoon={true}
                />
              </ExploreSection>
            </div>

            {/* USER PROFILE FOOTER */}
            <div className="border-t border-white/5 pt-4 mt-4 select-none">
              <div className="flex justify-between items-center px-2">
                <div>
                  <p className="text-[9px] uppercase font-extrabold tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Logged in
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">{userName}</p>
                </div>
                <button 
                  disabled 
                  className="text-[10px] uppercase font-bold tracking-wider text-[#A855F7] opacity-60 flex items-center gap-0.5"
                >
                  Manage Profile →
                </button>
              </div>
            </div>

            {/* MOBILE CLOSE MENU BUTTON */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 sm:hidden bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Close Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
