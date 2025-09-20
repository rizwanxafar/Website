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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome to the Infectious Diseases Portal
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
            Practical algorithms, local guidelines, and education for ID clinicians in the North&nbsp;West.
          </p>

          {/* Single CTA */}
          <div className="mt-10">
            <Link
              href="/algorithms"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-medium
                         text-white bg-[hsl(var(--brand))] hover:brightness-95
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70"
            >
              Go to algorithms
            </Link>
          </div>
        </div>
      </section>

      {/* Sections grid */}
      <section id="sections" className="py-16 sm:py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Algorithms */}
            <Link
              href="/algorithms"
              className="group rounded-xl border border-slate-200 dark:border-slate-800 p-5
                         bg-white dark:bg-neutral-950 hover:shadow-md transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand))]/40"
            >
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-neutral-900 flex items-center justify-center ring-1 ring-inset ring-slate-200 dark:ring-neutral-800">
                  <svg
                    className="h-5 w-5 text-slate-700 dark:text-slate-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 3v6a3 3 0 0 0 3 3h3" />
                    <circle cx="6" cy="3" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M12 14v7" />
                    <path d="M12 12h3a3 3 0 0 0 3-3V3" />
                    <circle cx="18" cy="3" r="2" />
                  </svg>
                </span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Algorithms
                </h3>
              </div>
            </Link>

            {/* Guidelines */}
            <Link
              href="/guidelines"
              className="group rounded-xl border border-slate-200 dark:border-slate-800 p-5
                         bg-white dark:bg-neutral-950 hover:shadow-md transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand))]/40"
            >
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-neutral-900 flex items-center justify-center ring-1 ring-inset ring-slate-200 dark:ring-neutral-800">
                  <svg
                    className="h-5 w-5 text-slate-700 dark:text-slate-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
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
            </Link>

            {/* Education */}
            <Link
              href="/teaching"
              className="group rounded-xl border border-slate-200 dark:border-slate-800 p-5
                         bg-white dark:bg-neutral-950 hover:shadow-md transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand))]/40"
            >
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-neutral-900 flex items-center justify-center ring-1 ring-inset ring-slate-200 dark:ring-neutral-800">
                  <svg
                    className="h-5 w-5 text-slate-700 dark:text-slate-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
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
            </Link>

          </div>
        </div>
      </section>

      {/* Footer contact */}
      <section className="mt-10 sm:mt-12 border-t border-slate-200 dark:border-slate-800">
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
              <a href="mailto:infectionnw@gmail.com" className="font-medium hover:underline">
                infectionnw@gmail.com
              </a>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
