import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import CategorySelector from "../expense/CategorySelector";

function AddExpenseModal({ isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    category_id: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

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
    if (!formData.category_id) newErrors.category_id = "Category is required";
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
    onSave(formData);
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-md bg-surface border border-default rounded-dialog p-6 shadow-md z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#111827]">Add Expense</h3>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <CategorySelector
              selectedCategory={formData.category_id}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, category_id: value }));
                if (errors.category_id) {
                  setErrors((prev) => ({ ...prev, category_id: "" }));
                }
              }}
              error={errors.category_id}
            />

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Description
              </label>
              <input
                type="text"
                name="description"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-[#F1F5F9] border border-default rounded-input px-4 py-2.5 text-[#111827] placeholder-[#6B7280]/40 focus:outline-none focus:border-primary transition-colors"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Amount (INR)
              </label>
              <input
                type="number"
                name="amount"
                step="any"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-[#F1F5F9] border border-default rounded-input px-4 py-2.5 text-[#111827] placeholder-[#6B7280]/40 focus:outline-none focus:border-primary transition-colors"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-[#F1F5F9] border border-default rounded-input px-4 py-2.5 text-[#111827] focus:outline-none focus:border-primary transition-colors"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 rounded-btn border border-default bg-transparent py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-btn bg-primary hover:bg-primaryHover text-white py-2.5 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Expense"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AddExpenseModal;
