import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F9F9F6",
          alt: "#FAF8F5",
        },
        sage: {
          DEFAULT: "#4E8752",
          light: "#5B8C5A",
          soft: "#EEF5EE",
          border: "#D5E6D6",
        },
        amber: {
          warm: "#E27D50",
          alt: "#E07A5F",
          soft: "#FDF1EB",
        },
        charcoal: {
          DEFAULT: "#2B2D42",
          alt: "#222222",
        },
        deepgray: {
          DEFAULT: "#4A4E69",
          alt: "#555555",
        },
        mutedgray: {
          DEFAULT: "#8D99AE",
          alt: "#888888",
        },
        cardborder: "#EAEAEA",
      },
      fontFamily: {
        sans: ["var(--font-prompt)", "Prompt", "Kanit", "Sarabun", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(43, 45, 66, 0.05), 0 1px 4px -1px rgba(43, 45, 66, 0.03)",
        "soft-lg": "0 10px 30px -4px rgba(43, 45, 66, 0.07), 0 2px 8px -2px rgba(43, 45, 66, 0.04)",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};
export default config;
