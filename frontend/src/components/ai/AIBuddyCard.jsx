import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrendingUp, FiCalendar, FiPieChart, FiDollarSign, FiEdit2, FiCheck, FiX, FiActivity, FiArrowUpRight } from "react-icons/fi";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

function AIBuddyCard({ expenses = [], budget = 3000, onUpdateBudget, onIgnore, disabled = false }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetVal, setNewBudgetVal] = useState(budget);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Calculations
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Category breakdown
  const categoryMap = {};
  expenses.forEach(e => {
    const cat = e.category || "Others";
    categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
  });
  
  let highestCategory = "None";
  let highestCategorySpend = 0;
  Object.keys(categoryMap).forEach(cat => {
    if (categoryMap[cat] > highestCategorySpend) {
      highestCategorySpend = categoryMap[cat];
      highestCategory = cat;
    }
  });
  
  const highestCategoryPercent = totalSpend > 0 ? Math.round((highestCategorySpend / totalSpend) * 100) : 0;
  
  // Weekend vs Weekday
  let weekendSpend = 0;
  let weekdaySpend = 0;
  expenses.forEach(e => {
    const d = new Date(e.date);
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday
    if (day === 0 || day === 6) {
      weekendSpend += e.amount;
    } else {
      weekdaySpend += e.amount;
    }
  });
  
  const spendMoreOnWeekends = weekendSpend > weekdaySpend;
  const weekendPercent = totalSpend > 0 ? Math.round((weekendSpend / totalSpend) * 100) : 0;

  // Average daily spend
  const uniqueDates = new Set(expenses.map(e => new Date(e.date).toDateString()));
  const activeDaysCount = Math.max(1, uniqueDates.size);
  const averageDailySpend = totalSpend / activeDaysCount;
  
  // Spending Health score logic
  let score = 100;
  const usageRatio = budget > 0 ? totalSpend / budget : 0;
  if (usageRatio > 1.0) {
    score -= 40;
    const overspendSeverity = Math.min(20, Math.round((usageRatio - 1.0) * 40));
    score -= overspendSeverity;
  } else if (usageRatio > 0.8) {
    score -= 20;
  } else if (usageRatio > 0.5) {
    score -= 10;
  }
  if (highestCategoryPercent > 70) {
    score -= 25;
  } else if (highestCategoryPercent > 50) {
    score -= 15;
  }
  score = Math.max(5, Math.min(100, score));
  
  let healthStatus = "Outstanding";
  let healthColor = "text-success";
  let healthBarBg = "bg-success";
  
  if (score < 30) {
    healthStatus = "Poor";
    healthColor = "text-danger";
    healthBarBg = "bg-danger";
  } else if (score < 60) {
    healthStatus = "Good";
    healthColor = "text-warning";
    healthBarBg = "bg-warning";
  } else if (score < 80) {
    healthStatus = "Excellent";
    healthColor = "text-primary";
    healthBarBg = "bg-primary";
  }
  
  const handleSaveBudget = async () => {
    const val = parseFloat(newBudgetVal);
    if (isNaN(val) || val <= 0) return;
    setIsSavingBudget(true);
    try {
      await onUpdateBudget(val);
      setIsEditingBudget(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const recommendedBudget = Math.round(highestCategorySpend * 0.85);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`w-full bg-surface border border-border rounded-card p-7 shadow-sm relative overflow-hidden ${
        disabled ? "opacity-35 pointer-events-none" : ""
      }`}
    >
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-5 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-activeBg px-2 py-0.5 rounded border border-primary/20">
              AI Insights
            </span>
            <span className="text-xs text-textSecondary font-bold">Active Advisor</span>
          </div>
          <h2 className="text-[20px] font-bold text-textPrimary tracking-tight">
            Personal Wealth Recommendations
          </h2>
        </div>

        {/* Health Score Box */}
        <div className="flex items-center gap-4 bg-background border border-border rounded-xl px-4 py-2.5 min-w-[220px]">
          <FiActivity className={`h-5 w-5 shrink-0 ${healthColor}`} />
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-textSecondary">Health Score</span>
              <span className={`font-bold ${healthColor}`}>{score}</span>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full ${healthBarBg}`}
              />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${healthColor}`}>
              Status: {healthStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Structured Advisor Card */}
      <div className="py-6 space-y-5">
        {totalSpend > 0 ? (
          <div className="bg-background border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-primary">
              <FiTrendingUp className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-xs uppercase font-extrabold tracking-wider">
                Observation Details
              </span>
            </div>
            
            {/* Observation, Why it matters, Action items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-textSecondary">
              <div className="space-y-1">
                <h5 className="font-bold text-textPrimary text-xs uppercase tracking-wide">
                  Observation
                </h5>
                <p className="leading-relaxed">
                  Your <span className="text-textPrimary font-bold">{highestCategory}</span> spending occupies the largest share of this month's budget.
                </p>
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-textPrimary text-xs uppercase tracking-wide">
                  Why it Matters
                </h5>
                <p className="leading-relaxed">
                  You spent <span className="text-textPrimary font-bold">{formatCurrency(highestCategorySpend)}</span> on {highestCategory}, representing <span className="text-textPrimary font-bold">{highestCategoryPercent}%</span> of total spending.
                  {spendMoreOnWeekends && (
                    <span> Weekend spending is particularly high ({weekendPercent}%).</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-textPrimary text-xs uppercase tracking-wide">
                  Recommended Action
                </h5>
                <p className="leading-relaxed">
                  Reduce the monthly allocation to <span className="text-textPrimary font-bold">{formatCurrency(recommendedBudget)}</span>. This will prevent overspending and boost savings.
                </p>
              </div>
            </div>

            {/* Inline Budget Form / Action row */}
            <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-textSecondary font-bold">Recommended Budget Limit:</span>
                <span className="text-sm font-extrabold text-textPrimary">{formatCurrency(recommendedBudget)}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {!isEditingBudget ? (
                  <button
                    onClick={() => {
                      setNewBudgetVal(recommendedBudget);
                      setIsEditingBudget(true);
                    }}
                    className="h-10 px-5 rounded-xl bg-primary hover:bg-primaryHover text-white text-xs font-bold transition-colors cursor-pointer focus:outline-none flex items-center gap-1.5"
                  >
                    Set Recommended Budget
                    <FiArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative max-w-[130px]">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-textSecondary">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={newBudgetVal}
                        onChange={(e) => setNewBudgetVal(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl pl-6 pr-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-primary"
                        placeholder="Budget limit"
                      />
                    </div>
                    <button
                      onClick={handleSaveBudget}
                      disabled={isSavingBudget}
                      className="p-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                      title="Save"
                    >
                      <FiCheck className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingBudget(false);
                        setNewBudgetVal(budget);
                      }}
                      className="p-2 bg-background border border-border text-textSecondary hover:text-textPrimary rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                      title="Cancel"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-textSecondary leading-relaxed text-center py-4 bg-background border border-border rounded-xl">
            Welcome! Add transactions below to calculate dynamic spending health metrics and visual financial recommendations.
          </p>
        )}
      </div>

      {/* 3. Action Bars */}
      <div className="flex flex-wrap items-center gap-3">
        {totalSpend > 0 && (
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-surface text-textSecondary hover:text-textPrimary text-xs font-bold transition-all cursor-pointer focus:outline-none"
          >
            <FiPieChart className="h-4 w-4 shrink-0 text-textSecondary" />
            {showAnalysis ? "Hide Analysis" : "Show Full Analysis"}
          </button>
        )}
        <button
          onClick={onIgnore}
          className="inline-flex items-center text-textMuted hover:text-danger text-xs font-bold transition-colors cursor-pointer ml-auto focus:outline-none"
        >
          Ignore Recommendation
        </button>
      </div>

      {/* 4. Analysis expansion */}
      <AnimatePresence>
        {showAnalysis && totalSpend > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mt-6 border-t border-border">
              {/* Item 1 */}
              <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-textSecondary">
                  <span>Highest Category</span>
                  <FiPieChart className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm font-bold text-textPrimary truncate">{highestCategory}</div>
                <div className="text-[11px] text-textSecondary">
                  {formatCurrency(highestCategorySpend)} ({highestCategoryPercent}%)
                </div>
              </div>

              {/* Item 2 */}
              <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-textSecondary">
                  <span>Weekend Spending</span>
                  <FiCalendar className="h-4 w-4 text-success" />
                </div>
                <div className="text-sm font-bold text-textPrimary">
                  {formatCurrency(weekendSpend)}
                </div>
                <div className="text-[11px] text-textSecondary">
                  {weekendPercent}% of monthly total
                </div>
              </div>

              {/* Item 3 */}
              <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-textSecondary">
                  <span>Daily Average</span>
                  <FiActivity className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm font-bold text-textPrimary">
                  {formatCurrency(averageDailySpend)}
                </div>
                <div className="text-[11px] text-textSecondary">
                  Over {activeDaysCount} active days
                </div>
              </div>

              {/* Item 4 */}
              <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-textSecondary">
                  <span>Remaining Budget</span>
                  <FiDollarSign className="h-4 w-4 text-warning" />
                </div>
                <div className="text-sm font-bold text-textPrimary">
                  {formatCurrency(Math.max(0, budget - totalSpend))}
                </div>
                <div className="text-[11px] text-textSecondary">
                  {usageRatio > 1.0 ? "Over budget limit" : `${Math.round((1 - usageRatio) * 100)}% left`}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AIBuddyCard;
