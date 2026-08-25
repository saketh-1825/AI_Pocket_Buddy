import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useCategoryStore } from "../../../store/categoryStore";
import { useExpenseStore } from "../../../store/expenseStore";
import {
  getCurrentBudget,
  getBudgetSummary,
} from "../../../services/budgets/budgetService";

export function useExpenseDashboard() {
  const { expenses } = useExpenseStore();
  const { categories } = useCategoryStore();

  // Budget state
  const [budget, setBudget] = useState(10000);
  const [budgetExists, setBudgetExists] = useState(null);

  // Loading state
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search, sort and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  // Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // User name
  const [userName] = useState(() => {
    return localStorage.getItem("userName") || "Saketh";
  });

  // Load dashboard data
  const loadData = async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [, , budgetData, summary] = await Promise.all([
        useExpenseStore.getState().fetchExpenses(),
        useCategoryStore.getState().fetchCategories(),
        getCurrentBudget(),
        getBudgetSummary(month, year),
      ]);

      const activeBudget =
        summary?.total_budget ||
        (budgetData?.exists ? budgetData.monthly_budget : 0);

      setBudget(activeBudget);
      setBudgetExists(activeBudget > 0);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  // Budget setup success
  const handleBudgetSetupSuccess = (amount) => {
    setBudget(amount);
    setBudgetExists(true);
    loadData();
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Add expense
  const handleSaveExpense = async (formData) => {
    setIsSaving(true);

    try {
      await useExpenseStore.getState().addExpense(formData);

      toast.success("Expense added successfully", {
        theme: "light",
      });

      setIsAddOpen(false);
    } catch (error) {
      console.error("Failed to create expense:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Edit expense
  const handleEditClick = (expense) => {
    setSelectedExpense(expense);
    setIsEditOpen(true);
  };

  // Update expense
  const handleUpdateExpense = async (id, formData) => {
    setIsUpdating(true);

    try {
      await useExpenseStore.getState().updateExpense(id, formData);

      toast.success("Expense updated successfully", {
        theme: "light",
      });

      setIsEditOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error("Failed to update expense:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open delete confirmation
  const handleDeleteClick = (id) => {
    const target = expenses.find((expense) => expense.id === id);

    if (target) {
      setSelectedExpense(target);
      setIsDeleteOpen(true);
    }
  };

  // Delete expense
  const handleConfirmDelete = async () => {
    if (!selectedExpense) return;

    setIsDeleting(true);

    try {
      await useExpenseStore.getState().deleteExpense(selectedExpense.id);

      toast.success("Expense deleted successfully", {
        theme: "light",
      });

      setIsDeleteOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error("Failed to delete expense:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Total spending for current month
  const totalMonthlyExpense = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);
      const now = new Date();

      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const term = debouncedSearch.toLowerCase().trim();

    if (!term) return true;

    const titleMatch = (expense.title || "").toLowerCase().includes(term);
    const descriptionMatch = (expense.description || "").toLowerCase().includes(term);

    const categoryObject = categories.find(
      (category) => category.id === expense.category_id
    );

    const categoryName = categoryObject ? categoryObject.name : "Others";
    const categoryMatch = categoryName.toLowerCase().includes(term);

    return titleMatch || descriptionMatch || categoryMatch;
  });

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === "newest") {
      const dateDiff = new Date(b.date) - new Date(a.date);
      if (dateDiff === 0 && b.created_at && a.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return dateDiff;
    }
    if (sortBy === "oldest") {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff === 0 && b.created_at && a.created_at) {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      return dateDiff;
    }
    if (sortBy === "amount-high") return b.amount - a.amount;
    if (sortBy === "amount-low") return a.amount - b.amount;
    return 0;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / itemsPerPage));
  const paginatedExpenses = sortedExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Budget usage
  const budgetUsagePercent = budget > 0
    ? Math.min(100, Math.round((totalMonthlyExpense / budget) * 100))
    : 0;

  return {
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
  };
}
