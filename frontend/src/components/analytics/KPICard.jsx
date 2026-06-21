import { motion } from "framer-motion";

/**
 * Premium fintech KPI Card component.
 * Supports title, current value, icons, hover glow effects, children components (ComparisonBadge) and descriptions.
 */
export default function KPICard({ 
  title, 
  value, 
  trend, 
  trendType, 
  description, 
  children, 
  icon: Icon, 
  delay = 0 
}) {
  const isPositive = trendType === "positive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.02,
        y: -4, 
        borderColor: "#A855F7",
        boxShadow: "0 0 20px rgba(168, 85, 247, 0.15)"
      }}
      className="bg-[#16161A] border border-white/5 rounded-xl2 p-6 transition-all duration-300 flex flex-col justify-between min-h-[150px] relative overflow-hidden group select-none"
    >
      {/* Subtle hover gradient glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#A855F7]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex justify-between items-start">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9CA3AF] font-sans">
          {title}
        </p>
        {Icon && (
          <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-[#A855F7] group-hover:bg-[#A855F7]/12 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      
      <div className="mt-4 relative z-10">
        <h3 className="text-2xl font-extrabold text-white tracking-tight font-sans">
          {value}
        </h3>
        
        {/* Render children (like ComparisonBadge) or fallback trend badge */}
        {children}
        
        {!children && trend && (
          <span
            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 mt-2 rounded border ${
              isPositive
                ? "text-success bg-success/10 border-success/15"
                : "text-danger bg-danger/10 border-danger/15"
            }`}
          >
            {trend}
          </span>
        )}
        
        {description && (
          <p className="text-[10px] text-[#9CA3AF] font-medium tracking-wide mt-2">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
