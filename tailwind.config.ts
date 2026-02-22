import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#3182F6",
        "brand-hover": "#1B64DA",
        "bg-primary": "#FFFFFF",
        "bg-secondary": "#F2F4F6",
        "text-primary": "#191F28",
        "text-secondary": "#4E5968",
        "text-tertiary": "#8B95A1",
        "border-default": "#E5E8EB",
        "border-strong": "#C9CDD2",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Pretendard'",
          "'Apple SD Gothic Neo'",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
