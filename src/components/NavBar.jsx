"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
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
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-slate-900 tracking-tight text-base"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          ID<span className="text-brand">·</span>Northwest
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative text-sm font-medium transition-colors group ${
                  active
                    ? "text-slate-900"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {item.label}
                <span
                  className={`absolute left-0 right-0 -bottom-1 h-px bg-slate-900 origin-left transition-transform ${
                    active
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
          <Link
            href="mailto:infectionnw@gmail.com"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
