import { motion } from "framer-motion";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { getCategoryStyles, getCategoryIcon, CATEGORY_COLORS, COLOR_PALETTE } from "../constants/categories";

// Currency Formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

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

// Framer Motion variants
const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

function ExpenseList({ expenses, categories = [], viewMode = "timeline", onEdit, onDelete }) {
  
  // Grouping logic for Timeline mode
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

  if (viewMode === "table") {
    // Render existing clean table
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
            <motion.tbody
              variants={listContainerVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-white/5"
            >
              {expenses.map((expense) => {
                const catObj = categories.find(
                  (c) => c.name.toLowerCase() === expense.category.toLowerCase()
                );
                const catColor = catObj
                  ? getCategoryStyles(catObj.color)
                  : (CATEGORY_COLORS[expense.category] || COLOR_PALETTE.Gray);
                const IconComponent = catObj
                  ? getCategoryIcon(catObj.icon)
                  : getCategoryIcon(expense.category);
                
                const displayDesc = expense.description || expense.title || "";

                return (
                  <motion.tr
                    key={expense.id}
                    variants={itemVariants}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase ${catColor.text}`}>
                        <IconComponent className="h-3.5 w-3.5" />
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white max-w-xs truncate">
                      {displayDesc}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEdit(expense)}
                          className="p-1.5 rounded-lg border border-white/5 bg-[#0F0F11] text-[#9CA3AF] hover:text-primary hover:border-primary/20 transition-all duration-200"
                          title="Edit Expense"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onDelete(expense.id)}
                          className="p-1.5 rounded-lg border border-white/5 bg-[#0F0F11] text-[#9CA3AF] hover:text-danger hover:border-danger/20 transition-all duration-200"
                          title="Delete Expense"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render Premium Timeline View (Apple Wallet / CRED inspired)
  return (
    <div className="w-full space-y-8">
      {grouped.map((group) => (
        <div key={group.title} className="space-y-4">
          {/* Timeline Group Header */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B21A8] bg-[#6B21A8]/10 px-2.5 py-1 rounded-md border border-[#6B21A8]/15">
              {group.title}
            </span>
            <div className="flex-1 h-[1px] bg-white/[0.04]" />
          </div>

          {/* Timeline Group Stack */}
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3 relative pl-6 border-l border-white/[0.04] ml-3"
          >
            {group.items.map((expense) => {
              const catObj = categories.find(
                (c) => c.name.toLowerCase() === expense.category.toLowerCase()
              );
              const catColor = catObj
                ? getCategoryStyles(catObj.color)
                : (CATEGORY_COLORS[expense.category] || COLOR_PALETTE.Gray);
              const IconComponent = catObj
                ? getCategoryIcon(catObj.icon)
                : getCategoryIcon(expense.category);

              const displayDesc = expense.description || expense.title || "";
              const relativeTime = getRelativeTime(expense);

              return (
                <motion.div
                  key={expense.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, borderColor: "rgba(255,255,255,0.08)" }}
                  className="group flex items-center justify-between p-4 bg-[#16161A] border border-white/5 rounded-2xl relative transition-all duration-200"
                >
                  {/* Timeline bullet decorator */}
                  <div className="absolute left-[-30px] top-[22px] w-2 h-2 rounded-full bg-[#16161A] border border-[#6B21A8]/80 group-hover:bg-[#A855F7] group-hover:border-primary/50 transition-colors" />

                  <div className="flex items-center gap-4 min-w-0">
                    {/* Left: Icon */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F0F11] border border-white/5 ${catColor.text}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {/* Middle: Details */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <h4 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                          {displayDesc}
                        </h4>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wide ${catColor.text}`}>
                          {expense.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                        <span>{formatDate(expense.date)}</span>
                        {relativeTime && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[#A855F7]/80 font-medium">{relativeTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-extrabold text-white">
                      {formatCurrency(expense.amount)}
                    </span>

                    {/* Compact Hover Actions */}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEdit(expense)}
                        className="p-1.5 rounded-lg border border-white/5 bg-[#0F0F11] text-[#9CA3AF] hover:text-primary hover:border-primary/20 transition-all"
                        title="Edit Expense"
                      >
                        <FiEdit2 className="h-3.5 w-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(expense.id)}
                        className="p-1.5 rounded-lg border border-white/5 bg-[#0F0F11] text-[#9CA3AF] hover:text-danger hover:border-danger/20 transition-all"
                        title="Delete Expense"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export default ExpenseList;
