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
        <div className="bg-[#16161A] border border-[#A855F7]/20 rounded-xl p-4 shadow-xl font-sans select-none z-50">
          <p className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider mb-2">
            {formatDateLabel(point.date)}
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center gap-6">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7]" />
                Current Period
              </span>
              <span className="text-white font-extrabold">
                {formatCurrencyValue(point.current_period)}
              </span>
            </div>
            
            <div className="flex justify-between items-center gap-6">
              <span className="flex items-center gap-1.5 text-[#9CA3AF] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6B21A8] opacity-70" />
                Previous Period
              </span>
              <span className="text-[#9CA3AF] font-bold">
                {formatCurrencyValue(point.previous_period)}
              </span>
            </div>

            <div className="flex justify-between items-center gap-6 border-t border-white/5 pt-1.5 mt-1.5 text-[10px] text-[#9CA3AF]">
              <span>Transactions</span>
              <span className="font-bold text-white">{point.expense_count}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[320px] w-full mt-4 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF" 
            fontSize={10}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatDateLabel}
            dy={8}
          />
          
          <YAxis 
            stroke="#9CA3AF" 
            fontSize={10}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val}`}
            dx={-8}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(168, 85, 247, 0.15)", strokeWidth: 1 }} />
          
          <Line 
            type="monotone" 
            dataKey="current_period" 
            stroke="#A855F7" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 5, stroke: "#0F0F11", strokeWidth: 2, fill: "#A855F7" }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          
          <Line 
            type="monotone" 
            dataKey="previous_period" 
            stroke="#6B21A8" 
            strokeWidth={2}
            strokeDasharray="5 5" 
            dot={false}
            opacity={0.7}
            activeDot={false}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
