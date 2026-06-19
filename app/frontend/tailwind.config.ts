import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        isb: {
          yellow: "#FFDD00",
          brown: "#3B2800",
          "sand-light": "#FEEAD3",
          "sand-mid": "#FDD5A5",
          terracotta: "#D19571",
          coral: "#F08159",
          blush: "#F8BBAB",
        },
        background: "#FDFAF5",
        foreground: "#3B2800",
        primary: {
          DEFAULT: "#3B2800",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FEEAD3",
          foreground: "#3B2800",
        },
        destructive: {
          DEFAULT: "#F08159",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#FFDD00",
          foreground: "#3B2800",
        },
        muted: {
          DEFAULT: "#FEEAD3",
          foreground: "#D19571",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#3B2800",
        },
        border: "#FDD5A5",
        ring: "#D19571",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        sans: ['"DM Sans"', "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      keyframes: {
        "pulse-skeleton": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "pulse-skeleton": "pulse-skeleton 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
