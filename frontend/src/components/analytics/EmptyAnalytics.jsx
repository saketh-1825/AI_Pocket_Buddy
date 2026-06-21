import { motion } from "framer-motion";
import { FiBarChart2 } from "react-icons/fi";
import { Link } from "react-router-dom";

/**
 * Premium Empty State illustration for the Analytics Dashboard.
 * Centered layout with a faded chart icon, violet glow, and actionable link.
 */
export default function EmptyAnalytics() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 px-6 rounded-xl2 border border-white/5 bg-[#16161A] text-center max-w-md mx-auto relative overflow-hidden"
    >
      {/* soft back glow blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#A855F7]/10 rounded-full blur-[50px] pointer-events-none" />

      {/* Floating icon */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 text-[#A855F7]/70 shadow-inner"
      >
        <FiBarChart2 className="h-10 w-10" />
      </motion.div>

      <h3 className="text-xl font-bold text-white mb-2 tracking-wide">
        No analytics available
      </h3>
      
      <p className="text-sm text-[#9CA3AF] max-w-xs font-medium leading-relaxed mb-8">
        Start adding expenses to unlock insights.
      </p>

      <Link to="/dashboard">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#A855F7] hover:bg-[#b56ef8] text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all duration-200"
        >
          Add Expense
        </motion.button>
      </Link>
    </motion.div>
  );
}
