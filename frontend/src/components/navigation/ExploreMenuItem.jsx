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
      whileHover={!isComingSoon ? { x: 4 } : {}}
      onClick={!isComingSoon ? onClick : undefined}
      className={`flex items-center justify-between p-3.5 rounded-xl border border-transparent transition-all duration-300 ${
        isComingSoon 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:bg-[#A855F7]/[0.08] hover:border-[#A855F7]/15 cursor-pointer group"
      }`}
    >
      <div className="flex items-center gap-3.5">
        {/* Icon Container */}
        {Icon && (
          <div className={`p-2.5 rounded-xl ${
            isComingSoon 
              ? "bg-white/[0.02] text-[#9CA3AF]" 
              : "bg-[#A855F7]/10 text-[#A855F7] group-hover:bg-[#A855F7]/20 transition-colors"
          }`}>
            <Icon className="h-4 w-4" />
          </div>
        )}

        {/* Text Container */}
        <div>
          <h5 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            {title}
            {badgeText && (
              <span className={`inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                isComingSoon 
                  ? "bg-white/5 border-white/10 text-[#9CA3AF]" 
                  : "bg-[#A855F7]/12 border-[#A855F7]/20 text-[#A855F7]"
              }`}>
                {badgeText}
              </span>
            )}
          </h5>
          <p className="text-xs text-[#9CA3AF] mt-0.5 font-medium font-sans">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right chevron or open indicator */}
      {!isComingSoon && (
        <FiChevronRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-white transition-colors group-hover:translate-x-0.5 transition-transform" />
      )}
    </motion.div>
  );
}
