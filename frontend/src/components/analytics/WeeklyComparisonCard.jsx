import { FiArrowUpRight, FiArrowDownRight, FiMinus } from "react-icons/fi";

export default function WeeklyComparisonCard({ data }) {
  if (!data) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center justify-center min-h-[140px] text-sm text-[#64748B] shadow-sm">
        No weekly comparison data.
      </div>
    );
  }

  const { this_week, last_week, percentage_change, difference, trend } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Determine trend text and colors based on financial impact:
  // Spending more (trend == "up") -> Red (Danger)
  // Spending less (trend == "down") -> Green (Success)
  // No change (trend == "stable") -> Gray (Secondary)
  const isUp = trend === "up";
  const isDown = trend === "down";
  
  const getTrendColor = () => {
    if (isUp) return "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20";
    if (isDown) return "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20";
    return "text-[#64748B] bg-slate-50 border-slate-200";
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col justify-between h-full min-h-[160px] shadow-sm">
      {/* Title */}
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
          This Week vs Last Week
        </p>
        <div className="flex items-baseline justify-between gap-4 mt-2">
          <h3 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {formatCurrency(this_week)}
          </h3>
          
          {/* Badge */}
          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border tracking-wide uppercase ${getTrendColor()}`}>
            {isUp && <FiArrowUpRight className="h-3 w-3" />}
            {isDown && <FiArrowDownRight className="h-3 w-3" />}
            {!isUp && !isDown && <FiMinus className="h-3 w-3" />}
            {Math.abs(percentage_change).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold text-[#64748B]">
        <span>Last Week: <strong className="text-[#0F172A] font-extrabold">{formatCurrency(last_week)}</strong></span>
        <span>
          {isUp && <span className="text-[#EF4444] font-bold">{formatCurrency(Math.abs(difference))} more</span>}
          {isDown && <span className="text-[#22C55E] font-bold">{formatCurrency(Math.abs(difference))} less</span>}
          {!isUp && !isDown && <span>No difference</span>}
          {" than last week"}
        </span>
      </div>
    </div>
  );
}

