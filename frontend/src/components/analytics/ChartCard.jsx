import { motion } from "react";
import { Caption } from "../ui/Typography";

/**
 * ChartCard wrapper for analytical charts and content blocks.
 * Styled with surface background, rounded-card (20px) border-radius, and p-7 padding.
 */
export default function ChartCard({ title, subtitle, children, extra, className = "" }) {
  return (
    <div
      className={`bg-surface border border-border rounded-card p-7 shadow-sm transition-all duration-150 ${className}`}
    >
      {(title || subtitle || extra) && (
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            {title && (
              <Caption className="text-textSecondary font-bold tracking-wider uppercase block">
                {title}
              </Caption>
            )}
            {subtitle && (
              <p className="text-xs text-textSecondary mt-2 font-medium font-sans">
                {subtitle}
              </p>
            )}
          </div>
          {extra && <div className="shrink-0">{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
