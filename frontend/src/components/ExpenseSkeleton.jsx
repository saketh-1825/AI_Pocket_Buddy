
function ExpenseSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-[#16161A]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-[#0F0F11]/40 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                {/* Category Skeleton */}
                <td className="px-6 py-4">
                  <div className="h-6 w-24 rounded-lg bg-white/5"></div>
                </td>

                {/* Description Skeleton */}
                <td className="px-6 py-4">
                  <div className="h-4 w-40 rounded bg-white/5"></div>
                </td>

                {/* Amount Skeleton */}
                <td className="px-6 py-4">
                  <div className="h-4 w-16 rounded bg-white/5"></div>
                </td>

                {/* Date Skeleton */}
                <td className="px-6 py-4">
                  <div className="h-4 w-20 rounded bg-white/5"></div>
                </td>

                {/* Actions Skeleton */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-white/5"></div>
                    <div className="h-7 w-7 rounded-lg bg-white/5"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExpenseSkeleton;
