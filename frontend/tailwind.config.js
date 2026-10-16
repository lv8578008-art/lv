/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7FAFC",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#0E7468",
          dark: "#0A5249",
          mint: "#E7F5F1",
          light: "#E0F2FE",
        },
        gold: {
          DEFAULT: "#C49A45",
          dark: "#A37A2C",
          light: "#FDF8E8",
        },
        dark: {
          DEFAULT: "#1F2937",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        border: "#E5E7EB",
        success: "#15803D",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(14, 116, 104, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(14, 116, 104, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'gold-glow': '0 4px 20px rgba(196, 154, 69, 0.15)',
      }
    },
  },
  plugins: [],
}
