"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold text-neutral-900 dark:text-neutral-100"
        >
          ID Northwest
        </Link>
      </div>
    </nav>
  );
}
