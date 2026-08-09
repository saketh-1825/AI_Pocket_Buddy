/**
 * Custom Tooltip for Recharts charts.
 * Styled with bg-white background, 1px solid border, and 12px border radius.
 */

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function CustomTooltip({ active, payload, type = "monthly" }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    if (type === "monthly") {
      return (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-lg select-none pointer-events-none">
          <p className="text-[10px] font-extrabold text-[#64748B] mb-1 uppercase tracking-wider">
            {data.month_name} {data.year}
          </p>
          <div className="space-y-0.5">
            <p className="text-base font-extrabold text-[#0F172A]">
              {formatCurrency(data.total_spent)}
            </p>
            <p className="text-xs text-[#64748B] font-medium">
              {data.expense_count} Expense{data.expense_count === 1 ? "" : "s"}
            </p>
            <p className="text-[11px] text-[#4F46E5] font-bold">
              Average {formatCurrency(data.average_expense)}
            </p>
          </div>
        </div>
      );
    }
    
    if (type === "category") {
      return (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-lg select-none pointer-events-none">
          <p className="text-[10px] font-extrabold text-[#64748B] mb-1 uppercase tracking-wider">
            {data.category}
          </p>
          <div className="space-y-0.5">
            <p className="text-base font-extrabold text-[#0F172A]">
              {formatCurrency(data.total)}
            </p>
            <p className="text-[11px] text-[#4F46E5] font-bold">
              {data.percentage}% of overall spend
            </p>
          </div>
        </div>
      );
    }
  }
  
  return null;
}

