import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import IconPicker from "./IconPicker";
import ColorPicker from "./ColorPicker";
import { useCategoryStore } from "../../store/categoryStore";

export default function AddCategoryModal({ isOpen, onClose, onCategoryCreated }) {
  const { categories, addCategory } = useCategoryStore();
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("food");
  const [selectedColor, setSelectedColor] = useState("#4F46E5");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 25) {
      setError("Name must be between 2 and 25 characters.");
      return;
    }

    // Duplicate check in local store categories
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setError(`Category "${trimmedName}" already exists.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await addCategory({
        name: trimmedName,
        icon_key: selectedIcon,
        color: selectedColor
      });

      toast.success("Category created successfully.", { theme: "light" });

      // Re-fetch latest from store to find matching item with server ID
      const latestCategories = useCategoryStore.getState().categories;
      const createdCategory = latestCategories.find(
        (c) => c.id === res.id || c.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (!createdCategory) {
        throw new Error("Created category could not be verified from the server list");
      }

      onCategoryCreated(createdCategory);
      setName("");
      setSelectedIcon("food");
      setSelectedColor("#4F46E5");
      onClose();
    } catch (err) {
      console.error("AddCategoryModal: Failed to create category:", err);
      const errMsg = err.response?.data?.detail || err.message || "Failed to create category. Please try again.";
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Surface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative max-w-[420px] w-full bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-lg z-10 flex flex-col gap-5 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="text-lg font-bold text-[#111827]">New Category</h3>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Category Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Pets, Books"
                value={name}
                maxLength={25}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className="w-full bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] placeholder-[#6B7280]/40 focus:outline-none focus:border-[#4F46E5] transition-colors text-sm font-medium"
              />
              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
            </div>

            {/* Icon Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Icon
              </label>
              <IconPicker selectedIcon={selectedIcon} onSelect={setSelectedIcon} />
            </div>

            {/* Color Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Color
              </label>
              <ColorPicker selectedColor={selectedColor} onSelect={setSelectedColor} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-[#6B7280] hover:text-[#111827] bg-white border border-[#E5E7EB] rounded-xl transition-all cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#5B4CF0] hover:bg-[#5b4cf0]/90 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer select-none"
              >
                {isSubmitting ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
