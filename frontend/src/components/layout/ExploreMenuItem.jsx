import { motion } from "framer-motion";
import { FiChevronRight } from "react-icons/fi";

export default function ExploreMenuItem({ 
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

