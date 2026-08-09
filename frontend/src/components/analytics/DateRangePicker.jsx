import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCalendar, FiX } from "react-icons/fi";

export default function DateRangePicker({ selectedRange, onRangeChange, startDate, endDate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate || "");
  const [tempEnd, setTempEnd] = useState(endDate || "");

  const options = [
    { id: "7d", label: "7D" },
    { id: "30d", label: "30D" },
    { id: "90d", label: "90D" },
    { id: "custom", label: "CUSTOM" },
  ];

  const handleOptionClick = (optionId) => {
    if (optionId === "custom") {
      setIsModalOpen(true);
    } else {
      onRangeChange(optionId, "", "");
    }
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    if (tempStart && tempEnd) {
      onRangeChange("custom", tempStart, tempEnd);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Pills Container */}
      <div className="flex bg-slate-100 p-1 border border-default rounded-full select-none">
        {options.map((opt) => {
          const isSelected = selectedRange === opt.id;
          return (
            <motion.button
              key={opt.id}
              whileHover={{ 
                borderColor: "#4F46E5",
              }}
              onClick={() => handleOptionClick(opt.id)}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 border border-transparent ${
                isSelected 
                  ? "bg-primary text-white border-primary shadow-sm" 
                  : "bg-transparent text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Custom Range Display */}
      {selectedRange === "custom" && startDate && endDate && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-default rounded-full text-xs text-[#64748B] font-bold">
          <FiCalendar className="text-primary h-3.5 w-3.5" />
          <span>{startDate} to {endDate}</span>
        </div>
      )}

      {/* Date Picker Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm overflow-hidden rounded-dialog border border-default bg-surface p-6 shadow-md z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                  <FiCalendar className="text-primary h-4 w-4" />
                  Select Custom Range
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCustomApply} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full bg-[#F1F5F9] border border-default rounded-input px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full bg-[#F1F5F9] border border-default rounded-input px-4 py-2.5 text-[#0F172A] focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-default">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-btn border border-default bg-transparent py-2.5 text-xs font-bold uppercase tracking-wider text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-btn bg-primary hover:bg-primaryHover py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-200"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

