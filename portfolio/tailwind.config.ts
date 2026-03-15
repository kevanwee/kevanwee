import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        cream: {
          50: "#faf8f4",
          100: "#f4ede2",
          200: "#e8dece",
          300: "#d6c9b6",
        },
        sage: {
          50: "#f0f5f2",
          100: "#e0ece5",
          200: "#bcd6c7",
          300: "#93bda7",
          400: "#6b9f89",
          500: "#4e8570",
          600: "#3a6b59",
          700: "#2c5244",
        },
        warm: {
          50: "#faf8f5",
          100: "#f0ebe3",
          200: "#ddd4c8",
          300: "#c4b8aa",
          400: "#a5968a",
          500: "#8a7a6d",
          600: "#6e5f53",
          700: "#524539",
          800: "#352b21",
          900: "#1a1512",
        },
      },
    },
  },
  plugins: [],
};

export default config;
