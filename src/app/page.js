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
      {/* Futuristic background: fine grid + soft aurora (very subtle) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        {/* fine dotted grid */}
        <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.10] [background:radial-gradient(currentColor_1px,transparent_1.5px)] [background-size:18px_18px] text-slate-600 dark:text-slate-300" />
        {/* aurora wash */}
        <div className="absolute inset-0 opacity-30 dark:opacity-25 blur-2xl [mask-image:radial-gradient(60%_40%_at_50%_20%,black,transparent_70%)]">
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
              {/* Hero CTAs unchanged, just enhanced hover/focus states */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="#sections"
                  className="rounded-xl px-5 py-3 text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:ring-offset-2 focus:ring-offset-transparent transition"
                >
                  Explore the site
                </Link>
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

      {/* Sections overview */}
      <section
        id="sections"
        className="py-12 sm:py-16 border-t border-slate-200 dark:border-slate-800"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Algorithms */}
            <Reveal delay={50}>
              <Link
                href="/algorithms"
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 hover:shadow-md transition hover:border-violet-300/60 dark:hover:border-violet-700/60 bg-white/60 dark:bg-slate-900/30 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  {/* Sleek 'branching' icon */}
                  <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-sky-400/15 dark:from-violet-500/20 dark:to-sky-400/20 flex items-center justify-center ring-1 ring-inset ring-violet-500/20 group-hover:ring-violet-500/40 transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-violet-700 dark:text-violet-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6 3v6a3 3 0 0 0 3 3h3" />
                      <circle cx="6" cy="3" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <path d="M12 14v7" />
                      <circle cx="12" cy="23" r="0.01" />
                      <path d="M12 12h3a3 3 0 0 0 3-3V3" />
                      <circle cx="18" cy="3" r="2" />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Algorithms
                  </h3>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Clear, step-by-step pathways for common ID scenarios (sepsis, SAB, CNS infection, etc.).
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">
                  View algorithms →
                </span>
              </Link>
            </Reveal>

            {/* Guidelines */}
            <Reveal delay={100}>
              <Link
                href="/guidelines"
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 hover:shadow-md transition hover:border-violet-300/60 dark:hover:border-violet-700/60 bg-white/60 dark:bg-slate-900/30 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  {/* Sleek 'scroll/text' icon */}
                  <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-sky-400/15 dark:from-violet-500/20 dark:to-sky-400/20 flex items-center justify-center ring-1 ring-inset ring-violet-500/20 group-hover:ring-violet-500/40 transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-violet-700 dark:text-violet-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 3h9a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7A4 4 0 0 1 3 17V7a4 4 0 0 1 4-4z" />
                      <path d="M7 7h7M7 11h10M7 15h10" />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Guidelines
                  </h3>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Curated local & national guidance, antibiotic policies, and useful references.
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">
                  Browse guidelines →
                </span>
              </Link>
            </Reveal>

            {/* Education (renamed from Teaching) */}
            <Reveal delay={150}>
              <Link
                href="/education"
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 hover:shadow-md transition hover:border-violet-300/60 dark:hover:border-violet-700/60 bg-white/60 dark:bg-slate-900/30 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  {/* Sleek 'graduation cap' icon */}
                  <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-sky-400/15 dark:from-violet-500/20 dark:to-sky-400/20 flex items-center justify-center ring-1 ring-inset ring-violet-500/20 group-hover:ring-violet-500/40 transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-violet-700 dark:text-violet-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 10L12 5 2 10l10 5 10-5z" />
                      <path d="M6 12v4c0 1.1 2.7 3 6 3s6-1.9 6-3v-4" />
                    </svg>
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Education
                  </h3>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Slide decks, case discussions, and micro-teaching bites for teams and trainees.
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">
                  See education →
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Professional divider with contact email only */}
      <section className="mt-8 sm:mt-10 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8 text-sm sm:text-base flex items-center justify-center text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16v16H4z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
              <a
                href="mailto:infectionnw@gmail.com"
                className="font-medium hover:underline"
              >
                infectionnw@gmail.com
              </a>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
