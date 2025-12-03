/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {},
      fontWeight: {},
      fontSize: {},
      spacing: {},
      borderRadius: {},
      fontFamily: {
        sans: ["Pretendard", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};