import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrendingUp, FiActivity, FiX, FiCheck, FiPlus, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import SidebarToggle from "../components/layout/SidebarToggle";
import AIBuddyCard from "../components/ai/AIBuddyCard";

import {
  getSpendingPattern,
  getAISummary,
  createCategoryBudget
} from "../services/insights/insightsService";
import { getExpenses } from "../services/api/expenses";
import { getCurrentBudget, updateCurrentBudget } from "../services/budgets/budgetService";

export default function AIBuddyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [spendingPattern, setSpendingPattern] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(10000);
  
  const [appliedIndices, setAppliedIndices] = useState([]);
  const [ignoredIndices, setIgnoredIndices] = useState([]);
  const [isAdvisorIgnored, setIsAdvisorIgnored] = useState(false);

  const loadAIData = async () => {
    setLoading(true);
    try {
      const [pattern, summary, expList, currentBudget] = await Promise.all([
        getSpendingPattern(),
        getAISummary(),
        getExpenses(),
        getCurrentBudget()
      ]);
      setSpendingPattern(pattern);
      setAiSummary(summary);
      setExpenses(expList);
      if (currentBudget && currentBudget.monthly_budget !== undefined) {
        setBudget(currentBudget.monthly_budget);
      }
    } catch (err) {
      console.error("Failed to load AI Buddy page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAIData();
  }, []);

  const handleUpdateBudget = async (newBudget) => {
    try {
      await updateCurrentBudget(newBudget);
      setBudget(newBudget);
      toast.success(`Main budget set to ₹${newBudget.toLocaleString()}`, { theme: "light" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update main budget.", { theme: "light" });
    }
  };

  const handleSetCategoryBudget = async (category, amount, idx) => {
    try {
      await createCategoryBudget(category, amount);
      toast.success(`Set budget of ₹${amount.toLocaleString()} for ${category}!`, { theme: "light" });
      setAppliedIndices((prev) => [...prev, idx]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to set category budget.", { theme: "light" });
    }
  };

  const handleIgnore = (idx) => {
    toast.info("Insight dismissed.", { theme: "light" });
    setIgnoredIndices((prev) => [...prev, idx]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <div className="text-xs text-textSecondary font-bold uppercase tracking-widest animate-pulse font-sans">
          Loading AI Insights...
        </div>
      </div>
    );
  }

  const insights = [
    {
      id: 0,
      type: "Overspending Alert",
      badge: "⚠",
      text: aiSummary?.overspending_detected 
        ? aiSummary.message 
        : `Food spending increased by 20%`,
      category: aiSummary?.top_category || "Food",
      budgetAmount: aiSummary?.recommended_saving ? Math.round(aiSummary.recommended_saving) : 3500,
      actionLabel: "Set Budget",
      hasBudgetAction: true,
    },
    {
      id: 1,
      type: "Savings Suggestion",
      badge: "💡",
      text: `You can save ₹${aiSummary?.recommended_saving ? Math.round(aiSummary.recommended_saving).toLocaleString() : "1,200"} monthly by optimizing subscriptions`,
      category: "Savings",
      budgetAmount: aiSummary?.recommended_saving ? Math.round(aiSummary.recommended_saving) : 1200,
      actionLabel: "View Plan",
      hasBudgetAction: true,
    },
    {
      id: 2,
      type: "Achieved Goal",
      badge: "✓",
      text: "Entertainment spending reduced by 15% this week. Good job keeping your goals!",
      hasBudgetAction: false,
    }
  ];

  // Filter out ignored ones
  const activeInsights = insights.filter((item) => !ignoredIndices.includes(item.id));

  return (
    <div className="p-8 space-y-8 select-none font-sans max-w-[1440px] mx-auto pb-16 relative">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <h1 className="text-[32px] font-bold tracking-tight text-textPrimary font-heading">
            AI Insights
          </h1>
        </div>
        <p className="text-sm font-medium text-textSecondary">
          Personalized financial observations and recommendations.
        </p>
      </div>

      {/* Main Advisor Card */}
      {!isAdvisorIgnored && (
        <AIBuddyCard 
          expenses={expenses}
          budget={budget}
          onUpdateBudget={handleUpdateBudget}
          onIgnore={() => {
            setIsAdvisorIgnored(true);
            toast.info("Advisor card dismissed.", { theme: "light" });
          }}
        />
      )}

      {/* Observation suggestions list */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-textSecondary uppercase tracking-wider">
          More Recommendations
        </h3>
        
        {activeInsights.length > 0 ? (
          activeInsights.map((insight) => {
            const isApplied = appliedIndices.includes(insight.id);
            return (
              <div 
                key={insight.id}
                className="bg-surface border border-border rounded-card p-7 shadow-sm hover:scale-[1.005] transition-all duration-150 flex flex-col sm:flex-row justify-between sm:items-center gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-lg font-bold text-textSecondary bg-background border border-border">
                    {insight.badge}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-textSecondary">
                      {insight.type}
                    </p>
                    <p className="text-sm font-medium text-textPrimary leading-relaxed">
                      {insight.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  {insight.hasBudgetAction && !isApplied && (
                    <button
                      onClick={() => handleSetCategoryBudget(insight.category, insight.budgetAmount, insight.id)}
                      className="h-10 px-5 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {insight.actionLabel}
                    </button>
                  )}

                  {isApplied && (
                    <span className="bg-success/5 border border-success/15 text-success px-3.5 py-1.5 rounded-xl text-xs font-bold">
                      Applied
                    </span>
                  )}

                  {insight.hasBudgetAction && !isApplied && (
                    <button
                      onClick={() => handleIgnore(insight.id)}
                      className="text-xs text-textMuted hover:text-danger font-bold cursor-pointer bg-transparent border-none p-1 focus:outline-none"
                    >
                      Ignore
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-surface border border-border rounded-card p-8 text-center text-sm text-textSecondary shadow-sm">
            No new observations or suggestions at this time.
          </div>
        )}
      </div>
    </div>
  );
}
