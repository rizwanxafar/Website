// src/app/layout.js
import "./globals.css";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "ID Northwest",
  description:
    "Infectious Diseases algorithms, guidelines, calculators, and teaching resources.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent light/dark flash based on saved preference or system */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`,
          }}
        />
      </head>
      <body className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased">
        <NavBar />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        {/* Footer removed as requested */}
      </body>
    </html>
  );
}
