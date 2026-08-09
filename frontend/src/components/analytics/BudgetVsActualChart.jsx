import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { FiPlus, FiCheck } from "react-icons/fi";
import { createCategoryBudget } from "../../services/budgets/budgetService";
import { toast } from "react-toastify";

const DEFAULT_CATEGORIES = ["Food", "Shopping", "Entertainment", "Bills", "Travel", "Others"];

export default function BudgetVsActualChart({ report, onRefresh }) {
  const [showConfig, setShowConfig] = useState(false);
  const [selectedCat, setSelectedCat] = useState("Food");
  const [budgetVal, setBudgetVal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasBudgets = report?.has_budgets;
  const items = report?.items || [];

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const amount = parseFloat(budgetVal);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid budget amount.", { theme: "light" });
      return;
    }
    setIsSubmitting(true);
    try {
      await createCategoryBudget(selectedCat, amount);
      toast.success(`Set budget of ₹${amount.toLocaleString()} for ${selectedCat}`, { theme: "light" });
      setBudgetVal("");
      setShowConfig(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to set category budget.", { theme: "light" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Custom Tooltip component matching theme
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border p-3 rounded-xl shadow-md space-y-1 select-none pointer-events-none">
          <p className="text-xs font-extrabold text-textPrimary tracking-wide uppercase">
            {data.category}
          </p>
          <p className="text-xs font-semibold text-textSecondary">
            Budget: <span className="text-success font-bold">{formatCurrency(data.budget)}</span>
          </p>
          <p className="text-xs font-semibold text-textSecondary">
            Actual: <span className={`${data.status === "overspent" ? "text-danger" : "text-primary"} font-bold`}>{formatCurrency(data.actual)}</span>
          </p>
          <p className="text-[10px] font-extrabold tracking-widest text-textSecondary uppercase mt-1">
            {data.status === "overspent"
              ? `${formatCurrency(Math.abs(data.remaining))} Over limit (${Math.round(data.percentage_used)}%)`
              : `${formatCurrency(data.remaining)} Remaining (${Math.round(data.percentage_used)}% used)`
            }
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-textSecondary">
          Budget Status
        </span>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-surface hover:bg-hoverAccent border border-border text-primary text-xs font-bold transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <FiPlus className="h-3.5 w-3.5" />
          {showConfig ? "Close" : "Configure Limit"}
        </button>
      </div>

      {/* Configure inline form */}
      {showConfig && (
        <form onSubmit={handleSaveBudget} className="bg-background border border-border p-5 rounded-card space-y-4 font-sans">
          <p className="text-xs font-bold text-textPrimary tracking-wide">Configure Category Budget</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-textSecondary">Category</label>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-textSecondary">Limit (₹)</label>
              <input
                type="number"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                placeholder="Limit amount"
                required
                className="w-full bg-surface border border-border focus:border-primary rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-primary hover:bg-primaryHover text-white rounded-[14px] text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {isSubmitting ? "Saving..." : <><FiCheck /> Save Budget</>}
          </button>
        </form>
      )}

      {/* Empty State vs Chart Content */}
      {!hasBudgets ? (
        <div className="bg-surface border border-border p-8 rounded-card text-center space-y-4 flex flex-col items-center justify-center min-h-[220px] font-sans shadow-sm">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="text-sm font-bold text-textPrimary">No budgets configured yet</p>
            <p className="text-xs text-textSecondary mt-1 leading-relaxed">
              Set category spending limits to track and control your monthly expenses visually.
            </p>
          </div>
          {!showConfig && (
            <button
              onClick={() => setShowConfig(true)}
              className="h-11 px-5 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-[14px] shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              Create Budget
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={items}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="category"
                stroke="#9CA3AF"
                fontSize={10}
                fontWeight="500"
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={10}
                fontWeight="500"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
                dx={-8}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(91, 76, 240, 0.03)" }} />
              {/* Budget Bar */}
              <Bar dataKey="budget" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={24} />
              {/* Actual Bar with Conditional Red fill if over budget */}
              <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={24}>
                {items.map((entry, index) => {
                  const isOver = entry.status === "overspent";
                  return <Cell key={`cell-${index}`} fill={isOver ? "#DC2626" : "#5B4CF0"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
