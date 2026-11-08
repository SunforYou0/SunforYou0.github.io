/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme")
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}"],
  darkMode: "class", // allows toggling dark mode manually
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "sans-serif", ...defaultTheme.fontFamily.sans],
      },
      screens: {
        // 文章页三栏布局的起始宽度（1360–1535 使用紧凑侧栏）
        wide: "1360px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
