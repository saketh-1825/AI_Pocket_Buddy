import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { getCategoryIcon } from "../../../constants/categories";
import { formatCurrency } from "../../../utils/currencyFormat";

export default function CategoryBudgetCard({ budgetItem, onEdit, onDelete }) {
  const iconKey = budgetItem.icon_key || "others";
  const isOver = budgetItem.progress_percentage > 100;

  let statusLabel = "SAFE";

  if (isOver) {
    statusLabel = "OVER";
  } else if (budgetItem.progress_percentage > 80) {
    statusLabel = "WARNING";
  }

  const IconComponent = getCategoryIcon(iconKey);

  return (
    <div
      className="bg-surface border border-border rounded-card p-7 shadow-sm relative flex flex-col justify-between min-h-[170px] transition-all duration-150 hover:scale-[1.01]"
    >
      <div className="space-y-4">

        {/* Category Header */}
        <div className="flex justify-between items-center">

          <div className="flex items-center gap-2.5 text-sm font-bold text-textPrimary uppercase tracking-wider font-sans">
            <IconComponent className="h-4.5 w-4.5 text-textSecondary" />
            <span>{budgetItem.category}</span>
          </div>

          <div className="flex items-center gap-1.5">

            <button
              onClick={() => onEdit(budgetItem)}
              className="p-1.5 rounded-lg bg-background border border-border text-textSecondary hover:text-textPrimary hover:bg-hoverAccent transition-colors cursor-pointer focus:outline-none"
              title="Edit Limit"
            >
              <FiEdit2 className="h-3 w-3" />
            </button>

            <button
              onClick={() => onDelete(budgetItem)}
              className="p-1.5 rounded-lg bg-background border border-border text-textSecondary hover:text-danger hover:bg-hoverAccent transition-colors cursor-pointer focus:outline-none"
              title="Delete Limit"
            >
              <FiTrash2 className="h-3 w-3" />
            </button>

          </div>
        </div>

        {/* Spent / Limit */}
        <div className="flex justify-between items-baseline font-sans">

          <p className="text-xs font-semibold text-textSecondary">
            Spent{" "}
            <span className="text-textPrimary font-extrabold">
              {formatCurrency(budgetItem.spent_amount)}
            </span>
          </p>

          <p className="text-xs text-textSecondary">
            Limit{" "}
            {formatCurrency(budgetItem.limit_amount)}
          </p>

        </div>

        {/* Progress */}
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, budgetItem.progress_percentage)}%`,
              backgroundColor: isOver
                ? "#DC2626"
                : budgetItem.progress_percentage > 80
                  ? "#D97706"
                  : "#16A34A",
            }}
          />
        </div>

        {/* Status */}
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider font-sans">

          <span
            style={{
              color: isOver
                ? "#DC2626"
                : budgetItem.progress_percentage > 80
                  ? "#D97706"
                  : "#16A34A",
            }}
          >
            {Math.round(budgetItem.progress_percentage)}% used
          </span>

          <span
            className={`px-2 py-0.5 rounded-full border ${isOver
                ? "bg-danger/5 text-danger border-danger/15"
                : budgetItem.progress_percentage > 80
                  ? "bg-warning/5 text-warning border-warning/15"
                  : "bg-success/5 text-success border-success/15"
              }`}
          >
            {statusLabel}
          </span>

        </div>
      </div>
    </div>
  );
}
