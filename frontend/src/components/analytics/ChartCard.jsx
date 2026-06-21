import { motion } from "framer-motion";

/**
 * ChartCard wrapper for analytical charts and content blocks.
 * Styled with #16161A background, 16px border-radius, and flat layout borders.
 */
export default function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`bg-[#16161A] border border-white/5 rounded-xl2 p-6 transition-all duration-300 hover:border-white/10 ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-base font-bold text-white tracking-wide uppercase">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-[#9CA3AF] mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}
