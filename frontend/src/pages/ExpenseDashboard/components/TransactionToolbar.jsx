import { FiSearch } from "react-icons/fi";

export default function TransactionToolbar({ searchTerm, setSearchTerm, sortBy, setSortBy, setCurrentPage }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface border border-border rounded-card p-7 shadow-sm">
      <h3 className="text-[20px] font-bold text-textPrimary font-heading">
        Recent Transactions
      </h3>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Search */}
        <div className="relative w-full md:w-60">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
          <input
            type="text"
            placeholder="Search merchant, category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface border border-border focus:border-primary rounded-xl pl-9 pr-4 py-2 text-[14px] text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans transition-all duration-150"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-surface border border-border focus:border-primary rounded-xl px-4 py-2 text-[14px] text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-sans transition-all duration-150"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="amount-high">Amount: High to Low</option>
          <option value="amount-low">Amount: Low to High</option>
        </select>
      </div>
    </div>
  );
}
