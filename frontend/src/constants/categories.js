import * as FiIcons from "react-icons/fi";

// Dictionary mapping icon_key to React Icons components
const ICON_MAP = {
  food: FiIcons.FiCoffee,
  coffee: FiIcons.FiCoffee,
  shopping: FiIcons.FiShoppingBag,
  bills: FiIcons.FiDollarSign,
  travel: FiIcons.FiMapPin,
  car: FiIcons.FiCompass,
  fuel: FiIcons.FiCompass,
  health: FiIcons.FiActivity,
  medicine: FiIcons.FiActivity,
  movie: FiIcons.FiTv,
  gift: FiIcons.FiGift,
  home: FiIcons.FiHome,
  education: FiIcons.FiBookOpen,
  pets: FiIcons.FiHeart,
  investment: FiIcons.FiDollarSign,
  salary: FiIcons.FiBriefcase,
  freelance: FiIcons.FiBriefcase,
  tax: FiIcons.FiPercent,
  subscriptions: FiIcons.FiPlayCircle,
  others: FiIcons.FiFolder
};

// Dictionary mapping icon_key to visual emojis
const EMOJI_MAP = {
  food: "🍔",
  coffee: "☕",
  shopping: "🛍",
  bills: "💡",
  subscriptions: "📺",
  travel: "✈",
  car: "🚗",
  fuel: "⛽",
  health: "🏥",
  medicine: "💊",
  movie: "🎬",
  gift: "🎁",
  home: "🏠",
  education: "🎓",
  pets: "🐶",
  investment: "📈",
  salary: "💼",
  freelance: "💻",
  tax: "🧾",
  others: "📦"
};

/**
 * Resolves a React Icon component from an icon_key.
 * @param {string} iconKey
 * @returns {React.Component}
 */
export const getCategoryIcon = (iconKey) => {
  if (!iconKey) return FiIcons.FiFolder;
  const key = String(iconKey).toLowerCase().trim();
  return ICON_MAP[key] || FiIcons.FiFolder;
};

/**
 * Resolves an emoji string from an icon_key.
 * @param {string} iconKey
 * @returns {string}
 */
export const getCategoryEmoji = (iconKey) => {
  if (!iconKey) return "📦";
  const key = String(iconKey).toLowerCase().trim();
  return EMOJI_MAP[key] || "📦";
};

/**
 * Resolves styling classes based on colorHex.
 * @param {string} colorHex
 * @returns {Object}
 */
export const getCategoryStyles = (colorHex) => {
  const hex = colorHex || "#94A3B8";
  
  const palettes = {
    "#4f46e5": { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
    "#3b82f6": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    "#0ea5e9": { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" },
    "#06b6d4": { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
    "#10b981": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    "#22c55e": { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    "#84cc16": { bg: "bg-lime-50", text: "text-lime-600", border: "border-lime-200" },
    "#f59e0b": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    "#f97316": { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    "#f43f5e": { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
    "#ec4899": { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
    "#64748b": { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" },
    // Names compatibility mapping
    "indigo": { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
    "blue": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    "sky": { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" },
    "cyan": { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
    "emerald": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    "green": { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    "lime": { bg: "bg-lime-50", text: "text-lime-600", border: "border-lime-200" },
    "amber": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    "orange": { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    "rose": { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
    "pink": { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
    "slate": { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" }
  };
  
  const matched = palettes[hex.toLowerCase()];
  if (matched) {
    return { ...matched, hex };
  }
  
  return {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    hex
  };
};

/**
 * Resolves chart colors based on colorHex.
 * @param {string} colorHex
 * @returns {string}
 */
export const getCategoryChartColor = (colorHex) => {
  return colorHex || "#94A3B8";
};
