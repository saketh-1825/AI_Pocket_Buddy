import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPlus, 
  FiLogOut, 
  FiInbox, 
  FiDollarSign, 
  FiSearch, 
  FiGrid, 
  FiChevronLeft, 
  FiChevronRight, 
  FiDownload, 
  FiX, 
  FiZap,
  FiCoffee,
  FiCompass,
  FiShoppingBag,
  FiTv,
  FiActivity,
  FiFolder
} from "react-icons/fi";
import { toast } from "react-toastify";
import Papa from "papaparse";

import ExpenseList from "../components/ExpenseList";
import AddExpenseModal from "../components/AddExpenseModal";
import EditExpenseModal from "../components/EditExpenseModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import ExpenseSkeleton from "../components/ExpenseSkeleton";
import AIBuddyCard from "../components/AIBuddyCard";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../api/expenses";
import { getCategories } from "../api/categories";
import { getCurrentBudget, updateCurrentBudget } from "../api/budget";
import { parseExpenseText } from "../utils/quickAddParser";
import BudgetSetupModal from "../components/BudgetSetupModal";

// Currency Formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

function ExpenseDashboard() {
  const navigate = useNavigate();
  
  // State
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budget, setBudget] = useState(3000);
  const [budgetExists, setBudgetExists] = useState(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetVal, setNewBudgetVal] = useState("3000");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search, Sort, Pagination, View Mode State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table"); // "timeline" or "table"
  const [hideAIBuddy, setHideAIBuddy] = useState(false);
  const itemsPerPage = 10;

  // Modal Control State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Floating Quick Add State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState("");
  const [quickAddFields, setQuickAddFields] = useState({
    amount: "",
    category: "Others",
    description: "",
  });
  const [isQuickAddSaving, setIsQuickAddSaving] = useState(false);

  // User Greeting Info
  const [userName] = useState(() => {
    const savedName = localStorage.getItem("userName");
    return savedName || "User";
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [expData, catData, budgetData] = await Promise.all([
        getExpenses(),
        getCategories(),
        getCurrentBudget()
      ]);
      const sortedData = [...expData].sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(sortedData);
      setCategories(catData);
      setBudget(budgetData.exists ? budgetData.monthly_budget : 0);
      setNewBudgetVal(budgetData.exists ? budgetData.monthly_budget.toString() : "");
      setBudgetExists(budgetData.exists);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBudgetSetupSuccess = (amount) => {
    setBudget(amount);
    setNewBudgetVal(amount.toString());
    setBudgetExists(true);
  };

  // Load dashboard data on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Debounce search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    toast.info("Logged out successfully", { theme: "dark" });
    navigate("/");
  };

  // Handlers for Add Expense
  const handleSaveExpense = async (formData) => {
    setIsSaving(true);
    try {
      await createExpense(formData);
      toast.success("Expense added successfully", { theme: "dark" });
      setIsAddOpen(false);
      await loadData();
    } catch (error) {
      console.error("Failed to create expense:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers for Edit Expense
  const handleEditClick = (expense) => {
    setSelectedExpense(expense);
    setIsEditOpen(true);
  };

  const handleUpdateExpense = async (id, formData) => {
    setIsUpdating(true);
    try {
      await updateExpense(id, formData);
      toast.success("Expense updated successfully", { theme: "dark" });
      setIsEditOpen(false);
      setSelectedExpense(null);
      await loadData();
    } catch (error) {
      console.error("Failed to update expense:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handlers for Delete Expense
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
      await deleteExpense(selectedExpense.id);
      toast.success("Expense deleted successfully", { theme: "dark" });
      setIsDeleteOpen(false);
      setSelectedExpense(null);
      await loadData();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler for Budget Updates
  const handleUpdateBudget = async (amount) => {
    try {
      const updated = await updateCurrentBudget(amount);
      setBudget(updated.monthly_budget);
      setNewBudgetVal(updated.monthly_budget.toString());
      toast.success("Budget updated successfully", { theme: "dark" });
    } catch (error) {
      console.error("Failed to update budget:", error);
      toast.error("Failed to update budget", { theme: "dark" });
    }
  };

  // Handler for Quick Add parsing
  const handleQuickAddTextChange = (e) => {
    const text = e.target.value;
    setQuickAddText(text);
    const parsed = parseExpenseText(text);
    setQuickAddFields({
      amount: parsed.amount > 0 ? parsed.amount.toString() : "",
      category: parsed.category,
      description: parsed.description,
    });
  };

  const handleQuickAddSave = async (e) => {
    e.preventDefault();
    const amountFloat = parseFloat(quickAddFields.amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      toast.error("Amount must be greater than 0", { theme: "dark" });
      return;
    }
    if (!quickAddFields.description.trim()) {
      toast.error("Description is required", { theme: "dark" });
      return;
    }

    setIsQuickAddSaving(true);
    try {
      await createExpense({
        description: quickAddFields.description,
        amount: amountFloat,
        category: quickAddFields.category,
        date: new Date().toISOString().split("T")[0],
      });
      toast.success("Expense added successfully!", { theme: "dark" });
      setIsQuickAddOpen(false);
      setQuickAddText("");
      setQuickAddFields({ amount: "", category: "Others", description: "" });
      await loadData();
    } catch (err) {
      console.error("Quick Add failed:", err);
      toast.error("Failed to quick add expense", { theme: "dark" });
    } finally {
      setIsQuickAddSaving(false);
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    try {
      const metadataRows = [
        ["Export Date", new Date().toISOString().split("T")[0]],
        ["Total Records", sortedExpenses.length.toString()],
        [] // Blank separator line
      ];

      const headers = ["Date", "Category", "Title", "Description", "Amount"];

      const records = sortedExpenses.map((e) => [
        new Date(e.date).toISOString().split("T")[0],
        e.category || "",
        e.title || e.description || "",
        e.description || "",
        e.amount
      ]);

      const csvData = [
        ...metadataRows,
        headers,
        ...records
      ];

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "_");
      link.setAttribute("href", url);
      link.setAttribute("download", `expenses_${dateStr}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully", { theme: "dark" });
    } catch (err) {
      console.error("Export CSV failed:", err);
      toast.error("Failed to export CSV", { theme: "dark" });
    }
  };

  // Calculations for Summary Cards
  const totalMonthlyExpense = expenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const totalFoodExpense = expenses
    .filter((e) => (e.category || "").toLowerCase() === "food")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalTransportExpense = expenses
    .filter((e) => (e.category || "").toLowerCase() === "transport")
    .reduce((sum, e) => sum + e.amount, 0);

  // Search Logic
  const filteredExpenses = expenses.filter((e) => {
    const term = debouncedSearch.toLowerCase().trim();
    if (!term) return true;
    const titleMatch = (e.title || "").toLowerCase().includes(term);
    const descMatch = (e.description || "").toLowerCase().includes(term);
    const catMatch = (e.category || "").toLowerCase().includes(term);
    return titleMatch || descMatch || catMatch;
  });

  // Sorting Logic
  const allShareSameDate = filteredExpenses.length > 0 && filteredExpenses.every((e) => {
    return new Date(e.date).toDateString() === new Date(filteredExpenses[0].date).toDateString();
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === "newest") {
      if (allShareSameDate) {
        return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
      }
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
    }
    if (sortBy === "oldest") {
      if (allShareSameDate) {
        return new Date(a.created_at || a.date) - new Date(b.created_at || b.date);
      }
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      return new Date(a.created_at || a.date) - new Date(b.created_at || b.date);
    }
    if (sortBy === "amount-high") {
      return b.amount - a.amount;
    }
    if (sortBy === "amount-low") {
      return a.amount - b.amount;
    }
    if (sortBy === "category-az") {
      return (a.category || "").localeCompare(b.category || "");
    }
    if (sortBy === "category-za") {
      return (b.category || "").localeCompare(a.category || "");
    }
    return 0;
  });

  // Timeline mode sorts chronologically by newest first (ignoring search and dropdown sort states)
  const timelineExpenses = [...expenses].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const paginatedExpenses = sortedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  // Framer Motion Variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className={`max-w-6xl mx-auto space-y-8 transition-all duration-500 ${
        budgetExists === false ? "blur-md pointer-events-none filter" : ""
      }`}>
        
        {/* Header Component */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Hello {userName}
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1 font-medium">
              Track and manage your expenses effortlessly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={budgetExists ? { scale: 1.05 } : {}}
              whileTap={budgetExists ? { scale: 0.95 } : {}}
              onClick={() => budgetExists && setIsAddOpen(true)}
              disabled={!budgetExists}
              className={`inline-flex items-center gap-2 bg-[#A855F7] hover:bg-[#b56ef8] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all duration-200 ${
                !budgetExists ? "opacity-35 cursor-not-allowed shadow-none hover:bg-[#A855F7]" : ""
              }`}
            >
              <FiPlus className="h-5 w-5" />
              Add Expense
            </motion.button>
            {viewMode === "table" && (
              <motion.button
                whileHover={budgetExists ? { scale: 1.05 } : {}}
                whileTap={budgetExists ? { scale: 0.95 } : {}}
                onClick={() => budgetExists && handleExportCSV()}
                disabled={!budgetExists}
                className={`inline-flex items-center gap-2 bg-[#16161A] border border-white/5 hover:border-white/10 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  !budgetExists ? "opacity-35 cursor-not-allowed hover:border-white/5" : ""
                }`}
                title="Export CSV"
              >
                <FiDownload className="h-5 w-5 text-[#A855F7]" />
                Export CSV
              </motion.button>
            )}
            {budgetExists ? (
              <Link to="/categories">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-[#16161A] border border-white/5 hover:border-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all duration-200"
                  title="Manage Categories"
                >
                  <FiGrid className="h-5 w-5" />
                </motion.button>
              </Link>
            ) : (
              <button
                disabled
                className="p-3 bg-[#16161A] border border-white/5 text-[#9CA3AF] opacity-35 cursor-not-allowed rounded-xl transition-all duration-200"
                title="Manage Categories"
              >
                <FiGrid className="h-5 w-5" />
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-3 bg-[#16161A] border border-white/5 hover:border-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all duration-200"
              title="Logout"
            >
              <FiLogOut className="h-5 w-5" />
            </motion.button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: THIS MONTH (Upgraded) */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -4, borderColor: "rgba(168, 85, 247, 0.2)" }}
            className="rounded-2xl border border-white/5 bg-[#16161A] p-6 transition-all duration-300 relative overflow-hidden group shadow-xl flex flex-col justify-between min-h-[190px]"
          >
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  This Month
                </p>
                {totalMonthlyExpense <= budget ? (
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20">
                    Safe Spending Zone
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-danger bg-danger/10 px-2.5 py-0.5 rounded-full border border-danger/20">
                    Over Budget
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {formatCurrency(totalMonthlyExpense)}
              </h2>
            </div>

            <div className="space-y-2 mt-4 relative z-10">
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>
                  Budget:{" "}
                  {isEditingBudget ? (
                    <input
                      type="number"
                      value={newBudgetVal}
                      onChange={(e) => setNewBudgetVal(e.target.value)}
                      onBlur={async () => {
                        await handleUpdateBudget(parseFloat(newBudgetVal));
                        setIsEditingBudget(false);
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          await handleUpdateBudget(parseFloat(newBudgetVal));
                          setIsEditingBudget(false);
                        }
                      }}
                      className="bg-[#0F0F11] border border-white/10 text-white rounded px-1.5 py-0.5 w-16 text-center focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <span 
                      onClick={() => setIsEditingBudget(true)}
                      className="text-white hover:text-primary underline cursor-pointer font-semibold transition-colors"
                      title="Click to edit budget"
                    >
                      {formatCurrency(budget)}
                    </span>
                  )}
                </span>
                <span>
                  Remaining:{" "}
                  <span className={`font-semibold ${totalMonthlyExpense > budget ? "text-danger" : "text-success"}`}>
                    {formatCurrency(Math.max(0, budget - totalMonthlyExpense))}
                  </span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-[#0F0F11] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, budget > 0 ? (totalMonthlyExpense / budget) * 100 : 0)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full ${totalMonthlyExpense > budget ? "bg-danger" : "bg-[#A855F7]"}`}
                />
              </div>

              <div className="flex justify-between text-[10px] text-[#9CA3AF]/60 font-bold">
                <span>{Math.round(Math.min(100, budget > 0 ? (totalMonthlyExpense / budget) * 100 : 0))}% used</span>
                <span>Limit: {formatCurrency(budget)}</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: FOOD */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -4, borderColor: "rgba(34, 197, 94, 0.2)" }}
            className="rounded-2xl border border-white/5 bg-[#16161A] p-6 transition-all duration-300 relative overflow-hidden group shadow-xl flex flex-col justify-between min-h-[190px]"
          >
            <div className="absolute right-4 top-4 text-green-500 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
              <FiDollarSign className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                Food
              </p>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-1 tracking-tight">
                {formatCurrency(totalFoodExpense)}
              </h2>
            </div>
            <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10 inline-block w-fit">
              Total Food Category
            </span>
          </motion.div>

          {/* Card 3: TRANSPORT */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.2)" }}
            className="rounded-2xl border border-white/5 bg-[#16161A] p-6 transition-all duration-300 relative overflow-hidden group shadow-xl flex flex-col justify-between min-h-[190px]"
          >
            <div className="absolute right-4 top-4 text-blue-500 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
              <FiDollarSign className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                Transport
              </p>
              <h2 className="text-3xl font-extrabold text-white mt-2 mb-1 tracking-tight">
                {formatCurrency(totalTransportExpense)}
              </h2>
            </div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10 inline-block w-fit">
              Total Transport Category
            </span>
          </motion.div>
        </div>

        {/* AI Buddy Card Placement */}
        {!hideAIBuddy && (
          <AIBuddyCard
            expenses={expenses}
            budget={budget}
            onUpdateBudget={handleUpdateBudget}
            onIgnore={() => setHideAIBuddy(true)}
            disabled={budgetExists === false}
          />
        )}

        {/* Main List Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white tracking-wide">
                Recent Expenses
              </h3>
              {viewMode === "table" && filteredExpenses.length > 0 && (
                <span className="text-xs font-medium text-[#9CA3AF]">
                  ({filteredExpenses.length} of {expenses.length})
                </span>
              )}
            </div>
            
            {/* View Mode Toggle Segmented Control */}
            <div className="flex bg-[#16161A] p-1 border border-white/5 rounded-2xl w-[220px] relative select-none shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className="relative flex-1 py-2 text-xs font-extrabold uppercase transition-colors duration-200 z-10 text-center focus:outline-none"
              >
                {viewMode === "table" && (
                  <motion.div
                    layoutId="activeViewTab"
                    className="absolute inset-0 bg-[#A855F7] rounded-xl -z-10 shadow-lg shadow-primary/20"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <span className={viewMode === "table" ? "text-white" : "text-[#9CA3AF] hover:text-white"}>
                  Table
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className="relative flex-1 py-2 text-xs font-extrabold uppercase transition-colors duration-200 z-10 text-center focus:outline-none"
              >
                {viewMode === "timeline" && (
                  <motion.div
                    layoutId="activeViewTab"
                    className="absolute inset-0 bg-[#A855F7] rounded-xl -z-10 shadow-lg shadow-primary/20"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <span className={viewMode === "timeline" ? "text-white" : "text-[#9CA3AF] hover:text-white"}>
                  Timeline
                </span>
              </button>
            </div>
          </div>

          {/* Search & Sort Section (Visible ONLY in Table View) */}
          {viewMode === "table" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-[#16161A] p-4 rounded-2xl border border-white/5 shadow-xl"
            >
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]/50">
                  <FiSearch className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search description, category..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#0F0F11] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#9CA3AF]/30 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] whitespace-nowrap">
                  Sort By
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#0F0F11] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 cursor-pointer min-w-[160px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                  <option value="category-az">Category: A-Z</option>
                  <option value="category-za">Category: Z-A</option>
                </select>
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <ExpenseSkeleton />
          ) : expenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-[#16161A]/40 text-center"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 text-[#9CA3AF]">
                <FiInbox className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                No expenses yet
              </h3>
              <p className="text-sm text-[#9CA3AF] mb-6 max-w-sm">
                Start by adding your first expense. Track and categorize every spend efficiently.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-2 bg-[#A855F7] hover:bg-[#b56ef8] text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all duration-200"
              >
                <FiPlus className="h-5 w-5" />
                Add Expense
              </motion.button>
            </motion.div>
          ) : filteredExpenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-[#16161A]/40 text-center"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 text-[#9CA3AF]">
                <FiSearch className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                No results found
              </h3>
              <p className="text-sm text-[#9CA3AF] max-w-sm mb-2">
                We couldn't find any expenses matching "{debouncedSearch}".
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-primary font-bold hover:underline"
              >
                Clear Search Query
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <ExpenseList
                expenses={viewMode === "table" ? paginatedExpenses : timelineExpenses}
                categories={categories}
                viewMode={viewMode}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />

              {/* Pagination Controls (Visible ONLY in Table View) */}
              {viewMode === "table" && totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center items-center gap-2 pt-4"
                >
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2.5 bg-[#16161A] border border-white/5 hover:border-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all duration-200 disabled:opacity-30 disabled:hover:border-white/5 disabled:hover:text-[#9CA3AF]"
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>

                  {getPageNumbers().map((num, i) => {
                    if (num === "...") {
                      return (
                        <span
                          key={`dots-${i}`}
                          className="px-2 text-[#9CA3AF] select-none cursor-default font-semibold text-xs"
                        >
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                          currentPage === num
                            ? "bg-[#A855F7] text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-[#16161A] text-[#9CA3AF] border-white/5 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2.5 bg-[#16161A] border border-white/5 hover:border-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all duration-200 disabled:opacity-30 disabled:hover:border-white/5 disabled:hover:text-[#9CA3AF]"
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Quick Add */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={budgetExists ? { scale: 1.05 } : {}}
          whileTap={budgetExists ? { scale: 0.95 } : {}}
          onClick={() => budgetExists && setIsQuickAddOpen(true)}
          disabled={!budgetExists}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#A855F7] text-white shadow-xl shadow-primary/30 hover:bg-[#b56ef8] transition-colors ${
            !budgetExists ? "opacity-35 cursor-not-allowed shadow-none hover:bg-[#A855F7]" : ""
          }`}
          title="Quick Add Expense"
        >
          <span className="text-2xl font-semibold">⊕</span>
        </motion.button>
      </div>

      {/* Quick Add Dialog Modal */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickAddOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[#16161A] p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                <div className="flex items-center gap-2">
                  <FiZap className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-white">Quick Add Expense</h3>
                </div>
                <button
                  onClick={() => setIsQuickAddOpen(false)}
                  className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleQuickAddSave} className="space-y-4">
                {/* Natural Text Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Natural Text Input
                  </label>
                  <textarea
                    rows={2}
                    value={quickAddText}
                    onChange={handleQuickAddTextChange}
                    className="w-full bg-[#0F0F11] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#9CA3AF]/30 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    placeholder="e.g. Spent 250 on Burger, or Uber Ride 500..."
                    autoFocus
                  />
                </div>

                {/* Category Quick Chips */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Category Quick Select
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Food", icon: FiCoffee },
                      { name: "Transport", icon: FiCompass },
                      { name: "Shopping", icon: FiShoppingBag },
                      { name: "Entertainment", icon: FiTv },
                      { name: "Health", icon: FiActivity },
                      { name: "Others", icon: FiFolder },
                    ].map((btn) => {
                      const Icon = btn.icon;
                      const isSelected = quickAddFields.category.toLowerCase() === btn.name.toLowerCase();
                      return (
                        <button
                          key={btn.name}
                          type="button"
                          onClick={() => setQuickAddFields(prev => ({ ...prev, category: btn.name }))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isSelected
                              ? "bg-primary/20 border-primary/50 text-white"
                              : "bg-[#0F0F11] border-white/5 text-[#9CA3AF] hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {btn.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live confidence preview / edit fields */}
                <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 space-y-3">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#9CA3AF]/60 block border-b border-white/[0.04] pb-1.5">
                    Confidence Parser (Click to Edit)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Amount */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Amount (₹)</label>
                      <input
                        type="number"
                        value={quickAddFields.amount}
                        onChange={(e) => setQuickAddFields(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full bg-[#16161A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        placeholder="Amount"
                        required
                      />
                    </div>
                    {/* Category Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Category</label>
                      <select
                        value={quickAddFields.category}
                        onChange={(e) => setQuickAddFields(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#16161A] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Health">Health</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Description</label>
                    <input
                      type="text"
                      value={quickAddFields.description}
                      onChange={(e) => setQuickAddFields(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-[#16161A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      placeholder="Description"
                      required
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-[#9CA3AF] hover:text-white rounded-xl py-2.5 text-xs font-bold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isQuickAddSaving}
                    className="flex-1 bg-primary hover:bg-[#b56ef8] text-white rounded-xl py-2.5 text-xs font-bold shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50"
                  >
                    {isQuickAddSaving ? "Saving..." : "Confirm & Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveExpense}
        isSaving={isSaving}
        categories={categories}
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
        categories={categories}
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
        onSuccess={handleBudgetSetupSuccess}
      />
    </div>
  );
}

export default ExpenseDashboard;
