export default function BudgetAlerts({ recommendations }) {
  const alerts = recommendations.filter(
    (item) =>
      item.type === "danger" ||
      item.type === "warning"
  );

  return (
    <div className="bg-surface border border-default rounded-card p-6 shadow-sm space-y-4">

      <div>
        <h3 className="text-[16px] font-bold text-[#111827] tracking-wide uppercase font-heading">
          Budget Alerts
        </h3>

        <p className="text-xs text-[#6B7280] mt-1 font-medium">
          Active threshold warnings and overspending indicators.
        </p>
      </div>

      <div className="space-y-3">

        {alerts.length > 0 ? (
          alerts.map((recommendation, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl space-y-2 text-xs border ${recommendation.type === "danger"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-orange-50 border-orange-200 text-orange-800"
                }`}
            >
              <div className="flex justify-between items-center">

                <span className="font-extrabold uppercase text-[9px] tracking-wider text-[#4F46E5]">
                  {recommendation.category}
                </span>

                <span
                  className={`w-1.5 h-1.5 rounded-full ${recommendation.type === "danger"
                      ? "bg-[#EF4444]"
                      : "bg-[#F59E0B]"
                    }`}
                />

              </div>

              <p className="font-medium leading-relaxed">
                {recommendation.text}
              </p>
            </div>
          ))
        ) : (
          <div className="text-xs text-[#6B7280]/60 italic py-2">
            No budget alerts triggered. You are in the safe spending zone!
          </div>
        )}

      </div>
    </div>
  );
}
