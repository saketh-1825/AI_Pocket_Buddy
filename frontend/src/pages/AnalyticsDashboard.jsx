import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiMoreVertical
} from "react-icons/fi";

import { getAnalyticsSummary, getAnalyticsTrends } from "../services/analytics/analyticsService";
import { getAISummary } from "../services/insights/insightsService";
import { getCurrentBudget } from "../services/budgets/budgetService";

import { exportAsPNG } from "../utils/exportAsPNG";
import SidebarToggle from "../components/layout/SidebarToggle";

// Reusable Sub-components
import ChartCard from "../components/analytics/ChartCard";
import KPICard from "../components/analytics/KPICard";
import EmptyAnalytics from "../components/analytics/EmptyAnalytics";
import MonthlySpendingChart from "../components/analytics/MonthlySpendingChart";
import CategoryPieChart from "../components/analytics/CategoryPieChart";
import LoadingChartSkeleton from "../components/analytics/LoadingChartSkeleton";

// Sub-components
import DateRangePicker from "../components/analytics/DateRangePicker";
import ComparisonBadge from "../components/analytics/ComparisonBadge";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [errorState, setErrorState] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  
  // Data States
  const [summaryData, setSummaryData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [budget, setBudget] = useState(0);
  const [aiSummary, setAiSummary] = useState(null);

  // Date Range Picker States
  const [selectedRange, setSelectedRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchSummaryAndInitialTrends = async () => {
    setLoading(true);
    setErrorState(false);
    try {
      const [summary, budgetInfo, trends, aiInfo] = await Promise.all([
        getAnalyticsSummary(),
        getCurrentBudget(),
        getAnalyticsTrends({ range: "30d" }),
        getAISummary()
      ]);
      setSummaryData(summary);
      setBudget(budgetInfo.exists ? budgetInfo.monthly_budget : 0);
      setTrendsData(trends);
      setAiSummary(aiInfo);
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
      <div className="w-full">
        <LoadingChartSkeleton />
      </div>
    );
  }

  // Error boundary or fetch failure
  if (errorState) {
    return (
      <div className="flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-md bg-surface border border-default rounded-dialog p-8 shadow-md text-center space-y-6">
          <div>
            <span className="text-5xl block pb-2">⚠️</span>
            <h2 className="text-xl font-bold text-[#111827] tracking-wide">
              Failed to load analytics
            </h2>
            <p className="text-sm text-[#6B7280] font-medium mt-2 leading-relaxed">
              We encountered a network error while fetching your analytical reports.
            </p>
          </div>
          <button
            onClick={fetchSummaryAndInitialTrends}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl py-3 text-sm font-bold shadow-sm transition-all duration-200 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // If no data exists or total spent is zero, render empty state
  if (!summaryData || summaryData.expense_count === 0) {
    return (
      <div className="w-full space-y-8 flex-grow">
        {/* Header */}
        <header className="flex items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <Link
            to="/"
            className="p-2.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#6B7280] hover:text-[#111827] rounded-xl transition-all duration-200"
            title="Back to Dashboard"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <SidebarToggle />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111827]">
              Analytics Report
            </h1>
            <p className="text-sm text-[#6B7280] mt-1 font-medium">
              Premium AI financial reports and charts.
            </p>
          </div>
        </header>
        
        <div className="py-12">
          <EmptyAnalytics />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 select-none max-w-[1440px] mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 relative">
          <SidebarToggle />
          <h1 className="text-[32px] font-bold tracking-tight text-textPrimary font-heading">
            Analytics
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="p-1.5 hover:bg-hoverAccent border border-border rounded-lg text-textSecondary hover:text-textPrimary transition-all cursor-pointer focus:outline-none"
            >
              <FiMoreVertical className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {showExportDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowExportDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-48 rounded-xl bg-surface border border-border p-1.5 shadow-md z-40 origin-top-left"
                  >
                    <button
                      onClick={() => {
                        setShowExportDropdown(false);
                        exportAsPNG("bar-chart-wrapper", "monthly_spending");
                        exportAsPNG("pie-chart-wrapper", "category_distribution");
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-hoverAccent transition-all cursor-pointer focus:outline-none"
                    >
                      Download PNG
                    </button>
                    <button
                      onClick={() => {
                        setShowExportDropdown(false);
                        window.print();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-hoverAccent transition-all cursor-pointer focus:outline-none"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => {
                        setShowExportDropdown(false);
                        window.print();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-hoverAccent transition-all cursor-pointer focus:outline-none"
                    >
                      Print Report
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-1.5 shadow-sm">
          <DateRangePicker 
            selectedRange={selectedRange} 
            onRangeChange={handleRangeChange} 
            startDate={startDate} 
            endDate={endDate} 
          />
        </div>
      </div>

      {/* 4 KPI Cards Grid (White cards only, custom prefixes, no right icons) */}
      <div className="relative">
        {trendsLoading && (
          <div className="absolute inset-0 bg-[#F6F8FC]/40 backdrop-blur-[1px] z-20 rounded-2xl flex items-center justify-center" />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1: TOTAL SPEND */}
          <KPICard
            title="💳 TOTAL SPEND"
            value={formatCurrency(trendsData?.total_spent || 0)}
            delay={0.05}
            className="shadow-sm"
          >
            <ComparisonBadge value={trendsData?.month_over_month} />
          </KPICard>

          {/* KPI 2: AVERAGE DAILY */}
          <KPICard
            title="📊 AVG DAILY"
            value={formatCurrency(trendsData?.average_daily_spend || 0)}
            delay={0.1}
            description="Average spending per day"
            className="shadow-sm"
          />

          {/* KPI 3: TOP CATEGORY */}
          <KPICard
            title="🎬 TOP CATEGORY"
            value={trendsData?.category_breakdown?.[0]?.category || "N/A"}
            delay={0.15}
            description={trendsData?.category_breakdown?.[0] ? `${formatCurrency(trendsData.category_breakdown[0].total)} total spent` : ""}
            className="shadow-sm"
          />

          {/* KPI 4: SAVINGS */}
          <KPICard
            title="🎯 SAVINGS"
            value={formatCurrency(Math.max(0, budget - (trendsData?.total_spent || 0)))}
            delay={0.20}
            description="Remaining budget this month"
            className="shadow-sm"
          />
        </div>
      </div>

      {/* 2 Charts Grid (7/12 and 5/12 layout on large displays) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Monthly Spending (7/12 width) */}
        <div id="bar-chart-wrapper" className="relative w-full lg:col-span-7">
          <ChartCard
            title="Monthly Spending"
            subtitle="Calendar spending overview across the last 6 months"
          >
            <MonthlySpendingChart data={summaryData?.monthly_summary || []} />
          </ChartCard>
        </div>

        {/* Category Distribution (5/12 width) */}
        <div id="pie-chart-wrapper" className="relative w-full lg:col-span-5 overflow-visible">
          <ChartCard
            title="Category Distribution"
            subtitle="Spend percentage breakdown by active categories"
          >
            <CategoryPieChart 
              data={trendsData?.category_breakdown?.length > 0 ? trendsData.category_breakdown : (summaryData?.category_breakdown || [])} 
            />
          </ChartCard>
        </div>
      </div>

      {/* AI Insights Summary Box */}
      <div className="bg-surface border border-default rounded-card p-6 shadow-sm space-y-4">
        <h3 className="text-[14px] font-semibold text-[#6B7280] uppercase tracking-wider">
          Recent Insights
        </h3>
        <div className="bg-[#F1F5F9] border border-default rounded-card p-5 flex items-start gap-4 shadow-sm">
          <span className="text-xl">🎬</span>
          <div className="space-y-1">
            <p className="text-[15px] font-semibold text-[#111827] leading-relaxed">
              {aiSummary 
                ? `Entertainment spending increased 18% this month.` 
                : `No spending fluctuations detected in recent periods.`
              }
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
