import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiPlus, 
  FiSearch
} from "react-icons/fi";
import { toast } from "react-toastify";

import AddExpenseModal from "../components/forms/AddExpenseModal";
import EditExpenseModal from "../components/forms/EditExpenseModal";
import DeleteConfirmModal from "../components/ui/DeleteConfirmModal";
import SidebarToggle from "../components/layout/SidebarToggle";
import ExpenseList from "../components/dashboard/ExpenseList";
import { useCategoryStore } from "../store/categoryStore";
import { useExpenseStore } from "../store/expenseStore";
import { getCurrentBudget, getBudgetSummary } from "../services/budgets/budgetService";
import { getAISummary } from "../services/insights/insightsService";
import { getAnalyticsSummary } from "../services/analytics/analyticsService";
import BudgetSetupModal from "../components/budgets/BudgetSetupModal";
import MonthlySpendingChart from "../components/analytics/MonthlySpendingChart";
import ActivityHeatmap from "../components/analytics/ActivityHeatmap";

import { formatCurrency } from "../utils/currencyFormat";


function ExpenseDashboard() {
  const navigate = useNavigate();

  // State
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();
  const [budget, setBudget] = useState(10000);
  const [budgetExists, setBudgetExists] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);

  // Search, Sort, Pagination, View Mode State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeInsightIdx, setActiveInsightIdx] = useState(0);
  const itemsPerPage = 8;

  // Modal Control State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const [userName] = useState(() => {
    return localStorage.getItem("userName") || "Saketh";
  });

  const loadData = async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const [, , budgetData, summaryData, summary, analyticsSum] = await Promise.all([
        useExpenseStore.getState().fetchExpenses(),
        useCategoryStore.getState().fetchCategories(),
        getCurrentBudget(),
        getAISummary(),
        getBudgetSummary(month, year),
        getAnalyticsSummary()
      ]);
      
      const activeBudget = summary.total_budget || (budgetData.exists ? budgetData.monthly_budget : 0);
      setBudget(activeBudget);
      setBudgetExists(activeBudget > 0);
      
      setAiSummary(summaryData);
      setAnalyticsSummary(analyticsSum);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const handleBudgetSetupSuccess = (amount) => {
    setBudget(amount);
    setBudgetExists(true);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSaveExpense = async (formData) => {
    setIsSaving(true);
    try {
      await useExpenseStore.getState().addExpense(formData);
      toast.success("Expense added successfully", { theme: "light" });
      setIsAddOpen(false);
      
      const [summaryData, analyticsSum] = await Promise.all([
        getAISummary(),
        getAnalyticsSummary()
      ]);
      setAiSummary(summaryData);
      setAnalyticsSummary(analyticsSum);
    } catch (error) {
      console.error("Failed to create expense:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (expense) => {
    setSelectedExpense(expense);
    setIsEditOpen(true);
  };

  const handleUpdateExpense = async (id, formData) => {
    setIsUpdating(true);
    try {
      await useExpenseStore.getState().updateExpense(id, formData);
      toast.success("Expense updated successfully", { theme: "light" });
      setIsEditOpen(false);
      setSelectedExpense(null);
      
      const [summaryData, analyticsSum] = await Promise.all([
        getAISummary(),
        getAnalyticsSummary()
      ]);
      setAiSummary(summaryData);
      setAnalyticsSummary(analyticsSum);
    } catch (error) {
      console.error("Failed to update expense:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (id) => {
    const target = expenses.find((e) => e.id === id);
    if (target) {
      setSelectedExpense(target);
      setIsDeleteOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedExpense) return;
    setIsDeleting(true);
    try {
      await useExpenseStore.getState().deleteExpense(selectedExpense.id);
      toast.success("Expense deleted successfully", { theme: "light" });
      setIsDeleteOpen(false);
      setSelectedExpense(null);
      
      const [summaryData, analyticsSum] = await Promise.all([
        getAISummary(),
        getAnalyticsSummary()
      ]);
      setAiSummary(summaryData);
      setAnalyticsSummary(analyticsSum);
    } catch (error) {
      console.error("Failed to delete expense:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalMonthlyExpense = expenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    const term = debouncedSearch.toLowerCase().trim();
    if (!term) return true;
    const titleMatch = (e.title || "").toLowerCase().includes(term);
    const descMatch = (e.description || "").toLowerCase().includes(term);
    const catObj = categories.find(c => c.id === e.category_id);
    const catName = catObj ? catObj.name : "Others";
    const catMatch = catName.toLowerCase().includes(term);
    return titleMatch || descMatch || catMatch;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date) - new Date(a.date);
    }
    if (sortBy === "oldest") {
      return new Date(a.date) - new Date(b.date);
    }
    if (sortBy === "amount-high") {
      return b.amount - a.amount;
    }
    if (sortBy === "amount-low") {
      return a.amount - b.amount;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / itemsPerPage));
  const paginatedExpenses = sortedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getInsightsList = () => {
    if (!aiSummary || !aiSummary.message) return [];
    
    return [
      {
        id: 1,
        title: "AI Analysis",
        text: aiSummary.message,
        actionLabel: aiSummary.overspending_detected ? "Review Budgets" : "View Budgets",
        action: () => navigate("/budgets"),
      }
    ];
  };

  const activeInsights = getInsightsList();
  const currentInsight = activeInsights[activeInsightIdx];

  const handleNextInsight = () => {
    setActiveInsightIdx((prev) => (prev + 1) % activeInsights.length);
  };

  const handlePrevInsight = () => {
    setActiveInsightIdx((prev) => (prev - 1 + activeInsights.length) % activeInsights.length);
  };

  const budgetUsagePercent = budget > 0 ? Math.min(100, Math.round((totalMonthlyExpense / budget) * 100)) : 0;

  return (
    <div className="p-8 md:p-8 space-y-8 select-none font-sans max-w-[1440px] mx-auto pb-16 relative">
      
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <h1 className="text-[32px] font-bold tracking-tight text-textPrimary font-heading">
            {getGreeting()}, {userName}
          </h1>
        </div>
        <p className="text-sm font-medium text-textSecondary">
          Here's your financial overview
        </p>
      </div>

      {/* Grid Layout: Hero Card & AI Insights Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* HERO CARD */}
        <div className="bg-surface border border-border rounded-card p-7 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all duration-150">
          <div>
            <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">THIS MONTH SPENT</p>
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
          </div>
          
          <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">Budget Left</p>
              <p className="text-[20px] font-bold text-success mt-1.5">
                {formatCurrency(Math.max(0, budget - totalMonthlyExpense))}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">Monthly Change</p>
              <p className="text-[20px] font-bold text-primary mt-1.5">
                +12%
              </p>
            </div>
          </div>
        </div>

        {/* AI INSIGHTS CAROUSEL */}
        <div className="bg-surface border border-border rounded-card p-7 shadow-sm flex flex-col justify-between min-h-[220px] hover:scale-[1.01] transition-all duration-150">
          <div>
            <div className="flex justify-between items-center pb-2.5 border-b border-border mb-4">
              <span className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">
                {currentInsight ? currentInsight.title : "AI Insight"}
              </span>
              <span className="text-xs font-semibold text-textSecondary">
                {activeInsights.length > 0 ? `${activeInsightIdx + 1} of ${activeInsights.length}` : "0 of 0"}
              </span>
            </div>

            {currentInsight ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-textPrimary leading-relaxed">
                  {currentInsight.text}
                </p>
                {currentInsight.action && (
                  <button
                    onClick={currentInsight.action}
                    className="h-10 px-4 rounded-xl bg-primary hover:bg-primaryHover text-white text-xs font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {currentInsight.actionLabel}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-textSecondary italic">
                Gathering financial analytics for insights...
              </p>
            )}
          </div>

          {activeInsights.length > 1 && (
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border justify-end">
              <button 
                onClick={handlePrevInsight} 
                className="text-xs font-bold text-textSecondary hover:text-textPrimary cursor-pointer focus:outline-none"
              >
                &lt; Previous
              </button>
              <button 
                onClick={handleNextInsight} 
                className="text-xs font-bold text-textSecondary hover:text-textPrimary cursor-pointer focus:outline-none"
              >
                Next &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Spending Chart + Activity Heatmap Row */}
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
        {/* Monthly Spending Chart — 68% on Desktop, 60% on Tablet */}
        <div className="w-full md:w-[60%] lg:w-[68%] bg-surface border border-border rounded-card p-7 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">Monthly Spending</h3>
            <p className="text-xs text-textSecondary mt-2 font-medium">Spending overview across the last 6 months</p>
          </div>
          <div className="flex-1 min-h-[320px]">
            {analyticsSummary?.monthly_summary && analyticsSummary.monthly_summary.length > 0 ? (
              <MonthlySpendingChart data={analyticsSummary.monthly_summary} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-textSecondary">No spending data found.</div>
            )}
          </div>
        </div>

        {/* Activity Card — 32% on Desktop, 40% on Tablet */}
        <div className="w-full md:w-[40%] lg:w-[32%] bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm flex flex-col pt-[28px] px-[28px] pb-[24px]">
          <div>
            <h3 className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider leading-none">Activity</h3>
            <p className="text-xs text-textSecondary mt-[6px] font-medium leading-none">Last 60 days</p>
          </div>
          <div className="mt-[24px] flex-1 flex items-center justify-center">
            <ActivityHeatmap expenses={expenses} />
          </div>
        </div>
      </div>

      {/* Search / Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface border border-border rounded-card p-7 shadow-sm">
        <h3 className="text-[20px] font-bold text-textPrimary font-heading">Recent Transactions</h3>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative w-full md:w-60">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
            <input
              type="text"
              placeholder="Search merchant, category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface border border-border focus:border-primary rounded-xl pl-9 pr-4 py-2 text-[14px] text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans transition-all duration-150"
            />
          </div>
          
          {/* Dropdown sort selector */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-border focus:border-primary rounded-xl px-4 py-2 text-[14px] text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-sans transition-all duration-150"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Amount: High to Low</option>
            <option value="amount-low">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {/* CARD-BASED TRANSACTIONS LIST */}
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
          /* Professional Empty State Representation */
          <div className="bg-surface border border-border rounded-card p-8 text-center max-w-sm mx-auto shadow-sm space-y-4 my-8 select-none">
            <div className="mx-auto w-16 h-16 rounded-full bg-background flex items-center justify-center border border-border">
              <svg className="w-8 h-8 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-md font-bold text-textPrimary">No expenses yet</h4>
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="h-9 px-4 bg-surface border border-border hover:bg-hoverAccent text-textSecondary rounded-xl text-xs font-bold disabled:opacity-30 disabled:hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          >
            Prev
          </button>
          <span className="text-xs text-textSecondary font-bold font-sans">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="h-9 px-4 bg-surface border border-border hover:bg-hoverAccent text-textSecondary rounded-xl text-xs font-bold disabled:opacity-30 disabled:hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Floating Add Expense Sticky Button */}
      <div className="fixed bottom-6 right-6 z-40">
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

export default ExpenseDashboard;
