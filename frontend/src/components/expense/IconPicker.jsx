import React from "react";

const ICONS = [
  { id: "food", emoji: "🍔", label: "Food" },
  { id: "coffee", emoji: "☕", label: "Coffee" },
  { id: "shopping", emoji: "🛍", label: "Shopping" },
  { id: "bills", emoji: "💡", label: "Bills" },
  { id: "subscriptions", emoji: "📺", label: "Subscriptions" },
  { id: "travel", emoji: "✈", label: "Travel" },
  { id: "car", emoji: "🚗", label: "Car" },
  { id: "fuel", emoji: "⛽", label: "Fuel" },
  { id: "health", emoji: "🏥", label: "Health" },
  { id: "medicine", emoji: "💊", label: "Medicine" },
  { id: "movie", emoji: "🎬", label: "Movie" },
  { id: "gift", emoji: "🎁", label: "Gift" },
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "education", emoji: "🎓", label: "Education" },
  { id: "pets", emoji: "🐶", label: "Pets" },
  { id: "investment", emoji: "📈", label: "Investment" },
  { id: "salary", emoji: "💼", label: "Salary" },
  { id: "freelance", emoji: "💻", label: "Freelance" },
  { id: "tax", emoji: "🧾", label: "Tax" },
  { id: "others", emoji: "📦", label: "Others" }
];

export default function IconPicker({ selectedIcon, onSelect }) {
  return (
    <div className="grid grid-cols-5 gap-2 max-h-[140px] overflow-y-auto p-2 border border-[#E5E7EB] rounded-xl bg-slate-50/50">
      {ICONS.map((item) => {
        const isSelected = selectedIcon?.toLowerCase() === item.id.toLowerCase();
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all cursor-pointer select-none focus:outline-none ${
              isSelected
                ? "bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5] scale-[1.03] shadow-sm"
                : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#6B7280]/30 hover:text-[#111827]"
            }`}
            title={item.label}
          >
            <span className="text-[18px]">{item.emoji}</span>
            <span className="text-[9px] font-semibold mt-1 truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
