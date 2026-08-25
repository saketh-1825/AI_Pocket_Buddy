import CategoryBudgetCard from "./CategoryBudgetCard";

export default function CategoryBudgetGrid({ categoryBudgets, categories, onEdit, onDelete, onAddNew }) {
  if (categoryBudgets.length === 0) {
    return (
      /* Empty State */
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center max-w-sm mx-auto shadow-soft space-y-4 my-8 select-none">

        <div className="mx-auto w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center border border-[#E2E8F0]">
          <svg
            className="w-8 h-8 text-[#6B7280]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>

        <div className="space-y-1">
          <h4 className="text-md font-bold text-[#111827]">
            No budgets created
          </h4>

          <p className="text-xs text-[#6B7280] leading-relaxed">
            Set spending limits to stay on track.
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-colors"
        >
          Create Budget
        </button>

      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      {categoryBudgets.map((budgetItem) => {
        // Resolve icon_key from the categories list
        const category = categories.find(
          (item) =>
            item.name.toLowerCase() ===
            budgetItem.category.toLowerCase()
        );

        const enrichedItem = {
          ...budgetItem,
          icon_key: category ? category.icon_key : "others",
        };

        return (
          <CategoryBudgetCard
            key={budgetItem.id}
            budgetItem={enrichedItem}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}

    </div>
  );
}
