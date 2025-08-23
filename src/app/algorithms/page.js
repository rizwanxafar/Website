// src/app/algorithms/page.js
import Link from "next/link";

export const metadata = {
  title: "Algorithms · ID Northwest",
  description:
    "Quick access to infectious diseases algorithms grouped by Travel-related, Viral Hepatitis, and HIV.",
};

export default function AlgorithmsIndex() {
  return (
    <main className="py-10 sm:py-14">
      {/* Header */}
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Algorithms
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
          Structured pathways for common ID scenarios. Start by choosing a category below.
        </p>
      </header>

      {/* Categories */}
      <section aria-label="Algorithm categories">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          <CategoryCard
            href="/algorithms/travel"
            title="Travel‑related"
            desc="Assessment and management pathways for fever in the returned traveller, malaria, dengue, and more."
            iconPath="M12 2a1 1 0 011 1v2.05a7.002 7.002 0 015.95 5.95H21a1 1 0 110 2h-2.05a7.002 7.002 0 01-5.95 5.95V21a1 1 0 11-2 0v-2.05a7.002 7.002 0 01-5.95-5.95H3a1 1 0 110-2h2.05A7.002 7.002 0 0111 5.05V3a1 1 0 011-1z"
          />

          <CategoryCard
            href="/algorithms/viral-hepatitis"
            title="Viral Hepatitis"
            desc="HBV and HCV: baseline work‑up, referral triggers, treatment steps, and follow‑up."
            iconPath="M6 2h9l3 3v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm3 5h6v2H9V7zm0 4h6v2H9v-2zm0 4h6v2H9v-2z"
          />

          <CategoryCard
            href="/algorithms/hiv"
            title="HIV"
            desc="Initial testing, linkage to care, PEP, PrEP considerations, and common inpatient pathways."
            iconPath="M12 3a9 9 0 100 18 9 9 0 000-18zm-1 5h2v4h-2V8zm0 6h2v2h-2v-2z"
          />
        </div>
      </section>

      {/* Note about upcoming detail pages */}
      <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
        Category pages will be added next. Links above may temporarily show a 404 until we create them.
      </p>
    </main>
  );
}

/** Presentational card component */
function CategoryCard({ href, title, desc, iconPath }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d={iconPath} />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{desc}</p>
      <span className="mt-4 inline-block text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">
        Open {title} →
      </span>
    </Link>
  );
}
