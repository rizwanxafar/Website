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
          Choose a category to view available algorithms.
        </p>
      </header>

      {/* Categories */}
      <section aria-label="Algorithm categories">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          <CategoryCard href="/algorithms/travel" title="Travel-related" />
          <CategoryCard href="/algorithms/viral-hepatitis" title="Viral Hepatitis" />
          <CategoryCard href="/algorithms/hiv" title="HIV" />
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
        Category pages will be added next. Links above may temporarily show a 404 until we create them.
      </p>
    </main>
  );
}

/** Improved card style */
function CategoryCard({ href, title }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-10 flex items-center justify-center text-lg font-semibold text-slate-900 dark:text-slate-100 transition hover:border-violet-500 dark:hover:border-violet-400 hover:shadow-lg hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
    >
      {title}
    </Link>
  );
}
