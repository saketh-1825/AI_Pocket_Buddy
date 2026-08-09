import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CELL_SIZE = 14;
const CELL_GAP = 4;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * True calendar-based activity heatmap (GitHub Contributions style).
 * Every square = one real calendar date. Months have natural widths.
 * Weeks are real ISO weeks. Leading/trailing blanks preserve weekday alignment.
 */
export default function ActivityHeatmap({ expenses = [], days = 60 }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { weeks, monthMarkers, weekMonths } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compute start date
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));

    // Align start to the preceding Sunday (day 0) to fill the first week column
    const alignedStart = new Date(start);
    alignedStart.setDate(alignedStart.getDate() - alignedStart.getDay());

    // Index expenses by date string for O(1) lookups
    const expenseMap = {};
    expenses.forEach((exp) => {
      const key = exp.date?.split("T")[0];
      if (!key) return;
      if (!expenseMap[key]) expenseMap[key] = { total: 0, categories: new Set() };
      expenseMap[key].total += exp.amount || 0;
      if (exp.category) expenseMap[key].categories.add(exp.category);
    });

    // Compute max daily amount for intensity scaling
    let maxAmount = 0;
    Object.values(expenseMap).forEach((v) => {
      if (v.total > maxAmount) maxAmount = v.total;
    });

    // Generate every date from alignedStart through today
    const allDates = [];
    const cursor = new Date(alignedStart);
    while (cursor <= today) {
      const key = cursor.toISOString().split("T")[0];
      const isInRange = cursor >= start && cursor <= today;
      const dayData = isInRange ? expenseMap[key] : null;

      let intensity = 0;
      if (dayData && maxAmount > 0) {
        const ratio = dayData.total / maxAmount;
        if (ratio > 0.75) intensity = 4;
        else if (ratio > 0.5) intensity = 3;
        else if (ratio > 0.25) intensity = 2;
        else if (ratio > 0) intensity = 1;
      }

      allDates.push({
        date: key,
        dayOfWeek: cursor.getDay(), // 0=Sun ... 6=Sat
        month: cursor.getMonth(),
        year: cursor.getFullYear(),
        amount: isInRange ? (dayData?.total || 0) : -1, // -1 = out of range
        categories: dayData ? Array.from(dayData.categories) : [],
        intensity: isInRange ? intensity : -1,
        isInRange,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Pad the last week if it doesn't end on Saturday
    const lastDay = allDates[allDates.length - 1];
    if (lastDay && lastDay.dayOfWeek < 6) {
      for (let d = lastDay.dayOfWeek + 1; d <= 6; d++) {
        allDates.push({ date: null, dayOfWeek: d, month: -1, year: -1, amount: -1, categories: [], intensity: -1, isInRange: false });
      }
    }

    // Group into weeks (columns of 7, Sun=row0 ... Sat=row6)
    const weekColumns = [];
    for (let i = 0; i < allDates.length; i += 7) {
      weekColumns.push(allDates.slice(i, i + 7));
    }

    // Assign each week to ONE month using majority-vote
    const weekMonths = weekColumns.map((week) => {
      const counts = {};
      week.forEach((cell) => {
        if (cell.isInRange) {
          const key = `${cell.year}-${cell.month}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      let bestKey = null;
      let bestCount = 0;
      Object.entries(counts).forEach(([key, count]) => {
        if (count > bestCount) { bestKey = key; bestCount = count; }
      });
      if (!bestKey) return null;
      const [y, m] = bestKey.split("-").map(Number);
      return { month: m, year: y };
    });

    // Derive unique visible months in order, keeping only last 2
    const seenKeys = new Set();
    const uniqueMonths = [];
    weekMonths.forEach((wm) => {
      if (!wm) return;
      const key = `${wm.year}-${wm.month}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueMonths.push({ month: wm.month, year: wm.year });
      }
    });
    const lastTwo = uniqueMonths.slice(-2);
    const lastTwoKeys = new Set(lastTwo.map((m) => `${m.year}-${m.month}`));

    // For each of the last 2 months, find the first week assigned to it
    const markers = [];
    lastTwo.forEach((target) => {
      const targetKey = `${target.year}-${target.month}`;
      const wIdx = weekMonths.findIndex((wm) => wm && `${wm.year}-${wm.month}` === targetKey);
      if (wIdx !== -1) {
        markers.push({ label: MONTH_NAMES[target.month], weekIndex: wIdx });
      }
    });

    return { weeks: weekColumns, monthMarkers: markers, weekMonths };
  }, [expenses, days]);

  const getColorClass = (intensity) => {
    switch (intensity) {
      case 1: return "bg-[#EDE9FE]";
      case 2: return "bg-[#C4B5FD]";
      case 3: return "bg-[#8B5CF6]";
      case 4: return "bg-[#5B4CF0]";
      case 0: return "bg-[#F3F4F6]";
      default: return "";
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 55,
    });
  };

  // Empty state
  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-semibold text-textPrimary">No activity yet</p>
        <p className="text-xs text-textSecondary mt-2">
          Start adding expenses to build your activity history.
        </p>
      </div>
    );
  }

  const colWidth = CELL_SIZE + CELL_GAP;
  const gridHeight = CELL_SIZE * 7 + CELL_GAP * 6;
  const dayLabelWidth = 24;
  const dayLabelGap = 8; // pr-2 = 8px

  return (
    <div className="relative select-none w-full" onMouseMove={handleMouseMove}>
      {/* Month labels row — each label sits exactly above the first column of that month */}
      <div className="flex" style={{ height: "16px", marginBottom: "4px", paddingLeft: `${dayLabelWidth + dayLabelGap}px`, gap: `${CELL_GAP}px` }}>
        {(() => {
          // Build label slots: for each week column, either render a label or a spacer
          const labelAtWeek = {};
          monthMarkers.forEach((m) => { labelAtWeek[m.weekIndex] = m.label; });
          return weeks.map((_, wIdx) => {
            const label = labelAtWeek[wIdx];
            // Add 24px gap at month boundaries (not on the first column). Since container has gap of 4px, we add 20px marginLeft.
            const isMonthBoundary = wIdx > 0 && weekMonths[wIdx] && weekMonths[wIdx - 1] &&
              `${weekMonths[wIdx].year}-${weekMonths[wIdx].month}` !== `${weekMonths[wIdx - 1].year}-${weekMonths[wIdx - 1].month}`;
            return (
              <div
                key={`ml-${wIdx}`}
                style={{
                  width: `${CELL_SIZE}px`,
                  ...(isMonthBoundary ? { marginLeft: "20px" } : {}),
                }}
                className="shrink-0 flex items-end"
              >
                {label && (
                  <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-widest whitespace-nowrap">
                    {label}
                  </span>
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* Grid: day labels + week columns */}
      <div className="flex items-start justify-center">
        {/* Weekday labels */}
        <div
          className="flex flex-col shrink-0 text-right pr-2"
          style={{ height: `${gridHeight}px`, width: "24px", gap: `${CELL_GAP}px` }}
        >
          {["", "M", "", "W", "", "F", ""].map((label, i) => (
            <span
              key={i}
              className="text-[9px] font-extrabold text-textSecondary tracking-wider flex items-center justify-end"
              style={{ height: `${CELL_SIZE}px` }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex" style={{ gap: `${CELL_GAP}px` }}>
          {weeks.map((week, wIdx) => {
            // Add 24px gap at month boundaries (not on the first column). Since container has gap of 4px, we add 20px marginLeft.
            const isMonthBoundary = wIdx > 0 && weekMonths[wIdx] && weekMonths[wIdx - 1] &&
              `${weekMonths[wIdx].year}-${weekMonths[wIdx].month}` !== `${weekMonths[wIdx - 1].year}-${weekMonths[wIdx - 1].month}`;
            return (
            <div key={wIdx} className="flex flex-col" style={{ gap: `${CELL_GAP}px`, ...(isMonthBoundary ? { marginLeft: "20px" } : {}) }}>
              {week.map((cell, dIdx) => {
                // Out-of-range or padding cell: render invisible spacer
                if (!cell.isInRange) {
                  return (
                    <div
                      key={`pad-${wIdx}-${dIdx}`}
                      style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                    />
                  );
                }
                return (
                  <div
                    key={cell.date}
                    className={`rounded-[4px] transition-all duration-100 cursor-pointer hover:ring-1 hover:ring-primary/30 ${getColorClass(cell.intensity)}`}
                    style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}
            </div>
            );
          })}
        </div>
      </div>

      {/* Legend — centered */}
      <div className="flex items-center justify-center gap-3 mt-[24px]">
        <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-widest">Less</span>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#F3F4F6]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EDE9FE]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C4B5FD]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#8B5CF6]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#5B4CF0]" />
        </div>
        <span className="text-[9px] font-extrabold text-textSecondary uppercase tracking-widest">More</span>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredCell && hoveredCell.amount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "absolute",
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
            }}
            className="pointer-events-none z-50 bg-surface border border-border px-3 py-2 rounded-xl shadow-lg flex flex-col gap-0.5 text-left min-w-[120px]"
          >
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-textSecondary">
              {new Date(hoveredCell.date).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="text-sm font-extrabold text-textPrimary">
              {formatCurrency(hoveredCell.amount)}
            </span>
            {hoveredCell.categories.length > 0 && (
              <span className="text-[9px] font-semibold text-textSecondary">
                {hoveredCell.categories.join(" • ")}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
