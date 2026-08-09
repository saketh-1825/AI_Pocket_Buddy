import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "UTC" });
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

const formatCurrencyValue = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val);
};

export default function TrendLineChart({ data = [] }) {
  
  // Custom Tooltip Card
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-xl p-4 shadow-md font-sans select-none z-50 pointer-events-none">
          <p className="text-[10px] font-extrabold text-textSecondary uppercase tracking-wider mb-2">
            {formatDateLabel(point.date)}
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center gap-6">
              <span className="flex items-center gap-1.5 text-textPrimary font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Current Period
              </span>
              <span className="text-textPrimary font-extrabold">
                {formatCurrencyValue(point.current_period)}
              </span>
            </div>
            
            <div className="flex justify-between items-center gap-6">
              <span className="flex items-center gap-1.5 text-textSecondary font-medium">
                <span className="w-2 h-2 rounded-full bg-[#C7D2FE]" />
                Previous Period
              </span>
              <span className="text-textSecondary font-bold">
                {formatCurrencyValue(point.previous_period)}
              </span>
            </div>

            <div className="flex justify-between items-center gap-6 border-t border-border pt-1.5 mt-1.5 text-[10px] text-textSecondary">
              <span>Transactions</span>
              <span className="font-bold text-textPrimary">{point.expense_count}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full mt-4 select-none">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} opacity={0.6} />
          
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF" 
            fontSize={10}
            fontWeight={500}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatDateLabel}
            dy={8}
          />
          
          <YAxis 
            stroke="#9CA3AF" 
            fontSize={10}
            fontWeight={500}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val}`}
            dx={-8}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(91, 76, 240, 0.1)", strokeWidth: 1 }} />
          
          <Line 
            type="monotone" 
            dataKey="current_period" 
            stroke="#5B4CF0" 
            strokeWidth={2.5} 
            dot={false}
            activeDot={{ r: 4, stroke: "#FFFFFF", strokeWidth: 1.5, fill: "#5B4CF0" }}
            animationDuration={800}
            animationEasing="ease-out"
          />
          
          <Line 
            type="monotone" 
            dataKey="previous_period" 
            stroke="#C7D2FE" 
            strokeWidth={1.5}
            strokeDasharray="4 4" 
            dot={false}
            activeDot={false}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
