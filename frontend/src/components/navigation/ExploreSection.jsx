export default function ExploreSection({ title, children }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF] px-3 font-sans select-none">
        {title}
      </h4>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}
