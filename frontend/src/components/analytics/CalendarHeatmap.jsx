import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarHeatmap({ data }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[#64748B]">
        No calendar data available.
      </div>
    );
  }

  // Calculate start padding based on the first date's day of the week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDate = new Date(data[0].date);
  const startPadding = firstDate.getDay();

  // Create an array with empty padding cells followed by actual data
  const gridCells = [
    ...Array(startPadding).fill(null),
    ...data
  ];

  // Helper to get color class based on intensity
  const getColorClass = (intensity) => {
    switch (intensity) {
      case 1:
        return "bg-[#4F46E5]/10 border-transparent hover:border-[#4F46E5]/30";
      case 2:
        return "bg-[#4F46E5]/35 border-transparent hover:border-[#4F46E5]/55";
      case 3:
        return "bg-[#4F46E5]/65 border-transparent hover:border-[#4F46E5]/85";
      case 4:
        return "bg-[#4F46E5] border-transparent hover:brightness-110";
      default:
        return "bg-white border-[#E2E8F0] hover:border-slate-300";
    }
  };

  // Helper to format currency
  const formatVal = (amt) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amt);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Offset tooltip slightly above and to the right of the mouse pointer
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 45
    });
  };

  // Group months to display on top of the grid
  // We can show month labels approximately aligned with columns.
  // 52 columns / 12 months = ~4 columns per month.
  // We will map columns to their month label.
  const getMonthLabels = () => {
    const labels = [];
    let lastMonth = -1;
    
    // Scan every week (every 7 cells) to see if a new month starts
    for (let i = 0; i < gridCells.length; i += 7) {
      const cell = gridCells[i];
      if (cell) {
        const date = new Date(cell.date);
        const m = date.getMonth();
        if (m !== lastMonth) {
          labels.push({ label: MONTHS[m], index: Math.floor(i / 7) });
          lastMonth = m;
        }
      }
    }
    return labels;
  };

  const monthLabels = getMonthLabels();

  return (
    <div className="relative w-full overflow-x-auto pb-4 scrollbar-thin select-none">
      <div className="min-w-[760px] pr-4 relative" onMouseMove={handleMouseMove}>
        {/* Month Labels row */}
        <div className="flex text-[9px] font-extrabold text-[#64748B] uppercase tracking-widest mb-2 pl-8 relative h-4">
          {monthLabels.map((ml, idx) => (
            <span
              key={idx}
              className="absolute"
              style={{ left: `${(ml.index * 13) + 32}px` }}
            >
              {ml.label}
            </span>
          ))}
        </div>

        {/* Heatmap Grid Wrapper */}
        <div className="flex gap-2">
          {/* Day of Week Labels Column */}
          <div className="flex flex-col justify-between text-[9px] font-extrabold text-[#64748B] uppercase tracking-wider py-1 h-[88px] w-6 shrink-0 text-right pr-2">
            <span>Sun</span>
            <span>Tue</span>
            <span>Thu</span>
            <span>Sat</span>
          </div>

          {/* Grid Container */}
          <div className="grid grid-flow-col grid-rows-7 gap-[3px] h-[88px] auto-cols-[10px]">
            {gridCells.map((cell, idx) => {
              if (!cell) {
                // Render empty padded cell
                return <div key={`pad-${idx}`} className="w-[10px] h-[10px] bg-transparent" />;
              }

              return (
                <div
                  key={cell.date}
                  className={`w-[10px] h-[10px] rounded-[2px] border transition-all duration-150 cursor-pointer ${getColorClass(
                    cell.intensity
                  )}`}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              );
            })}
          </div>
        </div>

        {/* Floating Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
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
              className="pointer-events-none z-50 bg-white border border-[#E2E8F0] px-3.5 py-2.5 rounded-xl shadow-lg flex flex-col gap-0.5 text-left min-w-[130px]"
            >
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                {new Date(hoveredCell.date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </span>
              <span className="text-sm font-extrabold text-[#111827]">
                {formatVal(hoveredCell.amount)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] font-extrabold text-[#6B7280] uppercase tracking-widest pr-4">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] border border-[#E2E8F0] bg-white" />
          <div className="w-2.5 h-2.5 rounded-[2px] border border-transparent bg-[#4F46E5]/10" />
          <div className="w-2.5 h-2.5 rounded-[2px] border border-transparent bg-[#4F46E5]/35" />
          <div className="w-2.5 h-2.5 rounded-[2px] border border-transparent bg-[#4F46E5]/65" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4F46E5]" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

