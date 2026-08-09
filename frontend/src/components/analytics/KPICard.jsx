import React from "react";
import { motion } from "framer-motion";
import { Caption, KPIMetric, CategoryMetric, SecondaryMetric } from "../ui/Typography";
import { FiCreditCard, FiActivity, FiTag, FiTrendingUp, FiCheckCircle } from "react-icons/fi";

const getKPIIcon = (title) => {
  const t = (title || "").toLowerCase();
  if (t.includes("spend")) return FiCreditCard;
  if (t.includes("daily") || t.includes("average")) return FiActivity;
  if (t.includes("category")) return FiTag;
  if (t.includes("savings") || t.includes("budget")) return FiTrendingUp;
  return FiCheckCircle;
};

export default function KPICard({ 
  title, 
  value, 
  trend, 
  trendType, 
  description, 
  children, 
  delay = 0,
  className = ""
}) {
  const isPositive = trendType === "positive";
  
  // Clean text from title (e.g. "💳 TOTAL SPEND")
  let labelText = title || "";
  const firstSpaceIndex = labelText.indexOf(" ");
  if (firstSpaceIndex !== -1) {
    const possibleEmoji = labelText.substring(0, firstSpaceIndex);
    // If it's a known emoji, extract it
    if (possibleEmoji.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83D[\uDE00-\uDE4F]/) || possibleEmoji.length <= 2) {
      labelText = labelText.substring(firstSpaceIndex + 1);
    }
  }

  const isTopCategory = title && title.includes("TOP CATEGORY");
  const IconComponent = getKPIIcon(title);

  const renderValue = () => {
    if (isTopCategory) {
      return (
        <CategoryMetric className="block truncate select-none">
          {value}
        </CategoryMetric>
      );
    }
    if (typeof value === "string") {
      const match = value.match(/^(₹\s*[\d,]+)(\.\d+)$/);
      if (match) {
        return (
          <KPIMetric className="inline-block align-baseline select-none">
            {match[1]}
            <span className="text-[20px] font-bold align-super ml-0.5">
              {match[2]}
            </span>
          </KPIMetric>
        );
      }
    }
    return (
      <KPIMetric className="inline-block align-baseline select-none">
        {value}
      </KPIMetric>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: "easeInOut" }}
      whileHover={{ scale: 1.01 }}
      className={`bg-surface border border-border rounded-card p-7 shadow-sm flex flex-col select-none relative group transition-all duration-150 ${className}`}
    >
      {/* 1. HEADER ROW */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="w-10 h-10 flex items-center justify-center bg-background border border-border rounded-xl text-textSecondary shrink-0">
          <IconComponent className="h-5 w-5" />
        </div>
        <Caption className="text-textSecondary font-bold tracking-wider uppercase">
          {labelText}
        </Caption>
      </div>

      {/* 2. VALUE & SUPPORTING SECTION */}
      <div className="mt-5 flex flex-col justify-start">
        {renderValue()}
        
        {/* 3. SUPPORTING INFORMATION ROW */}
        {(children || trend || description) && (
          <div className="mt-3 flex flex-col gap-1">
            {description && (
              <SecondaryMetric className="text-sm font-semibold text-textSecondary block">
                {description}
              </SecondaryMetric>
            )}
            {(children || trend) && (
              <div className="flex items-center gap-2 shrink-0">
                {children ? (
                  children
                ) : (
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      isPositive
                        ? "text-success bg-[#DCFCE7]/60 border-[#DCFCE7]"
                        : "text-danger bg-[#FEE2E2]/60 border-[#FEE2E2]"
                    }`}
                  >
                    {trend}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
