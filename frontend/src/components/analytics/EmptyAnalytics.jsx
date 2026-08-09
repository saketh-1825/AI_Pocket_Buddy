import { motion } from "framer-motion";
import { FiBarChart2 } from "react-icons/fi";
import { Link } from "react-router-dom";

/**
 * Premium Empty State illustration for the Analytics Dashboard.
 * Centered layout with a faded chart icon, and actionable link.
 */
export default function EmptyAnalytics() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border border-slate-100 bg-white text-center max-w-md mx-auto relative overflow-hidden shadow-sm"
    >
      {/* Static icon container */}
      <div
        className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-[#4F46E5]/70"
      >
        <FiBarChart2 className="h-10 w-10" />
      </div>

      <h3 className="text-xl font-bold text-[#0F172A] mb-2 tracking-wide">
        No analytics available
      </h3>
      
      <p className="text-sm text-[#64748B] max-w-xs font-medium leading-relaxed mb-8">
        Start adding expenses to unlock insights.
      </p>

      <Link to="/">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-all duration-200"
        >
          Add Expense
        </motion.button>
      </Link>
    </motion.div>
  );
}

