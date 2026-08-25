import { formatCurrency } from "../../../utils/currencyFormat";

export default function BudgetSummaryCard({ budget, spent, remaining, isOverBudget, percentUsed }) {
  return (
    <div
      className="bg-surface border border-border rounded-card p-7 shadow-sm"
      id="monthly-budget-summary-wrapper"
    >
      <div className="space-y-5">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

          <div>
            <span className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">
              Monthly Budget
            </span>

            <h2 className="text-[38px] lg:text-[40px] font-extrabold text-textPrimary tracking-tight leading-none mt-2 font-sans">
              {formatCurrency(budget)}
            </h2>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${isOverBudget
                  ? "text-danger bg-danger/5 border-danger/15"
                  : "text-success bg-success/5 border-success/15"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOverBudget
                    ? "bg-danger"
                    : "bg-success"
                  }`}
              />

              {isOverBudget
                ? "Over Budget"
                : "Safe Spending Zone"}
            </span>
          </div>
        </div>

        {/* Spent / Remaining */}
        <div className="flex gap-8 pt-2">

          <div>
            <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">
              Spent
            </p>

            <p className="text-textPrimary font-extrabold text-xl mt-1.5 font-sans">
              {formatCurrency(spent)}
            </p>
          </div>

          <div className="border-l border-border pl-8">
            <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">
              Remaining
            </p>

            <p
              className={`${isOverBudget
                  ? "text-danger"
                  : "text-success"
                } font-extrabold text-xl mt-1.5 font-sans`}
            >
              {formatCurrency(remaining)}
            </p>
          </div>

        </div>

        {/* Progress Bar */}
        <div className="space-y-2">

          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{
                width: `${percentUsed}%`,
              }}
            />
          </div>

          <div className="text-[13px] text-textSecondary font-sans">
            {percentUsed}% of total monthly budget utilized
          </div>

        </div>
      </div>
    </div>
  );
}
