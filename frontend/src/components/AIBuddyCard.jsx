import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrendingUp, FiCalendar, FiPieChart, FiDollarSign, FiEdit2, FiCheck, FiX, FiActivity } from "react-icons/fi";

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
  
  // Dynamic Health Score logic
  let score = 100;
  
  // 1. Budget Usage penalty
  const usageRatio = budget > 0 ? totalSpend / budget : 0;
  if (usageRatio > 1.0) {
    score -= 40; // over budget
    const overspendSeverity = Math.min(20, Math.round((usageRatio - 1.0) * 40));
    score -= overspendSeverity;
  } else if (usageRatio > 0.8) {
    score -= 20;
  } else if (usageRatio > 0.5) {
    score -= 10;
  }
  
  // 2. Imbalance penalty
  if (highestCategoryPercent > 70) {
    score -= 25;
  } else if (highestCategoryPercent > 50) {
    score -= 15;
  }
  
  // Clamp score
  score = Math.max(5, Math.min(100, score));
  
  let healthStatus = "Outstanding";
  let healthColor = "text-[#22C55E]"; // Success green
  let healthBarBg = "bg-[#22C55E]";
  
  if (score < 30) {
    healthStatus = "Poor";
    healthColor = "text-[#EF4444]";
    healthBarBg = "bg-[#EF4444]";
  } else if (score < 60) {
    healthStatus = "Good";
    healthColor = "text-yellow-400";
    healthBarBg = "bg-yellow-400";
  } else if (score < 80) {
    healthStatus = "Excellent";
    healthColor = "text-purple-400";
    healthBarBg = "bg-purple-400";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full bg-[#16161A] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden ${
        disabled ? "opacity-35 pointer-events-none" : ""
      }`}
    >
      {/* Background Glow */}
      <div className="absolute right-0 top-0 h-48 w-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-4 border-b border-white/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#A855F7] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              AI Buddy
            </span>
            <span className="text-xs text-[#9CA3AF] font-semibold">Active Assistant</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Insights & Spending Health
          </h2>
        </div>

        {/* Health Score display */}
        <div className="flex items-center gap-4 bg-[#0F0F11] border border-white/5 rounded-xl px-4 py-2.5 min-w-[200px]">
          <FiActivity className={`h-5 w-5 ${healthColor}`} />
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-[#9CA3AF]">Health Score</span>
              <span className={healthColor}>{score}</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full ${healthBarBg}`}
              />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${healthColor}`}>
              Status: {healthStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Insight message */}
      <div className="py-5 text-sm text-[#9CA3AF] leading-relaxed max-w-3xl">
        {totalSpend > 0 ? (
          <p>
            You've spent <span className="text-white font-semibold">{formatCurrency(highestCategorySpend)}</span> on <span className="text-primary font-semibold">{highestCategory}</span>. 
            That's <span className="text-white font-semibold">{highestCategoryPercent}%</span> of your total spending.
            {spendMoreOnWeekends ? (
              <span> You spent more on weekends (<span className="text-white font-semibold">{weekendPercent}%</span>).</span>
            ) : (
              <span> You spent more on weekdays.</span>
            )}
            {" "}Would you like to adjust your monthly budget limits?
          </p>
        ) : (
          <p>
            Welcome! I don't see any transaction records for this month yet. 
            Add your expenses below to begin calculating your spending health metrics!
          </p>
        )}
      </div>

      {/* Budget edit inputs */}
      <AnimatePresence>
        {isEditingBudget && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pb-4 flex items-center gap-3"
          >
            <div className="relative max-w-[150px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-[#9CA3AF]">
                ₹
              </span>
              <input
                type="number"
                value={newBudgetVal}
                onChange={(e) => setNewBudgetVal(e.target.value)}
                className="w-full bg-[#0F0F11] border border-white/10 rounded-xl pl-6 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
                placeholder="Budget limit"
              />
            </div>
            <button
              onClick={handleSaveBudget}
              disabled={isSavingBudget}
              className="p-2 bg-primary hover:bg-[#b56ef8] text-white rounded-lg transition-colors flex items-center justify-center"
              title="Save"
            >
              <FiCheck className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setIsEditingBudget(false);
                setNewBudgetVal(budget);
              }}
              className="p-2 bg-white/5 hover:bg-white/10 text-[#9CA3AF] hover:text-white rounded-lg transition-colors flex items-center justify-center"
              title="Cancel"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button CTAs */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={() => {
            setNewBudgetVal(budget);
            setIsEditingBudget(true);
          }}
          className="inline-flex items-center gap-1.5 bg-[#A855F7]/10 hover:bg-[#A855F7]/15 border border-[#A855F7]/25 text-[#A855F7] px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
        >
          <FiEdit2 className="h-3.5 w-3.5" />
          Set Budget
        </button>
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-[#9CA3AF] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
        >
          <FiPieChart className="h-3.5 w-3.5" />
          {showAnalysis ? "Hide Analysis" : "Show Analysis"}
        </button>
        <button
          onClick={onIgnore}
          className="inline-flex items-center gap-1.5 text-[#9CA3AF]/60 hover:text-danger px-4 py-2 text-xs font-bold transition-colors duration-200 ml-auto"
        >
          Ignore
        </button>
      </div>

      {/* Analysis Expansion */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mt-6 border-t border-white/[0.04]">
              {/* Item 1 */}
              <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>Highest Category</span>
                  <FiPieChart className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-sm font-bold text-white truncate">{highestCategory}</div>
                <div className="text-[10px] text-[#9CA3AF]">
                  {formatCurrency(highestCategorySpend)} ({highestCategoryPercent}%)
                </div>
              </div>

              {/* Item 2 */}
              <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>Weekend Spending</span>
                  <FiCalendar className="h-3.5 w-3.5 text-success" />
                </div>
                <div className="text-sm font-bold text-white">
                  {formatCurrency(weekendSpend)}
                </div>
                <div className="text-[10px] text-[#9CA3AF]">
                  {weekendPercent}% of monthly total
                </div>
              </div>

              {/* Item 3 */}
              <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>Daily Average</span>
                  <FiTrendingUp className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div className="text-sm font-bold text-white">
                  {formatCurrency(averageDailySpend)}
                </div>
                <div className="text-[10px] text-[#9CA3AF]">
                  Over {activeDaysCount} active transaction days
                </div>
              </div>

              {/* Item 4 */}
              <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>Remaining Budget</span>
                  <FiDollarSign className="h-3.5 w-3.5 text-yellow-400" />
                </div>
                <div className="text-sm font-bold text-white">
                  {formatCurrency(Math.max(0, budget - totalSpend))}
                </div>
                <div className="text-[10px] text-[#9CA3AF]">
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
