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
import { getCategoryChartColor, getCategoryEmoji } from "../../constants/categories";
import { useCategoryStore } from "../../store/categoryStore";

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
  const { categories } = useCategoryStore();

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
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          className="transition-all duration-300"
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center" style={{ minHeight: "360px" }}>
      {/* Donut Chart — fills available width, centered */}
      <div className="w-full" style={{ maxWidth: "280px" }}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="78%"
              paddingAngle={4}
              dataKey="total"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationDuration={800}
            >
              {data.map((entry, index) => {
                const catObj = categories.find(
                  (c) => c.name.toLowerCase() === entry.category.toLowerCase()
                );
                const color = catObj ? catObj.color : "#94A3B8";
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={getCategoryChartColor(color)}
                    style={{ outline: "none" }}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip type="category" />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend — below the donut, full width, no overflow */}
      <div className="w-full space-y-1.5 mt-4">
        {data.map((entry, index) => {
          const catObj = categories.find(
            (c) => c.name.toLowerCase() === entry.category.toLowerCase()
          );
          const emoji = getCategoryEmoji(catObj ? catObj.icon_key : "others");
          const color = catObj ? catObj.color : "#94A3B8";
          const isHovered = activeIndex === index;
          return (
            <div
              key={entry.category}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                isHovered
                  ? "bg-hoverAccent border-border"
                  : "bg-transparent border-transparent"
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-bold text-textPrimary uppercase tracking-wider truncate">
                  {emoji} {entry.category}
                </span>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-[10px] font-extrabold text-textSecondary bg-background px-2 py-0.5 rounded-lg border border-border">
                  {entry.percentage}%
                </span>
                <span className="text-xs font-extrabold text-textPrimary whitespace-nowrap">
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
