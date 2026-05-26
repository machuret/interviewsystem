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
          orange: "#f97316",
          "orange-dark": "#ea580c",
          "orange-light": "#fed7aa",
          black: "#0a0a0a",
          "black-soft": "#141414",
          "black-card": "#1c1c1c",
          "black-border": "#2a2a2a",
          "black-hover": "#222222",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
