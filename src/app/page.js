// src/app/page.js
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Small reveal-on-scroll wrapper (respects prefers-reduced-motion)
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2",
        "motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-64px)] relative">
      {/* Futuristic background: fine grid + soft aurora */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {/* fine dotted grid */}
        <div className="absolute inset-0 opacity-[10] dark:opacity-[0.10] [background:radial-gradient(currentColor_1px,transparent_1.5px)] [background-size:18px_18px] text-slate-600 dark:text-slate-300" />
        {/* aurora wash */}
        <div className="absolute inset-0 opacity-60 dark:opacity-25 blur-2xl [mask-image:radial-gradient(60%_40%_at_50%_20%,black,transparent_70%)]">
          <div className="absolute -top-24 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,theme(colors.violet.500/.35),theme(colors.sky.400/.25),theme(colors.cyan.400/.25),transparent_70%)]" />
        </div>
      </div>

      {/* Hero */}
      <section className="relative isolate overflow-hidden py-20 sm:py-28">
        {/* retain your original soft violet radial as a subtle layer */}
        <div className="absolute inset-0 -z-10 opacity-10 dark:opacity-20 bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.violet.300/40%),transparent_60%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.violet.300/15%),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Infectious Diseases North West
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
                Practical algorithms, local guidelines, and education for ID clinicians in the North&nbsp;West.
              </p>
              {/* Hero CTAs */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {/* Primary CTA with brand colour */}
                <Link
                  href="#sections"
                  className="rounded-xl px-5 py-3 text-sm font-medium text-white transition
                             bg-[hsl(var(--brand))] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-[hsl(var(--brand))]/70"
                >
                  Explore the site
                </Link>
                {/* Secondary CTA unchanged */}
                <Link
                  href="/algorithms"
                  className="rounded-xl px-5 py-3 text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 transition"
                >
                  Go to Algorithms
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ... rest of the file unchanged ... */}
    </main>
  );
}
