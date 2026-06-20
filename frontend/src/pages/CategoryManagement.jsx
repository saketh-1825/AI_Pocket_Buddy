import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiTrash2, FiPlus, FiAlertTriangle } from "react-icons/fi";
import { toast } from "react-toastify";

import { getCategories, createCategory, deleteCategory } from "../api/categories";
import { getExpenses } from "../api/expenses";
import { getCurrentBudget } from "../api/budget";
import { COLOR_PALETTE, ICON_MAP, getCategoryStyles, getCategoryIcon } from "../constants/categories";

const DEFAULT_CATEGORY_NAMES = ["food", "transport", "shopping", "entertainment", "health", "others"];

// Currency Formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper to generate dynamic insights based on transactions in a category
const getCategoryInsight = (catName, catExpenses) => {
  if (catExpenses.length === 0) return "No expenses recorded";
  
  const lowerName = catName.toLowerCase();
  
  // 1. Food / Shopping: Most frequent description
  if (lowerName === "food" || lowerName === "shopping") {
    const counts = {};
    catExpenses.forEach(e => {
      const desc = (e.description || e.title || "").trim();
      if (desc) {
        counts[desc] = (counts[desc] || 0) + 1;
      }
    });
    let mostFreq = "";
    let maxVal = 0;
    Object.keys(counts).forEach(k => {
      if (counts[k] > maxVal) {
        maxVal = counts[k];
        mostFreq = k;
      }
    });
    if (mostFreq) {
      return `Most frequent: ${mostFreq}`;
    }
  }

  // 2. Transport / Entertainment: Peak weekday spending
  if (lowerName === "transport" || lowerName === "entertainment") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayTotals = Array(7).fill(0);
    catExpenses.forEach(e => {
      const dayIdx = new Date(e.date).getDay();
      dayTotals[dayIdx] += e.amount;
    });
    let peakDayIdx = 0;
    let maxAmt = 0;
    dayTotals.forEach((val, idx) => {
      if (val > maxAmt) {
        maxAmt = val;
        peakDayIdx = idx;
      }
    });
    if (maxAmt > 0) {
      return `Peak spending: ${days[peakDayIdx]}`;
    }
  }

  // 3. Health: Monthly Trend
  if (lowerName === "health") {
    const now = new Date();
    const thisMonthVal = catExpenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const lastMonthVal = catExpenses
      .filter(e => {
        const d = new Date(e.date);
        const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return d.getMonth() === lm && d.getFullYear() === ly;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    if (lastMonthVal > 0) {
      const trend = ((thisMonthVal - lastMonthVal) / lastMonthVal) * 100;
      if (trend > 0) {
        return `Monthly Trend: ↑ ${Math.round(trend)}%`;
      } else if (trend < 0) {
        return `Monthly Trend: ↓ ${Math.round(Math.abs(trend))}%`;
      }
    }
    return "Stable monthly spending";
  }

  // General default insight: weekday vs weekend spending proportion
  let weekendTotal = 0;
  catExpenses.forEach(e => {
    const day = new Date(e.date).getDay();
    if (day === 0 || day === 6) weekendTotal += e.amount;
  });
  const catTotalSpend = catExpenses.reduce((sum, e) => sum + e.amount, 0);
  if (catTotalSpend > 0) {
    const weekendPct = (weekendTotal / catTotalSpend) * 100;
    if (weekendPct > 50) {
      return "Mainly weekend spending";
    }
  }

  return "Consistent distribution";
};

function CategoryManagement() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetExists, setBudgetExists] = useState(null);

  // Form State
  const [newCatName, setNewCatName] = useState("");
  const [selectedColor, setSelectedColor] = useState("Purple");
  const [selectedIcon, setSelectedIcon] = useState("Finance");
  const [formError, setFormError] = useState("");

  // Deletion Confirmation State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Fetch categories and expenses on mount to compute totals
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [catData, expData, budgetData] = await Promise.all([
          getCategories(),
          getExpenses(),
          getCurrentBudget()
        ]);
        setCategories(catData);
        setExpenses(expData);
        setBudgetExists(budgetData.exists);
      } catch (err) {
        console.error("Failed to load category data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 25) {
      setFormError("Name must be between 2 and 25 characters.");
      return;
    }

    // Client-side unique check (case-insensitive)
    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      setFormError(`Category '${trimmedName}' already exists.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await createCategory({
        name: trimmedName,
        color: selectedColor,
        icon: selectedIcon,
      });
      toast.success("Category added successfully!", { theme: "dark" });
      setNewCatName("");
      // Refresh categories list
      const updatedCats = await getCategories();
      setCategories(updatedCats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (category) => {
    if (DEFAULT_CATEGORY_NAMES.includes(category.name.toLowerCase())) {
      toast.error("Default categories cannot be deleted.", { theme: "dark" });
      return;
    }
    setCategoryToDelete(category);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success(`Category '${categoryToDelete.name}' deleted. Expenses moved to 'Others'.`, {
        theme: "dark",
      });
      setIsDeleteOpen(false);
      setCategoryToDelete(null);

      // Refresh both categories and expenses lists since expense categories were reassigned
      const [updatedCats, updatedExps] = await Promise.all([getCategories(), getExpenses()]);
      setCategories(updatedCats);
      setExpenses(updatedExps);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper: Calculate expense stats for a category name
  const getCategoryStats = (categoryName) => {
    const matchingExpenses = expenses.filter(
      (e) => (e.category || "").toLowerCase() === categoryName.toLowerCase()
    );
    const count = matchingExpenses.length;
    const total = matchingExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { count, total };
  };

  // Page Motion Animation Variants
  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
  };

  if (!isLoading && budgetExists === false) {
    return (
      <div className="min-h-screen bg-[#0F0F11] text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="w-full max-w-md bg-[#16161A] border border-white/5 rounded-[20px] p-8 shadow-2xl text-center space-y-6"
        >
          <div className="space-y-2">
            <span className="text-5xl block pb-2">📊</span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Monthly Budget Required
            </h2>
            <p className="text-sm text-[#9CA3AF] font-medium leading-relaxed">
              Please set your budget before managing categories.
            </p>
          </div>

          <div className="bg-[#0F0F11]/60 border border-white/5 rounded-2xl p-4 text-left space-y-2.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]/60">
              A budget helps us provide:
            </p>
            <ul className="space-y-1.5 text-xs text-[#9CA3AF] font-medium">
              <li className="flex items-center gap-2">
                <span className="text-[#A855F7]">✓</span> AI Insights
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#A855F7]">✓</span> Spending Analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#A855F7]">✓</span> Savings Recommendations
              </li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/dashboard")}
            className="w-full bg-[#A855F7] hover:bg-[#b56ef8] text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-primary/20 transition-all duration-200"
          >
            Set Budget
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center gap-4 border-b border-white/5 pb-6">
          <Link
            to="/dashboard"
            className="p-2.5 bg-[#16161A] border border-white/5 hover:border-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all duration-200"
            title="Back to Dashboard"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Category Management
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1 font-medium">
              Create and manage dynamic categories for your expenses.
            </p>
          </div>
        </header>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Add Category Form (Left / 1-column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#16161A] border border-white/5 rounded-2xl p-6 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Add Category
              </h2>

              <form onSubmit={handleAddCategory} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Travel, Books"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setFormError("");
                    }}
                    className="w-full bg-[#0F0F11] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-[#9CA3AF]/30 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  {formError && <p className="mt-1.5 text-xs text-danger">{formError}</p>}
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
                    Badge Color
                  </label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {Object.keys(COLOR_PALETTE)
                      .filter((c) => c[0] === c[0].toUpperCase()) // Filter duplicates (TitleCase keys)
                      .map((colorKey) => {
                        const col = COLOR_PALETTE[colorKey];
                        const isSelected = selectedColor === colorKey;
                        return (
                          <button
                            type="button"
                            key={colorKey}
                            onClick={() => setSelectedColor(colorKey)}
                            className={`h-8 w-full rounded-lg border transition-all flex items-center justify-center ${isSelected
                                ? "border-white ring-2 ring-primary/40 scale-105"
                                : "border-white/10 hover:border-white/30"
                              }`}
                            style={{ backgroundColor: col.hex }}
                            title={colorKey}
                          >
                            {isSelected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Icon Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
                    Category Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2.5 bg-[#0F0F11] border border-white/5 rounded-xl p-3 max-h-36 overflow-y-auto">
                    {Object.keys(ICON_MAP)
                      .filter((i) => i[0] === i[0].toUpperCase()) // Filter duplicates (TitleCase keys)
                      .map((iconKey) => {
                        const IconComponent = ICON_MAP[iconKey];
                        const isSelected = selectedIcon === iconKey;
                        return (
                          <button
                            type="button"
                            key={iconKey}
                            onClick={() => setSelectedIcon(iconKey)}
                            className={`p-2.5 rounded-lg border transition-all flex items-center justify-center ${isSelected
                                ? "bg-primary/20 text-primary border-primary/40 scale-105"
                                : "bg-transparent text-[#9CA3AF] border-white/5 hover:border-white/20 hover:text-white"
                              }`}
                            title={iconKey}
                          >
                            <IconComponent className="h-5 w-5" />
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#A855F7] hover:bg-[#b56ef8] text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/10 transition-all duration-200 mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    "Adding..."
                  ) : (
                    <>
                      <FiPlus className="h-5 w-5" />
                      Add Category
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </div>

          {/* Categories Grid (Right / 2-columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white tracking-wide">
              Active Categories
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-[#16161A] border border-white/5 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat, idx) => {
                  const { count, total } = getCategoryStats(cat.name);
                  const isDefault = DEFAULT_CATEGORY_NAMES.includes(cat.name.toLowerCase());
                  const catStyle = getCategoryStyles(cat.color);
                  const IconComponent = getCategoryIcon(cat.icon);

                  const matchingExpenses = expenses.filter(
                    (e) => (e.category || "").toLowerCase() === cat.name.toLowerCase()
                  );
                  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
                  const percentage = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
                  const insight = getCategoryInsight(cat.name, matchingExpenses);

                  return (
                    <motion.div
                      key={cat.id || cat.name}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      whileHover={{ scale: 1.02, y: -4, borderColor: "rgba(255, 255, 255, 0.08)" }}
                      className="bg-[#16161A] border border-white/5 rounded-2xl p-5 shadow-lg relative flex flex-col justify-between min-h-[180px] transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        {/* Icon & Name */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F0F11] border border-white/5 ${catStyle.text}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-base truncate max-w-[140px] sm:max-w-xs">
                              {cat.name}
                            </h3>
                            <span
                              className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] uppercase font-bold tracking-wide border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            >
                              {cat.color}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-extrabold text-[#9CA3AF] bg-[#0F0F11] px-2 py-1 rounded-lg border border-white/5">
                            {percentage}%
                          </span>
                          {!isDefault && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteClick(cat)}
                              className="p-1.5 rounded-lg border border-white/5 bg-[#0F0F11] text-[#9CA3AF] hover:text-danger hover:border-danger/25 transition-all duration-200"
                              title="Delete Category"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </motion.button>
                          )}
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full h-1.5 bg-[#0F0F11] rounded-full overflow-hidden mt-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full"
                          style={{ backgroundColor: catStyle.hex }}
                        />
                      </div>

                      {/* Stats & Insights */}
                      <div className="border-t border-white/[0.03] pt-3 mt-3 flex flex-col gap-1.5 text-xs text-[#9CA3AF] font-medium">
                        <div className="flex items-center justify-between">
                          <span>
                            {count} expense{count === 1 ? "" : "s"}
                          </span>
                          <span className="text-white font-semibold">
                            {formatCurrency(total)} total
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-primary tracking-wide uppercase border-t border-white/[0.02] pt-1.5">
                          {insight}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteOpen && categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[#16161A] p-6 shadow-2xl z-10 text-center flex flex-col items-center"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                <FiAlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Delete Category
              </h3>
              <p className="mb-6 text-sm text-[#9CA3AF]">
                Are you sure you want to delete the category{" "}
                <span className="text-white font-bold">"{categoryToDelete.name}"</span>?
                <br />
                All expenses in this category will be recategorized as{" "}
                <span className="text-white font-bold">"Others"</span>.
              </p>
              <div className="flex w-full gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-white/10 bg-transparent py-2.5 text-sm font-medium text-[#9CA3AF] hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CategoryManagement;
