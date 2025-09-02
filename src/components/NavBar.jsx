"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home" },
  { href: "/algorithms", label: "Algorithms" },
  { href: "/guidelines", label: "Guidelines" },
  { href: "/teaching", label: "Education" },
];

// Normalise paths
function normalize(p = "/") {
  if (!p) return "/";
  return p.length > 1 ? p.replace(/\/+$/, "") : "/";
}

function isActive(pathname, href) {
  const path = normalize(pathname);
  const target = normalize(href);
  if (target === "/") return path === "/";
  return path === target || path.startsWith(target + "/");
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white bg-[hsl(var(--midnight))] dark:bg-[hsl(var(--brand-alt))]">
            ID
          </span>
          <span>ID North West</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  active
                    ? "text-[hsl(var(--midnight))] dark:text-[hsl(var(--brand-alt))]"
                    : "text-[hsl(var(--accent))] dark:text-slate-300 hover:text-[hsl(var(--midnight))] dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
