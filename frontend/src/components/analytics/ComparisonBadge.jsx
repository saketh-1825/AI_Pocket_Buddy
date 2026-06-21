import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

export default function ComparisonBadge({ value, label }) {
  if (value === undefined || value === null) return null;

  const isPositive = value >= 0;
  const absValue = Math.abs(value).toFixed(1);

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isPositive
            ? "text-success bg-success/10 border-success/20"
            : "text-danger bg-danger/10 border-danger/20"
        }`}
      >
        {isPositive ? (
          <FiArrowUpRight className="h-3 w-3 inline" />
        ) : (
          <FiArrowDownRight className="h-3 w-3 inline" />
        )}
        {absValue}%
      </span>
      {label && (
        <span className="text-[10px] text-[#9CA3AF] font-medium tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
}
