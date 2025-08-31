// src/components/NavBar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react"; // <-- Lucide icon

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between">
        {/* Left side: Brand with icon */}
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-neutral-700 dark:text-neutral-200" strokeWidth={1.5} />
          <Link href="/" className="font-semibold text-neutral-900 dark:text-neutral-100">
            Your Site
          </Link>
        </div>

        {/* Right side: navigation links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`${
              pathname === "/"
                ? "text-brand-600 dark:text-brand-400 font-medium"
                : "text-neutral-700 dark:text-neutral-300"
            } hover:text-brand-600 dark:hover:text-brand-400 transition`}
          >
            Home
          </Link>
          <Link
            href="/algorithms"
            className={`${
              pathname?.startsWith("/algorithms")
                ? "text-brand-600 dark:text-brand-400 font-medium"
                : "text-neutral-700 dark:text-neutral-300"
            } hover:text-brand-600 dark:hover:text-brand-400 transition`}
          >
            Algorithms
          </Link>
          <Link
            href="/about"
            className={`${
              pathname === "/about"
                ? "text-brand-600 dark:text-brand-400 font-medium"
                : "text-neutral-700 dark:text-neutral-300"
            } hover:text-brand-600 dark:hover:text-brand-400 transition`}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
