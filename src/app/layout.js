// src/app/layout.js
import "./globals.css";
import NavBar from "../components/NavBar";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "Infectious Diseases Portal · ID North West",
  description: "Clinical tools for infectious diseases",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}>
        {/* Accessibility: keyboard users can jump past the nav */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 rounded px-3 py-2
                     bg-black text-white dark:bg-white dark:text-black"
        >
          Skip to content
        </a>

        <NavBar />

        <main id="content" className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6 py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
