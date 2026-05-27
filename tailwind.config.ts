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
          "black-soft":     "#111111",
          "black-card":     "#1a1a1a",
          "black-border":   "#2e2e2e",
          "black-row":      "#161616",
          // 4-level text system (down from 6)
          "text-primary":   "#f5f5f5",   // headings, key info
          "text-body":      "#e0e0e8",   // body copy  (was #e5e5e5 — kept close)
          "text-secondary": "#a8a8b3",   // labels, subtext
          "text-tertiary":  "#666680",   // muted — meets WCAG AA on dark bg
          "text-muted":     "#666680",   // alias — same as tertiary
          "text-disabled":  "#3f3f50",   // placeholder, ghost text
          "text-ghost":     "#3f3f50",   // alias — same as disabled
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "fluid-display": ["clamp(1.75rem, 1.2rem + 2.2vw, 3rem)",       { lineHeight: "1.08", letterSpacing: "-0.03em"  }],
        "fluid-heading": ["clamp(1.375rem, 1rem + 1.56vw, 2.25rem)",    { lineHeight: "1.13", letterSpacing: "-0.025em" }],
        "fluid-title":   ["clamp(1.125rem, 0.875rem + 1.1vw, 1.75rem)", { lineHeight: "1.2",  letterSpacing: "-0.02em"  }],
        "fluid-lead":    ["clamp(1rem, 0.9rem + 0.44vw, 1.25rem)",      { lineHeight: "1.6",  letterSpacing: "0"        }],
      },
    },
  },
  plugins: [],
};

export default config;
