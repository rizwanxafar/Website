// src/app/layout.js
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";

// 1. Setup Fonts: "Inter" for reading, "JetBrains Mono" for data
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "ID Northwest",
  description: "Clinical decision support for infectious diseases.",
};

export default function RootLayout({ children }) {
  return (
    // 2. FORCE BLACK BACKGROUND on the HTML tag (Fixes the overscroll white gap)
    <html lang="en" className="h-full bg-black">
      <body className={`${inter.variable} ${mono.variable} font-sans min-h-full bg-black text-neutral-200 antialiased selection:bg-emerald-500/30 selection:text-emerald-200`}>
        
        {/* Accessibility: Skip to content for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] rounded px-3 py-2
                     bg-emerald-500 text-black font-mono text-sm font-bold"
        >
          Skip to content
        </a>

        {/* 3. NO NAVBAR & NO WIDTH LIMITS */}
        {/* We render {children} directly. The page.js will handle the layout. */}
        {children}
        
      </body>
    </html>
  );
}
