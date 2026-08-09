import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiPlus, FiChevronDown } from "react-icons/fi";

import { getCalendarHeatmap, getSpendingPattern } from "../services/insights/insightsService";
import { getAnalyticsSummary } from "../services/analytics/analyticsService";
import { getExpenses } from "../services/api/expenses";
import { getCategoryIcon } from "../constants/categories";
import { useCategoryStore } from "../store/categoryStore";
import CalendarHeatmap from "../components/analytics/CalendarHeatmap";
import KPICard from "../components/analytics/KPICard";
import SidebarToggle from "../components/layout/SidebarToggle";

export default function HeatmapPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [calendarData, setCalendarData] = useState([]);
  const [spendingPattern, setSpendingPattern] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expandedMonth, setExpandedMonth] = useState(null);

  const { categories, fetchCategories } = useCategoryStore();

  const loadHeatmapData = async () => {
    setLoading(true);
    try {
      const [calendar, pattern, summaryData, expList] = await Promise.all([
        getCalendarHeatmap(),
        getSpendingPattern(),
        getAnalyticsSummary(),
        getExpenses(),
        fetchCategories()
      ]);
      setCalendarData(calendar.heatmap);
      setSpendingPattern(pattern);
      setSummary(summaryData);
      setExpenses(expList);
    } catch (err) {
      console.error("Failed to load heatmap page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmapData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-8 space-y-8 select-none font-sans max-w-[1440px] mx-auto pb-16 relative">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <h1 className="text-[32px] font-bold tracking-tight text-textPrimary font-heading">
            Spending Heatmap
          </h1>
        </div>
        <p className="text-sm font-medium text-textSecondary">
          Annual transaction calendar, frequency metrics, and daily trends.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* KPI 1: Most Active Day */}
        <KPICard
          title="📆 MOST ACTIVE DAY"
          value={spendingPattern?.most_active_day || "N/A"}
          delay={0.05}
          description="Peak transaction frequency day"
        />

        {/* KPI 2: Most Active Hour */}
        <KPICard
          title="⏰ MOST ACTIVE HOUR"
          value={spendingPattern?.most_active_hour !== undefined ? `${String(spendingPattern.most_active_hour).padStart(2, "0")}:00` : "N/A"}
          delay={0.1}
          description="Peak transaction time of day"
        />
      </div>

      {/* 365-DAY CALENDAR HEATMAP CONTAINER */}
      <div className="bg-surface border border-border rounded-card p-7 shadow-sm" id="calendar-heatmap-wrapper">
        <div className="mb-6">
          <h3 className="text-[12px] font-semibold text-textSecondary tracking-wider uppercase">Yearly Contribution Graph</h3>
          <p className="text-xs text-textSecondary mt-1 font-medium">Visual contribution grid of spending frequency and intensity.</p>
        </div>
        
        <div className="w-full overflow-x-auto">
          <div className="min-w-[720px]">
            <CalendarHeatmap data={calendarData} />
          </div>
        </div>
      </div>

      {/* MONTHLY ACTIVITY LIST ACCORDION */}
      <div className="bg-surface border border-border rounded-card p-7 shadow-sm">
        <div className="mb-6">
          <h3 className="text-[12px] font-semibold text-textSecondary tracking-wider uppercase">Monthly Activity List</h3>
          <p className="text-xs text-textSecondary mt-1 font-medium">Spending totals summarized by calendar month.</p>
        </div>

        {summary?.monthly_summary && summary.monthly_summary.length > 0 ? (
          <div className="space-y-4">
            {summary.monthly_summary.map((item, idx) => {
              const monthKey = `${item.month_name} ${item.year}`;
              const isExpanded = expandedMonth === monthKey;
              
              // Filter transactions for this month
              const monthExpenses = expenses.filter(e => {
                const date = new Date(e.date);
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return monthNames[date.getMonth()] === item.month_name && date.getFullYear() === item.year;
              });

              return (
                <div key={idx} className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
                  {/* Clickable Header */}
                  <button
                    onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                    className="w-full flex justify-between items-center p-5 hover:bg-hoverAccent transition-all duration-150 select-none text-left cursor-pointer border-none bg-transparent focus:outline-none"
                  >
                    <div>
                      <span className="text-[16px] font-bold text-textPrimary">{item.month_name} {item.year}</span>
                      <span className="text-xs font-semibold text-textSecondary block mt-0.5">{monthExpenses.length || item.expense_count} Transactions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] font-extrabold text-primary font-sans">{formatCurrency(item.total_spent)}</span>
                      <FiChevronDown className="text-textSecondary text-base font-bold transition-transform duration-150" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </div>
                  </button>

                  {/* Collapse Content */}
                  {isExpanded && (
                    <div className="border-t border-border bg-surface p-5 space-y-3">
                      {monthExpenses.length > 0 ? (
                        monthExpenses.map((exp) => {
                          const catObj = categories.find(c => c.id === exp.category_id);
                          const catName = catObj ? catObj.name : "Others";
                          const IconComponent = getCategoryIcon(catObj ? catObj.icon_key : "others");
                          return (
                            <div key={exp.id} className="flex justify-between items-center bg-background border border-border rounded-xl p-3.5 shadow-sm hover:bg-hoverAccent transition-all duration-150">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-textSecondary font-sans shrink-0">
                                  {new Date(exp.date).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                                </span>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border text-textSecondary shrink-0">
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-textPrimary">{exp.description || exp.title}</p>
                                  <span className="text-[10px] text-textSecondary font-semibold uppercase tracking-wider">{catName}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-textPrimary">{formatCurrency(exp.amount)}</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-textSecondary italic py-2 text-center">No transaction records found for this month.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-textSecondary py-6 text-center font-sans">No monthly summaries computed.</div>
        )}
      </div>

      {/* Floating Add Expense Sticky Button redirects to home to add */}
      <div className="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-3.5 bg-primary hover:bg-primaryHover text-white font-bold rounded-full shadow-md transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <FiPlus className="h-5 w-5" />
          <span>Add Expense</span>
        </button>
      </div>

    </div>
  );
}
