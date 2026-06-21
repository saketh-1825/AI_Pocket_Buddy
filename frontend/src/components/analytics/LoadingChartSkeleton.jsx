/**
 * LoadingChartSkeleton component to display during analytics loading.
 * Styled with #1A1A1F card background and shimmering pulse animations.
 */
export default function LoadingChartSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="h-10 w-10 bg-[#1A1A1F] rounded-xl"></div>
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[#1A1A1F] rounded-lg"></div>
          <div className="h-4 w-64 bg-[#1A1A1F] rounded-lg"></div>
        </div>
      </div>

      {/* Hero Card Skeleton */}
      <div className="bg-[#1A1A1F] border border-white/5 rounded-xl2 h-44 w-full"></div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1A1A1F] border border-white/5 rounded-xl2 h-32"></div>
        ))}
      </div>

      {/* Charts Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#1A1A1F] border border-white/5 rounded-xl2 h-96"></div>
        <div className="bg-[#1A1A1F] border border-white/5 rounded-xl2 h-96"></div>
      </div>
    </div>
  );
}
