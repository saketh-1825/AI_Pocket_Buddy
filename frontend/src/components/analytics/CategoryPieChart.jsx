import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector
} from "recharts";
import CustomTooltip from "./CustomTooltip";

/**
 * Category Breakdown Donut Chart.
 * Inner radius: 65, Outer radius: 95, Padding Angle: 4.
 * Slice scales on hover, with a sidebar interactive legend.
 */

const COLORS = [
  "#A855F7",
  "#9333EA",
  "#7E22CE",
  "#6B21A8",
  "#C084FC",
  "#DDD6FE"
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function CategoryPieChart({ data = [] }) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  // Custom active sector drawer to scale out the active slice
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6} // Scale slice by 6px
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="transition-all duration-300"
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
      {/* Chart Wrapper */}
      <div className="relative w-[210px] h-[210px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="total"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{ outline: "none" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip type="category" />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Grid */}
      <div className="flex-1 w-full space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {data.map((entry, index) => {
          const color = COLORS[index % COLORS.length];
          const isHovered = activeIndex === index;
          return (
            <div
              key={entry.category}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                isHovered
                  ? "bg-white/[0.03] border-white/10"
                  : "bg-transparent border-transparent"
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
                  {entry.category}
                </span>
              </div>
              
              <div className="flex items-center gap-3.5 shrink-0 ml-4">
                <span className="text-[10px] font-extrabold text-[#9CA3AF] bg-[#0F0F11] px-2 py-0.5 rounded border border-white/5">
                  {entry.percentage}%
                </span>
                <span className="text-xs font-extrabold text-white">
                  {formatCurrency(entry.total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
