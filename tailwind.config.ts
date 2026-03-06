import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        primary: {
          50: "#f0f9f4",
          100: "#dcf2e6",
          200: "#bbe5cf",
          300: "#8dd1b0",
          400: "#57b58b",
          500: "#339970",
          600: "#237a58",
          700: "#1d6248",
          800: "#1a4e3a",
          900: "#164030",
          950: "#0b2420",
        },
        slate: {
          850: "#1a2332",
        }
      },
    },
  },
  plugins: [],
};
export default config;
