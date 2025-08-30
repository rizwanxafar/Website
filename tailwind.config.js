// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:  "var(--color-primary)",
        accent:   "var(--color-accent)",
        secondary:"var(--color-secondary)",
        midnight: "var(--color-midnight)",

        bg:    "var(--bg)",
        fg:    "var(--fg)",
        muted: "var(--muted)",
        border:"var(--border)",
        card:  "var(--card)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      container: {
        center: true,
        padding: "1rem",
        screens: { "2xl": "72rem" },
      },
    },
  },
  plugins: [],
};
