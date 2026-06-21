import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiActivity,
  FiTrendingUp,
  FiCalendar,
  FiDollarSign,
  FiPieChart,
  FiZap,
  FiArrowUpRight,
  FiArrowDownRight,
  FiPercent
} from "react-icons/fi";

import { getAnalyticsSummary, getAnalyticsTrends } from "../api/analytics";
import { getCurrentBudget } from "../api/budget";
import { getExpenses } from "../api/expenses";

// Reusable Sub-components
import ChartCard from "../components/analytics/ChartCard";
import KPICard from "../components/analytics/KPICard";
import EmptyAnalytics from "../components/analytics/EmptyAnalytics";
import MonthlySpendingChart from "../components/analytics/MonthlySpendingChart";
import CategoryPieChart from "../components/analytics/CategoryPieChart";
import LoadingChartSkeleton from "../components/analytics/LoadingChartSkeleton";

// Day 10 New Sub-components
import DateRangePicker from "../components/analytics/DateRangePicker";
import ComparisonBadge from "../components/analytics/ComparisonBadge";
import TrendLineChart from "../components/analytics/TrendLineChart";

// Currency Formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  
  // Data States
  const [summaryData, setSummaryData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [budget, setBudget] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([]);

  // Date Range Picker States
  const [selectedRange, setSelectedRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSummaryAndInitialTrends = async () => {
    setLoading(true);
    setErrorState(false);
    try {
      const [summary, budgetInfo, trends, expenses] = await Promise.all([
        getAnalyticsSummary(),
        getCurrentBudget(),
        getAnalyticsTrends({ range: "30d" }),
        getExpenses()
      ]);
      setSummaryData(summary);
      setBudget(budgetInfo.exists ? budgetInfo.monthly_budget : 0);
      setTrendsData(trends);
      setRecentExpenses(expenses.slice(0, 5));
    } catch (err) {
      console.error("Failed to load analytics dashboard data:", err);
      if (err.response && err.response.status === 404) {
        setSummaryData(null);
      } else {
        setErrorState(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendsData = async (range, start, end) => {
    setTrendsLoading(true);
    try {
      const params = { range };
      if (start) params.start_date = start;
      if (end) params.end_date = end;
      
      const trends = await getAnalyticsTrends(params);
      setTrendsData(trends);
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryAndInitialTrends();
  }, []);

  const handleRangeChange = async (range, start, end) => {
    setSelectedRange(range);
    setStartDate(start);
    setEndDate(end);
    await fetchTrendsData(range, start, end);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F11] text-white px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <LoadingChartSkeleton />
        </div>
      </div>
    );
  }

  // Error boundary or fetch failure
  if (errorState) {
    return (
      <div className="min-h-screen bg-[#0F0F11] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#16161A] border border-white/5 rounded-xl2 p-8 shadow-2xl text-center space-y-6">
          <div>
            <span className="text-5xl block pb-2">⚠️</span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Failed to load analytics
            </h2>
            <p className="text-sm text-[#9CA3AF] font-medium mt-2 leading-relaxed">
              We encountered a network error while fetching your analytical reports.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchSummaryAndInitialTrends}
            className="w-full bg-[#A855F7] hover:bg-[#b56ef8] text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-primary/20 transition-all duration-200"
          >
            Retry Connection
          </motion.button>
        </div>
      </div>
    );
  }

  // If no data exists or total spent is zero, render empty state
  if (!summaryData || summaryData.expense_count === 0) {
    return (
      <div className="min-h-screen bg-[#0F0F11] text-white px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-between">
        <div className="max-w-6xl mx-auto w-full space-y-8 flex-grow">
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
                Analytics Report
              </h1>
              <p className="text-sm text-[#9CA3AF] mt-1 font-medium">
                Premium AI financial reports and insights.
              </p>
            </div>
          </header>
          
          <div className="py-12">
            <EmptyAnalytics />
          </div>
        </div>
      </div>
    );
  }

  // Hero Card "This Month" spending metrics (using summaryData for backward compatibility)
  const currentMonthData = summaryData.monthly_summary.find((m) => m.is_current_month) || {
    total_spent: 0,
    expense_count: 0,
    average_expense: 0
  };

  const isOverBudget = currentMonthData.total_spent > budget;
  const budgetUsagePercent = budget > 0 ? Math.min(100, (currentMonthData.total_spent / budget) * 100) : 0;
  const remainingBudget = Math.max(0, budget - currentMonthData.total_spent);

  // Dynamic AI Insight sentences based on range metrics
  const getAIAdviceList = () => {
    const list = [];
    
    // Top category insight for selected range
    const rangeCategories = trendsData?.category_breakdown || [];
    if (rangeCategories.length > 0) {
      const top = rangeCategories[0];
      list.push(
        `Your highest spending in this range is on **${top.category}**, representing **${Math.round(top.percentage)}%** (totaling ${formatCurrency(top.total)}) of your expenses.`
      );
    }
    
    // Budget usage insight
    if (budget > 0) {
      if (isOverBudget) {
        list.push(
          `Alert: You have exceeded your set monthly budget by **${formatCurrency(currentMonthData.total_spent - budget)}**. Consider review category details to trim down spending.`
        );
      } else {
        list.push(
          `Great job! You have utilized **${Math.round(budgetUsagePercent)}%** of your budget, leaving **${formatCurrency(remainingBudget)}** in safe spending buffer.`
        );
      }
    }
    
    // WoW trends insight
    if (trendsData?.week_over_week !== 0 && trendsData?.week_over_week !== undefined) {
      const isIncrease = trendsData.week_over_week > 0;
      list.push(
        `Week-over-Week spending is **${Math.abs(trendsData.week_over_week).toFixed(1)}%** ${
          isIncrease ? "higher" : "lower"
        } compared to the previous 7-day period.`
      );
    }
    
    // Fallback if empty list
    if (list.length === 0) {
      list.push("Consistent spending patterns observed across active categories.");
    }
    
    return list;
  };

  const aiInsights = getAIAdviceList();

  // Dynamic range label for tooltips and text descriptions
  const getRangeText = () => {
    if (selectedRange === "7d") return "Last 7 Days";
    if (selectedRange === "30d") return "Last 30 Days";
    if (selectedRange === "90d") return "Last 90 Days";
    return "Custom Range";
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white px-4 sm:px-6 lg:px-8 py-8 pb-24 select-none font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2.5 bg-[#16161A] border border-white/5 hover:border-white/10 text-[#9CA3AF] hover:text-white rounded-xl transition-all duration-200"
              title="Back to Dashboard"
            >
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Analytics Report
              </h1>
              <p className="text-sm text-[#9CA3AF] mt-1 font-medium">
                Premium AI financial reports and insights.
              </p>
            </div>
          </div>
          
          {/* DATE RANGE PICKER */}
          <DateRangePicker 
            selectedRange={selectedRange} 
            onRangeChange={handleRangeChange} 
            startDate={startDate} 
            endDate={endDate} 
          />
        </header>

        {/* THIS MONTH HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#16161A] border border-white/5 rounded-xl2 p-6 transition-all duration-300 hover:border-white/10 relative overflow-hidden"
        >
          {/* soft background glow */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#A855F7]/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.03] pb-4 mb-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]">
                This Month Spend
              </p>
              <h2 className="text-4xl font-extrabold text-white tracking-tight mt-1">
                {formatCurrency(currentMonthData.total_spent)}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {budget > 0 && (
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border ${
                    isOverBudget
                      ? "text-danger bg-danger/10 border-danger/20"
                      : "text-success bg-success/10 border-success/20"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOverBudget ? "bg-danger" : "bg-success"}`} />
                  {isOverBudget ? "Over Budget" : "Safe Spending Zone"}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {budget > 0 ? (
              <>
                <div className="flex justify-between text-xs text-[#9CA3AF] font-medium">
                  <span>Limit: {formatCurrency(budget)}</span>
                  <span>Remaining: {formatCurrency(remainingBudget)}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-[#0F0F11] rounded-full overflow-hidden border border-white/[0.02]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetUsagePercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${isOverBudget ? "bg-danger" : "bg-gradient-to-r from-[#6B21A8] to-[#A855F7]"}`}
                  />
                </div>
                <div className="text-[10px] font-extrabold text-[#9CA3AF]/60">
                  {Math.round(budgetUsagePercent)}% of budget utilized
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center bg-[#0F0F11]/60 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-[#9CA3AF] font-medium">
                  No limit set for this month. Set budget on the dashboard page.
                </span>
                <Link
                  to="/dashboard"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 shrink-0"
                >
                  Set Budget
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* 6 KPI CARDS GRID */}
        <div className="relative">
          {trendsLoading && (
            <div className="absolute inset-0 bg-[#0F0F11]/40 backdrop-blur-[1px] z-20 rounded-2xl flex items-center justify-center" />
          )}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {/* KPI 1: TOTAL SPEND */}
            <KPICard
              title="Total Spend"
              value={formatCurrency(trendsData?.total_spent || 0)}
              icon={FiDollarSign}
              delay={0.05}
              description="Compared to previous period"
            >
              <ComparisonBadge value={trendsData?.month_over_month} label="MoM" />
            </KPICard>

            {/* KPI 2: AVERAGE DAILY */}
            <KPICard
              title="Avg Daily"
              value={formatCurrency(trendsData?.average_daily_spend || 0)}
              icon={FiActivity}
              delay={0.1}
              description={getRangeText()}
            >
              <ComparisonBadge value={trendsData?.week_over_week} label="WoW" />
            </KPICard>

            {/* KPI 3: TOP CATEGORY */}
            <KPICard
              title="Top Category"
              value={trendsData?.category_breakdown?.[0]?.category || "N/A"}
              icon={FiTrendingUp}
              delay={0.15}
              description="Highest contribution category"
            >
              {trendsData?.category_breakdown?.[0] && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A855F7]/12 text-[#A855F7] border border-[#A855F7]/20">
                    {Math.round(trendsData.category_breakdown[0].percentage)}% of Spend
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] font-medium">
                    ({formatCurrency(trendsData.category_breakdown[0].total)})
                  </span>
                </div>
              )}
            </KPICard>

            {/* KPI 4: HIGHEST MONTH */}
            <KPICard
              title="Highest Month"
              value={summaryData?.highest_month ? `${summaryData.highest_month.month} '${String(summaryData.highest_month.year).slice(-2)}` : "N/A"}
              icon={FiCalendar}
              delay={0.2}
              description="All-time high spend month"
            >
              {summaryData?.highest_month && (
                <div className="text-[10px] text-[#9CA3AF] font-medium tracking-wide mt-2">
                  Peak Spent: <span className="text-[#A855F7] font-bold">{formatCurrency(summaryData.highest_month.amount)}</span>
                </div>
              )}
            </KPICard>

            {/* KPI 5: MONTHLY CHANGE */}
            <KPICard
              title="Monthly Change"
              value={summaryData?.monthly_change_percentage !== undefined ? `${summaryData.monthly_change_percentage > 0 ? "↑" : "↓"} ${Math.abs(summaryData.monthly_change_percentage).toFixed(1)}%` : "N/A"}
              icon={FiPercent}
              delay={0.25}
              description="Latest month-over-month rate"
            >
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    summaryData?.monthly_change_percentage > 0
                      ? "text-danger bg-danger/10 border-danger/20"
                      : "text-success bg-success/10 border-success/20"
                  }`}
                >
                  {summaryData?.monthly_change_percentage > 0 ? "Expense Increase" : "Savings Gain"}
                </span>
              </div>
            </KPICard>

            {/* KPI 6: SAVINGS RATE */}
            <KPICard
              title="Savings Rate"
              value={summaryData?.savings_rate !== undefined ? `${summaryData.savings_rate}%` : "0%"}
              icon={FiPieChart}
              delay={0.3}
              description="Of set monthly budget"
            >
              <div className="w-full h-1.5 bg-[#0F0F11] rounded-full overflow-hidden mt-3 border border-white/[0.02]">
                <div 
                  className="h-full bg-gradient-to-r from-[#6B21A8] to-[#A855F7] rounded-full"
                  style={{ width: `${summaryData?.savings_rate || 0}%` }}
                />
              </div>
            </KPICard>
          </motion.div>
        </div>

        {/* TREND LINE CHART WITH PREVIOUS OVERLAY */}
        <div className="relative">
          {trendsLoading && (
            <div className="absolute inset-0 bg-[#0F0F11]/45 backdrop-blur-[1px] z-20 rounded-2xl flex items-center justify-center" />
          )}
          <ChartCard
            title={`Spending Trends (${getRangeText()})`}
            subtitle="Current Period (solid purple) vs Previous Period of equal length (dashed purple)"
          >
            <TrendLineChart data={trendsData?.trend_chart || []} />
          </ChartCard>
        </div>

        {/* OTHER CHARTS: MONTHLY BAR & CATEGORY PIE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Monthly Spending */}
          <ChartCard
            title="6-Month Overview"
            subtitle="Calendar spending overview across the last 6 months"
          >
            <MonthlySpendingChart data={summaryData?.monthly_summary || []} />
          </ChartCard>

          {/* Category Distribution */}
          <ChartCard
            title={`Category Distribution (${getRangeText()})`}
            subtitle="Spend percentage breakdown by active categories"
          >
            <CategoryPieChart 
              data={trendsData?.category_breakdown?.length > 0 ? trendsData.category_breakdown : (summaryData?.category_breakdown || [])} 
            />
          </ChartCard>
        </div>

        {/* AI INSIGHTS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-[#16161A] border border-white/5 rounded-xl2 p-6 transition-all duration-300 hover:border-white/10 relative overflow-hidden"
        >
          {/* subtle glow */}
          <div className="absolute left-0 bottom-0 w-48 h-48 bg-[#A855F7]/3 rounded-full blur-[50px] pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4">
            <FiZap className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-wide uppercase font-sans">
              AI Buddy Insights
            </h3>
          </div>

          <div className="space-y-4">
            {aiInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-sm text-[#9CA3AF] leading-relaxed font-medium bg-[#0F0F11]/45 p-3.5 rounded-xl border border-white/[0.02]"
              >
                <span className="text-[#A855F7] shrink-0 mt-0.5">✦</span>
                <p
                  dangerouslySetInnerHTML={{
                    __html: insight
                      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-extrabold'>$1</strong>")
                  }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* EXPENSE HISTORY */}
        <div className="bg-[#16161A] border border-white/5 rounded-xl2 p-6 transition-all duration-300 hover:border-white/10 relative overflow-hidden">
          <h3 className="text-base font-bold text-white tracking-wide uppercase mb-4">
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center bg-[#0F0F11]/60 p-3.5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <div>
                    <p className="text-sm font-semibold text-white">{exp.title || exp.description}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#A855F7]">{formatCurrency(exp.amount)}</p>
                    <span className="inline-block text-[9px] font-extrabold uppercase bg-[#A855F7]/10 px-2 py-0.5 rounded-full text-[#A855F7] border border-[#A855F7]/10 mt-1">
                      {exp.category}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#9CA3AF]">No recent transactions found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
