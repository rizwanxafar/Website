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

      {/* Note about upcoming detail pages */}
      <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
        Category pages will be added next. Links above may temporarily show a 404 until we create them.
      </p>
    </main>
  );
}

/** Simple card with just a label */
function CategoryCard({ href, title }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center text-lg font-semibold text-slate-900 dark:text-slate-100 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition"
    >
      {title}
    </Link>
  );
}
