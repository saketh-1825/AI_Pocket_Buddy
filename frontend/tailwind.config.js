/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F0F11",
        surface: "#16161A",
        primary: "#A855F7",
        secondary: "#9CA3AF",
        success: "#22C55E",
        danger: "#EF4444",
        muted: "#6B21A8",
      },
      borderRadius: {
        xl2: "16px",
      },
    },
  },
  plugins: [],
}

