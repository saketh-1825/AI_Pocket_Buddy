import { formatCurrency } from "../../../utils/currencyFormat";

export default function DashboardSummaryCard({ totalMonthlyExpense, budget, budgetUsagePercent }) {
  return (
    <div className="bg-surface border border-border rounded-card p-7 shadow-sm">
      <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">
        THIS MONTH SPENT
      </p>

      <p className="text-[38px] lg:text-[40px] font-extrabold text-textPrimary tracking-tight leading-none mt-2 font-sans">
        {formatCurrency(totalMonthlyExpense)}
      </p>

      <p className="text-sm text-textSecondary mt-3 font-medium">
        {budgetUsagePercent}% of {formatCurrency(budget)} Budget Used
      </p>

      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${budgetUsagePercent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-border">
        <div>
          <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">
            Budget Left
          </p>

          <p className="text-[20px] font-bold text-success mt-1.5">
            {formatCurrency(Math.max(0, budget - totalMonthlyExpense))}
          </p>
        </div>

        <div>
          <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">
            Monthly Change
          </p>

          <p className="text-[20px] font-bold text-primary mt-1.5">
            +12%
          </p>
        </div>
      </div>
    </div>
  );
}
