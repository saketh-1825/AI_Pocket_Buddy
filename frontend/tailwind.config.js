/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F6F8FC",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        primary: "#5B4CF0",
        primaryHover: "#4F46E5",
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#D97706",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        textMuted: "#9CA3AF",
        hoverAccent: "#F8FAFC",
        activeBg: "#EEF2FF"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        btn: "14px",
        input: "14px",
        card: "20px",
        dialog: "20px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(15,23,42,0.04)",
        md: "0 6px 18px rgba(15,23,42,0.06)",
        soft: "0 2px 8px rgba(15,23,42,0.04)",
      },
    },
  },
  plugins: [],
}
