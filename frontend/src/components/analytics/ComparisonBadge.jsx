import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

export default function ComparisonBadge({ value, label }) {
  if (value === undefined || value === null) return null;

  const isPositive = value >= 0;
  const absValue = Math.abs(value).toFixed(1);

  return (
    <div className="flex items-center gap-2 select-none">
      <span
        className={`inline-flex items-center gap-1 text-[13px] font-bold px-3.5 py-1.5 rounded-full ${
          isPositive
            ? "text-success bg-green-50/55 border border-success/20"
            : "text-danger bg-red-50/55 border border-danger/20"
        }`}
      >
        {isPositive ? (
          <FiArrowUpRight className="h-4 w-4 shrink-0" />
        ) : (
          <FiArrowDownRight className="h-4 w-4 shrink-0" />
        )}
        {absValue}%
      </span>
      {label && (
        <span className="text-[13px] text-textSubtext font-medium tracking-wide font-sans">
          {label}
        </span>
      )}
    </div>
  );
}

