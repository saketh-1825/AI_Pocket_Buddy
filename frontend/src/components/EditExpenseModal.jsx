import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

function EditExpenseModal({ isOpen, onClose, onUpdate, expense, isUpdating, categories = [] }) {
  const [formData, setFormData] = useState(() => {
    if (!expense) {
      return {
        category: "",
        description: "",
        amount: "",
        date: "",
      };
    }
    
    let dateString = "";
    if (expense.date) {
      try {
        dateString = new Date(expense.date).toISOString().split("T")[0];
      } catch (e) {
        console.error("Failed to parse expense date", e);
      }
    }

    const descriptionValue = expense.description || expense.title || "";

    return {
      category: expense.category || "",
      description: descriptionValue,
      amount: expense.amount ? expense.amount.toString() : "",
      date: dateString,
    };
  });

  const [errors, setErrors] = useState({});

  if (!isOpen || !expense) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    
    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else {
      const numAmount = parseFloat(formData.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
    }

    if (!formData.date) newErrors.date = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onUpdate(expense.id, formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[#16161A] p-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Edit Expense</h3>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="text-[#9CA3AF] hover:text-white transition-colors"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-[#0F0F11] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-danger">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                Description
              </label>
              <input
                type="text"
                name="description"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-[#0F0F11] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-[#9CA3AF]/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-danger">{errors.description}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                Amount (INR)
              </label>
              <input
                type="number"
                name="amount"
                step="any"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-[#0F0F11] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-[#9CA3AF]/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-danger">{errors.amount}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-[#0F0F11] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-danger">{errors.date}</p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                disabled={isUpdating}
                className="flex-1 rounded-xl border border-white/10 bg-transparent py-2.5 text-sm font-medium text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-white"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isUpdating}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/95 disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default EditExpenseModal;
