import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange:           "#f97316",
          "orange-dark":    "#ea580c",
          "orange-light":   "#fed7aa",
          black:            "#0a0a0a",
          "black-soft":     "#141414",
          "black-card":     "#1c1c1c",
          "black-border":   "#2a2a2a",
          "black-row":      "#1a1a1a",
          "text-primary":   "#f5f5f5",
          "text-body":      "#e5e5e5",
          "text-secondary": "#a1a1aa",
          "text-tertiary":  "#777777",
          "text-muted":     "#555555",
          "text-ghost":     "#444444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
