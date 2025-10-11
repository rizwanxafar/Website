// src/app/algorithms/page.js

export const metadata = {
  title: "Algorithms · ID Northwest",
  description: "Quick access to infectious diseases algorithms — Travel-related section.",
};

const categories = [
  {
    key: "travel",
    title: "Travel-related",
    items: [
      {
        label: "Risk assessment in returning traveller",
        href: "/algorithms/travel/risk-assessment-returning-traveller",
      },
      {
        label: "Travel history generator",
        href: "/algorithms/travel/travel-history-generator",
      },
    ],
  },
];

export default function AlgorithmsIndex() {
  return (
    <main className="py-10 sm:py-14">
      {/* Header */}
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Algorithms
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
          Choose a category to explore available algorithms.
        </p>
      </header>

      {/* Collapsible categories */}
      <section aria-label="Algorithm categories">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <details
              key={cat.key}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur transition hover:shadow-lg open:shadow-lg"
            >
              <summary className="cursor-pointer list-none p-6 flex items-center justify-between gap-4">
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {cat.title}
                </span>
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-open:text-[hsl(var(--accent))] group-open:border-[hsl(var(--accent))] transition"
                  aria-hidden="true"
                >
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">–</span>
                </span>
              </summary>

              <ul className="px-6 pb-6 space-y-2">
                {cat.items.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block rounded-lg px-4 py-3 text-sm font-medium border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] dark:hover:text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))/0.1] dark:hover:bg-[hsl(var(--accent))/0.15] transition"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
