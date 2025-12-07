import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: "#111",
      },
    },
  },
  plugins: [],
  // Tailwind v3 호환성 유지
  corePlugins: {
    preflight: true,
  },
};
