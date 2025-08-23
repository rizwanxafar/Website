// src/app/page.js
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 opacity-10 dark:opacity-20 bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.violet.300/40%),transparent_60%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.violet.300/15%),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome to Infectious Diseases Portal.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Practical algorithms, local guidelines, calculators, and teaching
              resources for ID clinicians in the Northwest.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="#sections"
                className="rounded-xl px-5 py-3 text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                Explore the site
              </Link>
              <Link
                href="/algorithms"
                className="rounded-xl px-5 py-3 text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Go to Algorithms
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sections overview */}
      <section id="sections" className="py-12 sm:py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Algorithms */}
            <Link
              href="/algorithms"
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Algorithms</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Step‑by‑step pathways for common ID scenarios (sepsis, SAB, CNS infection, etc.).
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">
                View algorithms →
              </span>
            </Link>

            {/* Guidelines */}
            <Link
              href="/guidelines"
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 2h9l3 3v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Guidelines</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Curated local & national guidance, antibiotic policies, and useful references.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">
                Browse guidelines →
              </span>
            </Link>

            {/* Calculators */}
            <Link
              href="/calculators"
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 4h8v2H8V7zm0 4h8v2H8v-2zm0 4h8v2H8v-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Calculators</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Interactive dosing aids and risk scores with clear outputs and caveats.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">
                Open calculators →
              </span>
            </Link>

            {/* Teaching */}
            <Link
              href="/teaching"
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 3l9 5-9 5-9-5 9-5zm0 7l6.16-3.42L12 3.99 5.84 6.58 12 10zM4 12l8 4 8-4v5l-8 4-8-4v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Teaching</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Slide decks, cases, and micro teaching bite‑sizes for teams and trainees.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">
                See teaching →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
