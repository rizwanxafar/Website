/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/app/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "Arial"],
      },
      colors: {
        bg: "hsl(var(--bg))",
        fg: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        brand: "hsl(var(--brand))",
        brandAlt: "hsl(var(--brand-alt))",
        accent: "hsl(var(--accent))",
        midnight: "hsl(var(--midnight))",
        risk: { low: "hsl(var(--risk-low))", med: "hsl(var(--risk-med))", high: "hsl(var(--risk-high))" },
      },
      borderRadius: { DEFAULT: "0.5rem", card: "1rem" },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.06)",
        overlay: "0 12px 32px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};
