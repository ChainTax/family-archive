import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#CC7A4A",
        "brand-hover": "#B5622E",
        "bg-primary": "#FAFAF8",
        "bg-secondary": "#F2F0E8",
        "text-primary": "#1C1B18",
        "text-secondary": "#5C5850",
        "text-tertiary": "#9C9890",
        "border-default": "#E5E0D8",
        "border-strong": "#CFC9BF",
      },
      fontFamily: {
        sans: [
          "'Noto Sans KR'",
          "-apple-system",
          "BlinkMacSystemFont",
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
