import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX } from "react-icons/fi";

import { exportAsPNG } from "../../utils/exportAsPNG";
import SidebarToggle from "../../components/layout/SidebarToggle";
import ExportMenu from "../../components/ui/ExportMenu";

import { useBudgetCenter } from "./hooks/useBudgetCenter";
import BudgetSummaryCard from "./components/BudgetSummaryCard";
import CategoryBudgetGrid from "./components/CategoryBudgetGrid";
import BudgetAlerts from "./components/BudgetAlerts";

export default function BudgetCenter() {
  const navigate = useNavigate();

  const {
    loading,
    budget,
    spent,
    remaining,
    isOverBudget,
    percentUsed,
    categoryBudgets,
    categories,
    recommendations,
    isAddOpen,
    setIsAddOpen,
    isEditOpen,
    setIsEditOpen,
    selectedBudget,
    setSelectedBudget,
    selectedCategory,
    setSelectedCategory,
    limitAmount,
    setLimitAmount,
    editLimitAmount,
    setEditLimitAmount,
    handleCreateBudget,
    handleEditClick,
    handleUpdateLimit,
    handleDeleteClick,
  } = useBudgetCenter();

  const exportOptions = [
    {
      label: "Export Monthly Budget Summary",
      onClick: () =>
        exportAsPNG(
          "monthly-budget-summary-wrapper",
          "monthly_budget_summary"
        ),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center font-sans">
        <div className="text-sm text-[#6B7280] font-bold uppercase tracking-widest animate-pulse">
          Loading Budget Center...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 select-none max-w-[1440px] mx-auto pb-16 relative">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <SidebarToggle />

            <h1 className="text-[32px] font-bold tracking-tight text-textPrimary font-heading">
              Budgets
            </h1>
          </div>

          <p className="text-sm text-textSecondary font-medium">
            Plan, monitor, and adjust your monthly spending allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportMenu options={exportOptions} />

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primaryHover text-white h-11 px-5 rounded-[14px] font-bold shadow-sm transition-all text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <FiPlus className="h-4 w-4" />
            Set Budget Limit
          </button>
        </div>
      </div>

      {/* Monthly Budget Summary */}
      <BudgetSummaryCard
        budget={budget}
        spent={spent}
        remaining={remaining}
        isOverBudget={isOverBudget}
        percentUsed={percentUsed}
      />

      {/* Category Budgets */}
      <div className="space-y-4">

        <h3 className="text-[20px] font-bold text-[#111827] tracking-tight font-heading">
          Category Budgets
        </h3>

        <CategoryBudgetGrid
          categoryBudgets={categoryBudgets}
          categories={categories}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onAddNew={() => setIsAddOpen(true)}
        />
      </div>

      {/* Budget Alerts */}
      <BudgetAlerts recommendations={recommendations} />

      {/* Add Expense Button */}
      <div className="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-3.5 bg-primary hover:bg-primaryHover text-white font-bold rounded-full shadow-md transition-all duration-200 cursor-pointer"
        >
          <FiPlus className="h-5 w-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Add Category Budget Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-default rounded-dialog p-6 w-full max-w-md relative z-10 shadow-md space-y-5"
            >
              <div className="flex justify-between items-center">

                <h3 className="text-lg font-bold text-[#111827]">
                  Set Category Budget
                </h3>

                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>

              </div>

              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    Category Name
                  </label>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#F1F5F9] border border-default rounded-input px-4 py-2.5 text-[#111827] focus:outline-none focus:border-primary transition-colors"
                    required
                  >
                    <option value="" disabled>
                      Select category...
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id || category.name}
                        value={category.name}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                </div>

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    Monthly Limit (₹)
                  </label>

                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    className="w-full bg-[#F1F5F9] border border-default rounded-input px-4 py-2.5 text-[#111827] focus:outline-none focus:border-primary transition-colors"
                    required
                    min="1"
                  />

                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 bg-transparent hover:bg-[#F1F5F9] text-secondary border border-default rounded-btn py-2.5 font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primaryHover text-white rounded-btn py-2.5 font-semibold text-sm transition-all shadow-sm"
                  >
                    Create Budget
                  </button>

                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Category Budget Modal */}
      <AnimatePresence>
        {isEditOpen && selectedBudget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditOpen(false);
                setSelectedBudget(null);
              }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-default rounded-dialog p-6 w-full max-w-md relative z-10 shadow-md space-y-5"
            >
              <div className="flex justify-between items-center">

                <h3 className="text-lg font-bold text-[#111827]">
                  Edit Budget: {selectedBudget.category}
                </h3>

                <button
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedBudget(null);
                  }}
                  className="text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>

              </div>

              <form onSubmit={handleUpdateLimit} className="space-y-4">
                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    Monthly Limit (₹)
                  </label>

                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={editLimitAmount}
                    onChange={(e) => setEditLimitAmount(e.target.value)}
                    className="w-full bg-[#F1F5F9] border border-default rounded-input px-4 py-2.5 text-[#111827] focus:outline-none focus:border-primary transition-colors"
                    required
                    min="1"
                  />

                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditOpen(false);
                      setSelectedBudget(null);
                    }}
                    className="flex-1 bg-transparent hover:bg-[#F1F5F9] text-secondary border border-default rounded-btn py-2.5 font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primaryHover text-white rounded-btn py-2.5 font-semibold text-sm transition-all shadow-sm"
                  >
                    Update Limit
                  </button>

                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
