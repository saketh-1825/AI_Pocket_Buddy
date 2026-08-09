import React from "react";

const COLORS = [
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Green", hex: "#22C55E" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Orange", hex: "#F97316" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Slate", hex: "#64748B" }
];

export default function ColorPicker({ selectedColor, onSelect }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {COLORS.map((color) => {
        const isSelected = selectedColor?.toLowerCase() === color.hex.toLowerCase();
        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onSelect(color.hex)}
            className={`h-8 w-full rounded-lg border transition-all flex items-center justify-center cursor-pointer focus:outline-none ${
              isSelected
                ? "border-[#111827] ring-2 ring-[#4F46E5]/20 scale-105"
                : "border-[#E5E7EB] hover:border-[#6B7280]"
            }`}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          >
            {isSelected && (
              <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
            )}
          </button>
        );
      })}
    </div>
  );
}
