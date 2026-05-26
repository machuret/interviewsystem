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
      // Fluid type scale — clamp(min, preferred, max)
      // Viewport range: 375px (mobile) → 1280px (desktop)
      fontSize: {
        "fluid-display":  ["clamp(1.75rem, 1.2rem + 2.2vw, 3rem)",      { lineHeight: "1.1",  letterSpacing: "-0.03em"  }],
        "fluid-heading":  ["clamp(1.375rem, 1rem + 1.56vw, 2.25rem)",   { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "fluid-title":    ["clamp(1.125rem, 0.875rem + 1.1vw, 1.75rem)",{ lineHeight: "1.2",  letterSpacing: "-0.02em"  }],
        "fluid-lead":     ["clamp(1rem, 0.9rem + 0.44vw, 1.25rem)",     { lineHeight: "1.6",  letterSpacing: "0"        }],
      },
    },
  },
  plugins: [],
};

export default config;
