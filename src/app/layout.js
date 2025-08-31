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
  title: "Your Site",
  description: "Healthcare tools",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply global light/dark canvas on <body> */}
      <body
        className={`${inter.className} bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}
      >
        <NavBar />
        <main className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6 py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
