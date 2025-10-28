// src/app/page.js
import Link from "next/link";

export const metadata = {
  title: "ID Northwest",
  description: "Clinical tools for infectious disease",
};

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Light-only frosted hero panel */}
          <div className="glass-light rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome to the Infectious Diseases Portal
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-700 dark:text-slate-300">
              Practical algorithms, local guidelines, 
            </p>

            {/* Two CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/algorithms/travel/risk-assessment-returning-traveller"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-medium
                           text-white bg-[hsl(var(--brand))] hover:brightness-95
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70"
              >
                VHF Risk Assessment
              </Link>
              <Link
                href="/algorithms/travel/travel-history-generator"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-medium
                           border border-slate-300 dark:border-slate-700
                           text-slate-800 dark:text-slate-100
                           hover:bg-slate-50 dark:hover:bg-slate-900
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/50"
              >
                Travel History Generator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sections grid: light = solid brand bg; dark = transparent */}
      <section id="sections" className="relative py-24 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[hsl(var(--brand))] dark:bg-transparent"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">

            {/* Algorithms */}
            <Link
              href="/algorithms"
              className="group rounded-2xl p-5 glass-light
                         dark:bg-neutral-950 dark:border dark:border-slate-800
                         hover:shadow-lg transition focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand))]/40"
            >
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-lg bg-white/70 dark:bg-neutral-900
                                  ring-1 ring-inset ring-black/5 dark:ring-white/10
                                  flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-slate-700 dark:text-slate-300"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <path d="M6 3v6a3 3 0 0 0 3 3h3" />
                    <circle cx="6" cy="3" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M12 14v7" />
                    <path d="M12 12h3a3 3 0 0 0 3-3V3" />
                    <circle cx="18" cy="3" r="2" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Algorithms</h3>
                  <p className="mt-2 text-sm text-slate-700/90 dark:text-slate-300">
                    Step-by-step pathways for common infectious disease scenarios.
                  </p>
                </div>
              </div>
            </Link>

            {/* Guidelines */}
            <Link
              href="/guidelines"
              className="group rounded-2xl p-5 glass-light
                         dark:bg-neutral-950 dark:border dark:border-slate-800
                         hover:shadow-lg transition focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand))]/40"
            >
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-lg bg-white/70 dark:bg-neutral-900
                                  ring-1 ring-inset ring-black/5 dark:ring-white/10
                                  flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-slate-700 dark:text-slate-300"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <path d="M7 3h9a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7A4 4 0 0 1 3 17V7a4 4 0 0 1 4-4z" />
                    <path d="M7 7h7M7 11h10M7 15h10" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Guidelines</h3>
                  <p className="mt-2 text-sm text-slate-700/90 dark:text-slate-300">
                    Local and national guidance, antibiotic policies, and references.
                  </p>
                </div>
              </div>
            </Link>

            {/* Education */}
            <Link
              href="/teaching"
              className="group rounded-2xl p-5 glass-light
                         dark:bg-neutral-950 dark:border dark:border-slate-800
                         hover:shadow-lg transition focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand))]/40"
            >
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-lg bg-white/70 dark:bg-neutral-900
                                  ring-1 ring-inset ring-black/5 dark:ring-white/10
                                  flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-slate-700 dark:text-slate-300"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <path d="M22 10L12 5 2 10l10 5 10-5z" />
                    <path d="M6 12v4c0 1.1 2.7 3 6 3s6-1.9 6-3v-4" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Education</h3>
                  <p className="mt-2 text-sm text-slate-700/90 dark:text-slate-300">
                    Slides, case discussions, and teaching resources for clinicians.
                  </p>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Footer contact */}
      <section className="mt-10 sm:mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8 text-sm sm:text-base flex items-center justify-center">
            <span className="inline-flex items-center gap-2 glass-light rounded-xl px-4 py-2 dark:bg-transparent">
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-slate-700 dark:text-slate-300"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M4 4h16v16H4z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
              <a
                href="mailto:infectionnw@gmail.com"
                className="font-medium text-slate-700 hover:underline dark:text-slate-300"
              >
                infectionnw@gmail.com
              </a>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
