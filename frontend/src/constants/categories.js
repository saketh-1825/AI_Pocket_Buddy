import {
  FiCompass,
  FiShoppingBag,
  FiTv,
  FiActivity,
  FiFolder,
  FiBookOpen,
  FiGift,
  FiHeart,
  FiCoffee,
  FiMapPin,
  FiPlayCircle,
  FiDollarSign,
} from "react-icons/fi";

// Colors palette mapping for styling categories
export const COLOR_PALETTE = {
  Green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", hex: "#22C55E" },
  green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", hex: "#22C55E" },
  Blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", hex: "#3B82F6" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", hex: "#3B82F6" },
  Purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", hex: "#A855F7" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", hex: "#A855F7" },
  Orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", hex: "#F97316" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", hex: "#F97316" },
  Pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", hex: "#EC4899" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", hex: "#EC4899" },
  Gray: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", hex: "#9CA3AF" },
  gray: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", hex: "#9CA3AF" },
  Red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", hex: "#EF4444" },
  red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", hex: "#EF4444" },
  Indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", hex: "#6366F1" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", hex: "#6366F1" },
  Teal: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", hex: "#14B8A6" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", hex: "#14B8A6" },
  Yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", hex: "#EAB308" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", hex: "#EAB308" },
};

// React-icons mapping for category identifiers
export const ICON_MAP = {
  Food: FiCoffee,
  utensils: FiCoffee,
  Transport: FiCompass,
  compass: FiCompass,
  Shopping: FiShoppingBag,
  "shopping-bag": FiShoppingBag,
  Entertainment: FiTv,
  tv: FiTv,
  Health: FiActivity,
  activity: FiActivity,
  Others: FiFolder,
  folder: FiFolder,
  Books: FiBookOpen,
  book: FiBookOpen,
  Gift: FiGift,
  gift: FiGift,
  Heart: FiHeart,
  heart: FiHeart,
  Coffee: FiCoffee,
  coffee: FiCoffee,
  Travel: FiMapPin,
  travel: FiMapPin,
  Gaming: FiPlayCircle,
  gaming: FiPlayCircle,
  Finance: FiDollarSign,
  dollar: FiDollarSign,
};

// Resolve category styles dynamically
export const getCategoryStyles = (colorName) => {
  return COLOR_PALETTE[colorName] || COLOR_PALETTE.gray;
};

// Resolve category icon component dynamically
export const getCategoryIcon = (iconName) => {
  return ICON_MAP[iconName] || FiFolder;
};

// Backward compatibility helper mapping names to styles
export const CATEGORY_COLORS = {
  Food: COLOR_PALETTE.Green,
  Transport: COLOR_PALETTE.Blue,
  Shopping: COLOR_PALETTE.Purple,
  Entertainment: COLOR_PALETTE.Orange,
  Health: COLOR_PALETTE.Pink,
  Others: COLOR_PALETTE.Gray,
};
