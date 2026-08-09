/**
 * LoadingChartSkeleton component to display during analytics loading.
 * Styled with light card background and shimmering pulse animations.
 */
export default function LoadingChartSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 border-b border-[#E2E8F0] pb-6">
        <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-64 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* Hero Card Skeleton */}
      <div className="bg-slate-200 border border-[#E2E8F0] rounded-2xl h-44 w-full"></div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-200 border border-[#E2E8F0] rounded-2xl h-32"></div>
        ))}
      </div>

      {/* Charts Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-200 border border-[#E2E8F0] rounded-2xl h-96"></div>
        <div className="bg-slate-200 border border-[#E2E8F0] rounded-2xl h-96"></div>
      </div>
    </div>
  );
}

