import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  screens: {
    xs: "375px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  container: {
    center: true,
    padding: {
      DEFAULT: "1rem",
      sm: "2rem",
      lg: "4rem",
      xl: "5rem",
      "2xl": "6rem",
    },
  },
  extend: {
    fontFamily: {
      sans: ["Pretendard", ...defaultTheme.fontFamily.sans],
    },
    colors: {
      primary: "#111",
    },
  },
  plugins: [],
  // Tailwind v3 호환성 유지
  corePlugins: {
    preflight: true,
  },
};
