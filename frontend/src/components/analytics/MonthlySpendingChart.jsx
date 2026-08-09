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
 * Renders bars with rounded corners, indigo primary/accent colors.
 */
export default function MonthlySpendingChart({ data = [] }) {
  // Format numbers for Y-axis
  const formatYAxis = (value) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 16, right: 8, left: -8, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E5E7EB"
            vertical={false}
            opacity={0.6}
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
            cursor={{ fill: "rgba(91, 76, 240, 0.03)", radius: [6, 6, 0, 0] }}
          />

          <Bar
            dataKey="total_spent"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
            barSize={32}
          >
            {data.map((entry, index) => {
              const isCurrent = entry.is_current_month;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isCurrent ? "#5B4CF0" : "#C7D2FE"}
                  className="hover:opacity-90 transition-opacity cursor-pointer"
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
