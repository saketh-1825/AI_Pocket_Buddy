export default function Pagination({ currentPage, totalPages, setCurrentPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-3 pt-4">
      <button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="h-9 px-4 bg-surface border border-border hover:bg-hoverAccent text-textSecondary rounded-xl text-xs font-bold disabled:opacity-30 disabled:hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
      >
        Prev
      </button>

      <span className="text-xs text-textSecondary font-bold font-sans">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="h-9 px-4 bg-surface border border-border hover:bg-hoverAccent text-textSecondary rounded-xl text-xs font-bold disabled:opacity-30 disabled:hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
