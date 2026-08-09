import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiDownload } from "react-icons/fi";

export default function ExportMenu({ options = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 30,
        duration: 0.2
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* TRIGGER BUTTON */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-full text-xs font-bold text-[#64748B] transition-all duration-200 shadow-sm"
      >
        <FiDownload className="h-3.5 w-3.5 text-[#64748B]" />
        <span>Export</span>
        <FiChevronDown className={`h-3.5 w-3.5 text-[#94A3B8] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2.5 w-56 rounded-xl bg-white border border-[#E2E8F0] p-1.5 shadow-md z-50 origin-top-right select-none"
          >
            <div className="py-1 space-y-1">
              {options.length > 0 ? (
                options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      option.onClick();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-all duration-200"
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs font-medium text-[#64748B]/60 italic">
                  No options available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

