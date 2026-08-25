export default function EmptyState({ setIsAddOpen }) {
  return (
    <div className="bg-surface border border-border rounded-card p-8 text-center max-w-sm mx-auto shadow-sm space-y-4 my-8 select-none">
      <div className="mx-auto w-16 h-16 rounded-full bg-background flex items-center justify-center border border-border">
        <svg
          className="w-8 h-8 text-textSecondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>

      <div className="space-y-1">
        <h4 className="text-md font-bold text-textPrimary">
          No expenses yet
        </h4>
        <p className="text-xs text-textSecondary leading-relaxed">
          Start tracking your money by adding your first expense.
        </p>
      </div>

      <button
        onClick={() => setIsAddOpen(true)}
        className="h-11 px-5 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-[14px] shadow-sm cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        Add Expense
      </button>
    </div>
  );
}
