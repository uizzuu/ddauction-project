import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/css/**/*.css",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", ...defaultTheme.fontFamily.sans],
      },
      // Add custom spacing, colors, etc. here if needed
      // Don't override with empty objects - it disables all default utilities
    },
  },
  plugins: [],
};