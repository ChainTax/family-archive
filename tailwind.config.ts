import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // RGB 채널 변수 사용 → opacity 수식어(/10, /90 등) 완전 지원
        brand:           "rgb(var(--color-brand-rgb) / <alpha-value>)",
        "brand-hover":   "rgb(var(--color-brand-hover-rgb) / <alpha-value>)",
        "bg-primary":    "rgb(var(--color-bg-primary-rgb) / <alpha-value>)",
        "bg-secondary":  "rgb(var(--color-bg-secondary-rgb) / <alpha-value>)",
        "text-primary":  "rgb(var(--color-text-primary-rgb) / <alpha-value>)",
        "text-secondary":"rgb(var(--color-text-secondary-rgb) / <alpha-value>)",
        "text-tertiary": "rgb(var(--color-text-tertiary-rgb) / <alpha-value>)",
        "border-default":"rgb(var(--color-border-default-rgb) / <alpha-value>)",
        "border-strong": "rgb(var(--color-border-strong-rgb) / <alpha-value>)",
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
