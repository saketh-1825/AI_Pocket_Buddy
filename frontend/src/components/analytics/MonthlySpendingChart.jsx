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
import CustomTooltip from "./CustomTooltip";

/**
 * Monthly Spending Chart using Recharts BarChart.
 * Renders bars with rounded corners, gradient violet colors, and glows current month.
 */
export default function MonthlySpendingChart({ data = [] }) {
  // Format numbers for Y-axis
  const formatYAxis = (value) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  return (
    <div className="w-full h-[320px] sm:h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 5, left: -10, bottom: 5 }}
        >
          <defs>
            {/* Standard gradient */}
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#6B21A8" />
            </linearGradient>
            
            {/* Highlight current month gradient */}
            <linearGradient id="currentBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.03)"
            vertical={false}
          />

          <XAxis
            dataKey="month_name"
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
            className="font-medium select-none"
          />

          <YAxis
            stroke="#9CA3AF"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            dx={-8}
            className="font-medium select-none"
          />

          <Tooltip
            content={<CustomTooltip type="monthly" />}
            cursor={{ fill: "rgba(255, 255, 255, 0.02)", radius: [8, 8, 0, 0] }}
          />

          <Bar
            dataKey="total_spent"
            radius={[8, 8, 0, 0]}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => {
              const isCurrent = entry.is_current_month;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isCurrent ? "url(#currentBarGradient)" : "url(#barGradient)"}
                  style={{
                    filter: isCurrent ? "drop-shadow(0px 0px 8px rgba(168, 85, 247, 0.5))" : "none",
                  }}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
