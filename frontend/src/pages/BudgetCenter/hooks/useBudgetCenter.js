import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import {
  getCategoryBudgets,
  createCategoryBudget,
  updateCategoryBudget,
  deleteCategoryBudget,
  getBudgetSummary,
} from "../../../services/budgets/budgetService";

import { getCategories } from "../../../services/api/categories";
import { formatCurrency } from "../../../utils/currencyFormat";

export function useBudgetCenter() {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(0);
  const [spent, setSpent] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [editLimitAmount, setEditLimitAmount] = useState("");

  // Load budget data
  const loadBudgetData = async () => {
    setLoading(true);

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [cats, catBudgets, summary] = await Promise.all([
        getCategories(),
        getCategoryBudgets(month, year),
        getBudgetSummary(month, year),
      ]);

      setCategories(cats || []);
      setCategoryBudgets(catBudgets || []);

      setBudget(summary?.total_budget || 0);
      setSpent(summary?.total_spent || 0);
    } catch (err) {
      console.error("Failed to load budget data:", err);

      toast.error("Error loading budget data", {
        theme: "light",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadBudgetData();
  }, []);

  // Create category budget
  const handleCreateBudget = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      toast.error("Please select a category", {
        theme: "light",
      });
      return;
    }

    const limit = parseFloat(limitAmount);

    if (isNaN(limit) || limit <= 0) {
      toast.error("Please enter a valid limit amount", {
        theme: "light",
      });
      return;
    }

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await createCategoryBudget(
        selectedCategory,
        limit,
        month,
        year
      );

      toast.success("Category budget set successfully!", {
        theme: "light",
      });

      setIsAddOpen(false);
      setSelectedCategory("");
      setLimitAmount("");

      await loadBudgetData();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.detail ||
        "Failed to set category budget.",
        {
          theme: "light",
        }
      );
    }
  };

  // Edit category budget
  const handleEditClick = (budgetObj) => {
    setSelectedBudget(budgetObj);
    setEditLimitAmount(
      budgetObj.limit_amount.toString()
    );
    setIsEditOpen(true);
  };

  // Update category budget
  const handleUpdateLimit = async (e) => {
    e.preventDefault();

    if (!selectedBudget) return;

    const limit = parseFloat(editLimitAmount);

    if (isNaN(limit) || limit <= 0) {
      toast.error("Please enter a valid limit amount", {
        theme: "light",
      });
      return;
    }

    try {
      await updateCategoryBudget(
        selectedBudget.id,
        limit
      );

      toast.success("Budget limit updated successfully!", {
        theme: "light",
      });

      setIsEditOpen(false);
      setSelectedBudget(null);
      setEditLimitAmount("");

      await loadBudgetData();
    } catch (err) {
      console.error(err);

      toast.error("Failed to update category budget.", {
        theme: "light",
      });
    }
  };

  // Delete category budget
  const handleDeleteClick = async (budgetObj) => {
    if (
      !window.confirm(
        `Remove monthly budget for ${budgetObj.category}?`
      )
    ) {
      return;
    }

    try {
      await deleteCategoryBudget(budgetObj.id);

      toast.success(
        `Removed budget for ${budgetObj.category}`,
        {
          theme: "light",
        }
      );

      await loadBudgetData();
    } catch (err) {
      console.error(err);

      toast.error("Failed to remove category budget.", {
        theme: "light",
      });
    }
  };

  // Budget calculations
  const isOverBudget = spent > budget;
  const remaining = Math.max(0, budget - spent);

  const percentUsed =
    budget > 0
      ? Math.min(
        100,
        Math.round((spent / budget) * 100)
      )
      : 0;

  // Recommendations
  const getRecommendations = () => {
    const recommendations = [];
    const items = categoryBudgets || [];

    const overspentCategories = items.filter(
      (item) => item.status === "OVER BUDGET"
    );

    const warningCategories = items.filter(
      (item) =>
        item.status === "WARNING" ||
        item.status === "ALMOST EXCEEDED"
    );

    if (overspentCategories.length > 0) {
      overspentCategories.forEach((item) => {
        recommendations.push({
          type: "danger",
          category: item.category,
          text: `You spent ${formatCurrency(
            item.spent_amount
          )} on ${item.category}, exceeding your limit of ${formatCurrency(
            item.limit_amount
          )}. Freeze non-essential purchases immediately.`,
        });
      });
    }

    if (warningCategories.length > 0) {
      warningCategories.forEach((item) => {
        recommendations.push({
          type: "warning",
          category: item.category,
          text: `You spent ${formatCurrency(
            item.spent_amount
          )} on ${item.category}, utilizing ${Math.round(
            item.progress_percentage
          )}% of your limit. Keep an eye on new transactions.`,
        });
      });
    }

    if (budget > 0) {
      if (!isOverBudget) {
        recommendations.push({
          type: "success",
          category: "Savings Goal",
          text: `Great job! You have a buffer of ${formatCurrency(
            remaining
          )} remaining. Putting this into savings will grow your monthly backup reserve.`,
        });
      } else {
        recommendations.push({
          type: "danger",
          category: "Savings Goal",
          text: `You have exceeded your total limit by ${formatCurrency(
            spent - budget
          )}. Try to freeze shopping or entertainment categories to restore balance.`,
        });
      }
    } else {
      recommendations.push({
        type: "setup",
        category: "System Recommendation",
        text: "Please set a monthly budget on the dashboard page or category budgets below to begin receiving insights.",
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return {
    // Data
    loading,
    budget,
    spent,
    categoryBudgets,
    categories,
    // Derived
    isOverBudget,
    remaining,
    percentUsed,
    recommendations,
    // Modal state
    isAddOpen,
    setIsAddOpen,
    isEditOpen,
    setIsEditOpen,
    selectedBudget,
    setSelectedBudget,
    // Form state
    selectedCategory,
    setSelectedCategory,
    limitAmount,
    setLimitAmount,
    editLimitAmount,
    setEditLimitAmount,
    // Handlers
    handleCreateBudget,
    handleEditClick,
    handleUpdateLimit,
    handleDeleteClick,
  };
}
