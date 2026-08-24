import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiX,
  FiDownload,
  FiChevronDown
} from "react-icons/fi";
import { toast } from "react-toastify";

import { 
  getCategoryBudgets, 
  createCategoryBudget, 
  updateCategoryBudget, 
  deleteCategoryBudget, 
  getBudgetSummary
} from "../services/budgets/budgetService";
import { getCategories } from "../services/api/categories";
import { getBudgetVsActual } from "../services/insights/insightsService";
import { getCategoryIcon } from "../constants/categories";
import BudgetVsActualChart from "../components/analytics/BudgetVsActualChart";
import { exportAsPNG } from "../utils/exportAsPNG";
import SidebarToggle from "../components/layout/SidebarToggle";
import ExportMenu from "../components/ui/ExportMenu";
import { formatCurrency } from "../utils/currencyFormat";

export default function BudgetCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(0);
  const [spent, setSpent] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetVsActualData, setBudgetVsActualData] = useState(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  
  // Form input states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [editLimitAmount, setEditLimitAmount] = useState("");

  const loadBudgetData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [cats, catBudgets, summary, budgetVsActual] = await Promise.all([
        getCategories(),
        getCategoryBudgets(month, year),
        getBudgetSummary(month, year),
        getBudgetVsActual()
      ]);

      setCategories(cats);
      setCategoryBudgets(catBudgets);
      setBudgetVsActualData(budgetVsActual);
      
      setBudget(summary.total_budget || 0);
      setSpent(summary.total_spent || 0);
    } catch (err) {
      console.error("Failed to load budget data:", err);
      toast.error("Error loading budget data", { theme: "light" });
    } finally {
      setLoading(false);
    }
  };

  const refreshBudgetVsActual = async () => {
    try {
      const budgetVsActual = await getBudgetVsActual();
      setBudgetVsActualData(budgetVsActual);
    } catch (err) {
      console.error("Failed to refresh budget vs actual:", err);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, []);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      toast.error("Please select a category", { theme: "light" });
      return;
    }
    const limit = parseFloat(limitAmount);
    if (isNaN(limit) || limit <= 0) {
      toast.error("Please enter a valid limit amount", { theme: "light" });
      return;
    }

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      await createCategoryBudget(selectedCategory, limit, month, year);
      toast.success("Category budget set successfully!", { theme: "light" });
      setIsAddOpen(false);
      setSelectedCategory("");
      setLimitAmount("");
      await loadBudgetData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to set category budget.", { theme: "light" });
    }
  };

  const handleEditClick = (budgetObj) => {
    setSelectedBudget(budgetObj);
    setEditLimitAmount(budgetObj.limit_amount.toString());
    setIsEditOpen(true);
  };

  const handleUpdateLimit = async (e) => {
    e.preventDefault();
    if (!selectedBudget) return;
    const limit = parseFloat(editLimitAmount);
    if (isNaN(limit) || limit <= 0) {
      toast.error("Please enter a valid limit amount", { theme: "light" });
      return;
    }

    try {
      await updateCategoryBudget(selectedBudget.id, limit);
      toast.success("Budget limit updated successfully!", { theme: "light" });
      setIsEditOpen(false);
      setSelectedBudget(null);
      setEditLimitAmount("");
      await loadBudgetData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update category budget.", { theme: "light" });
    }
  };

  const handleDeleteClick = async (budgetObj) => {
    if (!window.confirm(`Remove monthly budget for ${budgetObj.category}?`)) {
      return;
    }
    try {
      await deleteCategoryBudget(budgetObj.id);
      toast.success(`Removed budget for ${budgetObj.category}`, { theme: "light" });
      await loadBudgetData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove category budget.", { theme: "light" });
    }
  };

  const isOverBudget = spent > budget;
  const remaining = Math.max(0, budget - spent);
  const percentUsed = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const getRecommendations = () => {
    const recommendations = [];
    const items = categoryBudgets || [];
    
    let overspentCategories = items.filter(item => item.status === "OVER BUDGET");
    let warningCategories = items.filter(item => item.status === "WARNING" || item.status === "ALMOST EXCEEDED");
    
    if (overspentCategories.length > 0) {
      overspentCategories.forEach(item => {
        recommendations.push({
          type: "danger",
          category: item.category,
          text: `You spent ${formatCurrency(item.spent_amount)} on ${item.category}, exceeding your limit of ${formatCurrency(item.limit_amount)}. Freeze non-essential purchases immediately.`
        });
      });
    }
    
    if (warningCategories.length > 0) {
      warningCategories.forEach(item => {
        recommendations.push({
          type: "warning",
          category: item.category,
          text: `You spent ${formatCurrency(item.spent_amount)} on ${item.category}, utilizing ${Math.round(item.progress_percentage)}% of your limit. Keep an eye on new transactions.`
        });
      });
    }
    
    if (budget > 0) {
      if (!isOverBudget) {
        recommendations.push({
          type: "success",
          category: "Savings Goal",
          text: `Great job! You have a buffer of ${formatCurrency(remaining)} remaining. Putting this into savings will grow your monthly backup reserve.`
        });
      } else {
        recommendations.push({
          type: "danger",
          category: "Savings Goal",
          text: `You have exceeded your total limit by ${formatCurrency(spent - budget)}. Try to freeze shopping or entertainment categories to restore balance.`
        });
      }
    } else {
      recommendations.push({
        type: "setup",
        category: "System Recommendation",
        text: "Please set a monthly budget on the dashboard page or category budgets below to begin receiving insights."
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  const exportOptions = [
    { label: "Export Budget Report", onClick: () => exportAsPNG("budget-vs-actual-wrapper", "budget_vs_actual") },
    { label: "Export Monthly Budget Summary", onClick: () => exportAsPNG("monthly-budget-summary-wrapper", "monthly_budget_summary") }
  ];

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

      {/* DOMINANT HERO MONTHLY BUDGET CARD */}
      <div className="bg-surface border border-border rounded-card p-7 shadow-sm" id="monthly-budget-summary-wrapper">
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
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                isOverBudget
                  ? "text-danger bg-danger/5 border-danger/15"
                  : "text-success bg-success/5 border-success/15"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOverBudget ? "bg-danger" : "bg-success"}`} />
                {isOverBudget ? "Over Budget" : "Safe Spending Zone"}
              </span>
            </div>
          </div>

          <div className="flex gap-8 pt-2">
            <div>
              <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">Spent</p>
              <p className="text-textPrimary font-extrabold text-xl mt-1.5 font-sans">{formatCurrency(spent)}</p>
            </div>
            <div className="border-l border-border pl-8">
              <p className="text-[12px] font-semibold text-textSecondary uppercase tracking-wider">Remaining</p>
              <p className={`${isOverBudget ? "text-danger" : "text-success"} font-extrabold text-xl mt-1.5 font-sans`}>{formatCurrency(remaining)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <div className="text-[13px] text-textSecondary font-sans">
              {percentUsed}% of total monthly budget utilized
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY BUDGETS GRID */}
      <div className="space-y-4">
        <h3 className="text-[20px] font-bold text-[#111827] tracking-tight font-heading">Category Budgets</h3>
        
        {categoryBudgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryBudgets.map((b) => {
              const catObj = categories.find(
                (c) => c.name.toLowerCase() === b.category.toLowerCase()
              );
              const catIconKey = catObj ? catObj.icon_key : "others";
              const isOver = b.progress_percentage > 100;
              
              // Status Pill configuration
              let statusLabel = "SAFE";
              if (isOver) {
                statusLabel = "OVER";
              } else if (b.progress_percentage > 80) {
                statusLabel = "WARNING";
              }

              const IconComponent = getCategoryIcon(catIconKey);

              return (
                <div
                  key={b.id}
                  className="bg-surface border border-border rounded-card p-7 shadow-sm relative flex flex-col justify-between min-h-[170px] transition-all duration-150 hover:scale-[1.01]"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 text-sm font-bold text-textPrimary uppercase tracking-wider font-sans">
                        <IconComponent className="h-4.5 w-4.5 text-textSecondary" />
                        <span>{b.category}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(b)}
                          className="p-1.5 rounded-lg bg-background border border-border text-textSecondary hover:text-textPrimary hover:bg-hoverAccent transition-colors cursor-pointer focus:outline-none"
                          title="Edit Limit"
                        >
                          <FiEdit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(b)}
                          className="p-1.5 rounded-lg bg-background border border-border text-textSecondary hover:text-danger hover:bg-hoverAccent transition-colors cursor-pointer focus:outline-none"
                          title="Delete Limit"
                        >
                          <FiTrash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Spent vs Limit */}
                    <div className="flex justify-between items-baseline font-sans">
                      <p className="text-xs font-semibold text-textSecondary">
                        Spent <span className="text-textPrimary font-extrabold">{formatCurrency(b.spent_amount)}</span>
                      </p>
                      <p className="text-xs text-textSecondary">
                        Limit {formatCurrency(b.limit_amount)}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, b.progress_percentage)}%`, 
                          backgroundColor: isOver ? "#DC2626" : b.progress_percentage > 80 ? "#D97706" : "#16A34A" 
                        }}
                      />
                    </div>

                    {/* Percentage & Status Label */}
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider font-sans">
                      <span style={{ color: isOver ? "#DC2626" : b.progress_percentage > 80 ? "#D97706" : "#16A34A" }}>
                        {Math.round(b.progress_percentage)}% used
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border ${
                        isOver 
                          ? "bg-danger/5 text-danger border-danger/15" 
                          : b.progress_percentage > 80 
                            ? "bg-warning/5 text-warning border-warning/15"
                            : "bg-success/5 text-success border-success/15"
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Professional Empty State Representation */
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center max-w-sm mx-auto shadow-soft space-y-4 my-8 select-none">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center border border-[#E2E8F0]">
              <svg className="w-8 h-8 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-md font-bold text-[#111827]">No budgets created</h4>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Set spending limits to stay on track.
              </p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-colors"
            >
              Create Budget
            </button>
          </div>
        )}
      </div>

      {/* COMPARISON CHART AND BUDGET ACTIVITY */}
      {categoryBudgets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Chart Column (2/3) */}
          <div className="lg:col-span-2 bg-surface border border-default rounded-card p-6 shadow-sm" id="budget-vs-actual-wrapper">
            <div className="mb-6">
              <h3 className="text-[16px] font-bold text-[#111827] tracking-wide uppercase font-heading">Category Budget vs Actual</h3>
              <p className="text-xs text-[#6B7280] mt-1 font-medium">Compare MTD spending against individual category limits.</p>
            </div>
            <BudgetVsActualChart report={budgetVsActualData} onRefresh={refreshBudgetVsActual} />
          </div>

          {/* Alerts & Activity Column (1/3) */}
          <div className="space-y-6">
            {/* Budget Alerts Card */}
            <div className="bg-surface border border-default rounded-card p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#111827] tracking-wide uppercase font-heading">Budget Alerts</h3>
                <p className="text-xs text-[#6B7280] mt-1 font-medium">Active threshold warnings and overspending indicators.</p>
              </div>

              <div className="space-y-3">
                {recommendations.filter(r => r.type === "danger" || r.type === "warning").length > 0 ? (
                  recommendations.filter(r => r.type === "danger" || r.type === "warning").map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl space-y-2 text-xs border ${
                        rec.type === "danger" 
                          ? "bg-red-50 border-red-200 text-red-800" 
                          : "bg-orange-50 border-orange-200 text-orange-800"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold uppercase text-[9px] tracking-wider text-[#4F46E5]">
                          {rec.category}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.type === "danger" ? "bg-[#EF4444]" : "bg-[#F59E0B]"}`} />
                      </div>
                      <p className="font-medium leading-relaxed">
                        {rec.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#6B7280]/60 italic py-2">
                    No budget alerts triggered. You are in the safe spending zone!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Expense Sticky Button redirects to home to add */}
      <div className="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-3.5 bg-primary hover:bg-primaryHover text-white font-bold rounded-full shadow-md transition-all duration-200 cursor-pointer"
        >
          <FiPlus className="h-5 w-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* ADD CATEGORY BUDGET MODAL */}
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
                <h3 className="text-lg font-bold text-[#111827]">Set Category Budget</h3>
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
                    <option value="" disabled>Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
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

      {/* EDIT CATEGORY BUDGET MODAL */}
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
                <h3 className="text-lg font-bold text-[#111827]">Edit Budget: {selectedBudget.category}</h3>
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
