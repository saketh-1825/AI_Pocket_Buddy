import { FiPlus } from "react-icons/fi";

// Components
import AddExpenseModal from "../../components/forms/AddExpenseModal";
import EditExpenseModal from "../../components/forms/EditExpenseModal";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import ExpenseList from "../../components/dashboard/ExpenseList";
import BudgetSetupModal from "../../components/budgets/BudgetSetupModal";

// Sub-components
import DashboardHeader from "./components/DashboardHeader";
import DashboardSummaryCard from "./components/DashboardSummaryCard";
import TransactionToolbar from "./components/TransactionToolbar";
import EmptyState from "./components/EmptyState";
import Pagination from "./components/Pagination";

// Hooks
import { useExpenseDashboard } from "./hooks/useExpenseDashboard";

export default function ExpenseDashboard() {
  const {
    categories,
    budget,
    budgetExists,
    isSaving,
    isUpdating,
    isDeleting,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    isAddOpen,
    setIsAddOpen,
    isEditOpen,
    setIsEditOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedExpense,
    setSelectedExpense,
    userName,
    totalMonthlyExpense,
    budgetUsagePercent,
    paginatedExpenses,
    totalPages,
    getGreeting,
    handleSaveExpense,
    handleEditClick,
    handleUpdateExpense,
    handleDeleteClick,
    handleConfirmDelete,
    handleBudgetSetupSuccess,
  } = useExpenseDashboard();

  return (
    <div className="p-8 md:p-8 space-y-8 select-none font-sans max-w-[1440px] mx-auto pb-16 relative">
      <DashboardHeader greeting={getGreeting()} userName={userName} />

      <DashboardSummaryCard
        totalMonthlyExpense={totalMonthlyExpense}
        budget={budget}
        budgetUsagePercent={budgetUsagePercent}
      />

      <TransactionToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        setCurrentPage={setCurrentPage}
      />

      <div className="space-y-4">
        {paginatedExpenses.length > 0 ? (
          <ExpenseList
            expenses={paginatedExpenses}
            categories={categories}
            viewMode="table"
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        ) : (
          <EmptyState setIsAddOpen={setIsAddOpen} />
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

      {/* Add Expense Button */}
      <div className="fixed bottom-24 right-6 z-40 lg:bottom-8 lg:right-8">
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-primary hover:bg-primaryHover text-white font-bold rounded-full shadow-md transition-all duration-200 cursor-pointer"
        >
          <FiPlus className="h-5 w-5" />
          <span>Add Expense</span>
        </button>
      </div>

      <AddExpenseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveExpense}
        isSaving={isSaving}
      />

      <EditExpenseModal
        key={selectedExpense?.id || "none"}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedExpense(null);
        }}
        onUpdate={handleUpdateExpense}
        expense={selectedExpense}
        isUpdating={isUpdating}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <BudgetSetupModal
        isOpen={budgetExists === false}
        onSetupSuccess={handleBudgetSetupSuccess}
      />
    </div>
  );
}
