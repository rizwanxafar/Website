import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// 1. LOAD FONTS
// Inter for UI text (clean, legible)
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

// JetBrains Mono for data, IDs, and "Technical" elements
const mono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "ID-Northwest | Clinical OS",
  description: "Infectious Diseases Clinical Operating System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      {/* 2. APPLY GLOBAL THEME
         - bg-slate-900: Matches the Dashboard component exactly.
         - text-slate-200: High readability.
         - antialiased: Crucial for font clarity on older screens.
      */}
      <body className="bg-slate-900 text-slate-200 antialiased min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
