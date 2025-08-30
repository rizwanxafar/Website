// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // toggled by adding/removing 'dark' on <html>
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Roboto comes from next/font in layout.js
        sans: ["var(--font-sans)", "system-ui", "Arial"],
      },
      colors: {
        // Semantic colors provided by CSS variables in globals.css
        bg: "hsl(var(--bg))",
        fg: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",

        // Brand palette (from your hex choices)
        brand: "hsl(var(--brand))",
        brandAlt: "hsl(var(--brand-alt))",
        accent: "hsl(var(--accent))",
        midnight: "hsl(var(--midnight))",

        // Optional status colors if you use banners
        risk: {
          low: "hsl(var(--risk-low))",
          med: "hsl(var(--risk-med))",
          high: "hsl(var(--risk-high))",
        },
      },
      borderRadius: {
        DEFAULT: "0.5rem", // buttons/inputs
        card: "1rem",      // cards
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.06)",
        overlay: "0 12px 32px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};
