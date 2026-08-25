import { motion } from "framer-motion";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { getCategoryStyles, getCategoryIcon } from "../../constants/categories";
import { formatCurrency } from "../../utils/currencyFormat";


// Date Formatter
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Relative time calculation for today's items
const getRelativeTime = (expense) => {
  if (!expense.created_at) return "";
  try {
    const created = new Date(expense.created_at);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24 && created.toDateString() === now.toDateString()) {
      return `${diffHrs}h ago`;
    }
  } catch (err) {
    console.error("Failed to parse relative time:", err);
  }
  return "";
};

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: "easeInOut"
    },
  },
};

function ExpenseList({ expenses, categories = [], viewMode = "timeline", onEdit, onDelete }) {
  
  const getGroupedExpenses = () => {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const todayStr = now.toDateString();
    const yesterdayStr = yesterday.toDateString();

    const todayList = [];
    const yesterdayList = [];
    const olderList = [];

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const dStr = d.toDateString();
      if (dStr === todayStr) {
        todayList.push(e);
      } else if (dStr === yesterdayStr) {
        yesterdayList.push(e);
      } else {
        olderList.push(e);
      }
    });

    return [
      { title: "Today", items: todayList },
      { title: "Yesterday", items: yesterdayList },
      { title: "Older", items: olderList },
    ].filter((group) => group.items.length > 0);
  };

  const grouped = getGroupedExpenses();

  // Helper to render transaction item row
  const renderTransactionRow = (expense) => {
    const catObj = categories.find(
      (c) => c.id === expense.category_id
    );
    const catName = catObj ? catObj.name : "Others";
    const catColor = getCategoryStyles(catObj ? catObj.color : "#94A3B8");
    const IconComponent = getCategoryIcon(catObj ? catObj.icon_key : "others");
    
    const displayDesc = expense.description || expense.title || "Transaction";
    const relativeTime = getRelativeTime(expense);
    const subLabel = relativeTime 
      ? `${catName} • ${relativeTime}` 
      : `${catName} • ${formatDate(expense.date)}`;

    return (
      <motion.div
        key={expense.id}
        variants={itemVariants}
        whileHover={{ scale: 1.005 }}
        className="group flex items-center justify-between p-4 bg-surface border border-border rounded-card relative transition-all duration-150 shadow-sm hover:bg-hoverAccent"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Left: Standardized Icon Bubble (20px react-icon, muted gray) */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-textSecondary transition-colors group-hover:bg-surface">
            <IconComponent className="h-5 w-5 shrink-0" />
          </div>

          {/* Middle: Details */}
          <div className="min-w-0 space-y-1">
            <h4 className="text-sm font-bold text-textPrimary truncate leading-none">
              {displayDesc}
            </h4>
            <p className="text-xs text-textSecondary font-medium leading-none mt-1">
              {subLabel}
            </p>
          </div>
        </div>

        {/* Right: Amount & Hover Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-sm font-extrabold text-textPrimary tracking-tight">
            {formatCurrency(expense.amount)}
          </span>

          {/* Action Buttons */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(expense)}
              className="p-2 rounded-xl border border-border bg-surface text-textSecondary hover:text-primary hover:border-primary/20 transition-all duration-150 cursor-pointer focus:outline-none"
              title="Edit Expense"
            >
              <FiEdit2 className="h-3.5 w-3.5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(expense.id)}
              className="p-2 rounded-xl border border-border bg-surface text-textSecondary hover:text-danger hover:border-danger/20 transition-all duration-150 cursor-pointer focus:outline-none"
              title="Delete Expense"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (viewMode === "table") {
    return (
      <div className="w-full">
        {/* Table View rendered as neat banking logs list inside a layout card container */}
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {expenses.length > 0 ? (
            expenses.map((expense) => renderTransactionRow(expense))
          ) : (
            <div className="bg-surface border border-border rounded-card p-7 text-center text-sm text-textSecondary shadow-sm">
              No transactions recorded for this month.
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Render Chronological Timeline Feed
  return (
    <div className="w-full space-y-8">
      {grouped.map((group) => (
        <div key={group.title} className="space-y-4">
          {/* Timeline Group Header */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-activeBg px-2.5 py-1 rounded-lg border border-primary/10">
              {group.title}
            </span>
            <div className="flex-1 h-[1px] bg-border/50" />
          </div>

          {/* Timeline Group Stack */}
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2 relative pl-6 border-l border-border/50 ml-3"
          >
            {/* Timeline dot decorator helper lines */}
            {group.items.map((expense) => {
              const row = renderTransactionRow(expense);
              return (
                <div key={expense.id} className="relative">
                  {/* Timeline bullet indicator aligned to the vertical separator line */}
                  <div className="absolute left-[-30px] top-[22px] w-2.5 h-2.5 rounded-full bg-background border-2 border-primary/40 group-hover:border-primary transition-colors z-10" />
                  {row}
                </div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export default ExpenseList;
