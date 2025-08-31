"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Inline SVG icon (React 19 safe) */
function HomeIcon({ className = "w-5 h-5", strokeWidth = 1.5 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10L12 3l9 7" />
      <path d="M5 22V12" />
      <path d="M19 22V12" />
      <path d="M5 22h14" />
      <path d="M10 22v-6h4v6" />
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between">
        {/* Left side: Brand with icon */}
        <div className="flex items-center gap-2">
          <HomeIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
          <Link
            href="/"
            className="font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Your Site
          </Link>
        </div>

        {/* Right side: navigation links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`${
              pathname === "/"
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "text-neutral-700 dark:text-neutral-300"
            } hover:text-blue-600 dark:hover:text-blue-400 transition`}
          >
            Home
          </Link>
          <Link
            href="/algorithms"
            className={`${
              pathname?.startsWith("/algorithms")
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "text-neutral-700 dark:text-neutral-300"
            } hover:text-blue-600 dark:hover:text-blue-400 transition`}
          >
            Algorithms
          </Link>
          <Link
            href="/about"
            className={`${
              pathname === "/about"
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "text-neutral-700 dark:text-neutral-300"
            } hover:text-blue-600 dark:hover:text-blue-400 transition`}
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
