/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: [
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/app/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // We map these to the CSS variables defined in globals.css
        brand: "hsl(var(--brand) / <alpha-value>)",
        brandAlt: "hsl(var(--brand-alt) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        midnight: "hsl(var(--midnight) / <alpha-value>)",
      }
    },
  },
  plugins: [],
};
