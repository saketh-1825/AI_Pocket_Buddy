import React from "react";
import { getCategoryEmoji, getCategoryStyles } from "../../constants/categories";
import { FiPlus, FiTrash2 } from "react-icons/fi";

export default function CategoryDropdown({ categories = [], selectedCategory, onSelect, onDeleteClick, onAddNewClick }) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[280px]">
      {/* Category list */}
      <div className="overflow-y-auto flex-1 py-1 px-1.5 space-y-0.5">
        {categories.length === 0 ? (
          <p className="px-4 py-3 text-xs text-[#6B7280] text-center font-medium">
            No categories available.
          </p>
        ) : (
          categories.map((cat) => {
            const emoji = getCategoryEmoji(cat.icon_key);
            const style = getCategoryStyles(cat.color);
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                className={`group flex items-center justify-between rounded-[12px] hover:bg-[#F8FAFC] transition-all cursor-pointer ${
                  isSelected ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-[#111827]"
                }`}
                style={{ padding: "12px 14px" }}
                onClick={() => onSelect(cat.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base select-none shrink-0">{emoji}</span>
                  <span className="truncate text-sm font-semibold">{cat.name}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ml-1"
                    style={{ backgroundColor: style.hex || "#94A3B8" }}
                  />
                </div>
                
                {/* Delete button (only visible on hover for custom categories) */}
                {!cat.is_default && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(cat);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all duration-150 cursor-pointer focus:outline-none"
                    title="Delete Category"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pinned Add New Category action at the bottom */}
      <div className="border-t border-[#E5E7EB] bg-slate-50/80 p-1.5 shrink-0">
        <button
          type="button"
          onClick={onAddNewClick}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-[#4F46E5] hover:bg-[#EEF2FF] rounded-lg transition-all cursor-pointer focus:outline-none"
        >
          <FiPlus className="h-4 w-4 shrink-0" />
          <span>Add New Category</span>
        </button>
      </div>
    </div>
  );
}
