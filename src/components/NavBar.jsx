"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home" },
  { href: "/algorithms", label: "Algorithms" },
  { href: "/guidelines", label: "Guidelines" },
  { href: "/teaching", label: "Education" },
];

function normalizePathname(p = "/") {
  if (!p) return "/";
  return p.length > 1 ? p.replace(/\/+$/, "") : "/";
}

function isActive(pathname, href) {
  const path = normalizePathname(pathname);
  const target = normalizePathname(href);
  if (target === "/") return path === "/";
  return path === target || path.startsWith(target + "/");
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-900 font-semibold hover:opacity-80 transition-opacity"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold bg-brand">
            ID
          </span>
          <span className="text-sm font-semibold tracking-tight">ID North West</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/8 text-brand font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
