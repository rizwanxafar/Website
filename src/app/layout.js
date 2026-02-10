import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// 1. LOAD FONTS
// We use Inter for UI text (clean, legible) and JetBrains Mono for data (technical look).
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

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
        - bg-slate-950: Matches your new dashboard background
        - text-slate-200: Default high-contrast text
        - antialiased: Makes text look sharper on NHS monitors
      */}
      <body className="bg-slate-950 text-slate-200 antialiased min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
