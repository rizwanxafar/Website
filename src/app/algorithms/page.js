// src/app/algorithms/page.js

export const metadata = {
  title: "Algorithms · ID Northwest",
  description:
    "Quick access to infectious diseases algorithms grouped by Travel-related, Viral Hepatitis, and HIV.",
};

const categories = [
  {
    key: "travel",
    title: "Travel-related",
    items: [
      { label: "Risk assessment in returning traveller", href: "/algorithms/travel/risk-assessment-returning-traveller" },
      { label: "Travel history generator", href: "/algorithms/travel/travel-history-generator" },
    ],
  },
  {
    key: "viral-hepatitis",
    title: "Viral Hepatitis",
    items: [
      { label: "HBsAg new positive: baseline work-up", href: "/algorithms/viral-hepatitis/hbv-new-positive" },
      { label: "HCV RNA positive: staging & referral", href: "/algorithms/viral-hepatitis/hcv-staging" },
    ],
  },
  {
    key: "hiv",
    title: "HIV",
    items: [
      { label: "HIV post-exposure prophylaxis (PEP)", href: "/algorithms/hiv/pep" },
      { label: "Suspected acute HIV: testing pathway", href: "/algorithms/hiv/acute-hiv-testing" },
      { label: "PJP treatment (inpatient)", href: "/algorithms/hiv/pjp-treatment" },
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
          Choose a category. Click to reveal specific algorithms.
        </p>
      </header>

      {/* Categories as native disclosure panels (no client JS needed) */}
      <section aria-label="Algorithm categories">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <details
              key={cat.key}
              className="group rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 transition hover:shadow-lg open:shadow-lg"
            >
              <summary className="cursor-pointer list-none p-6 flex items-center justify-between gap-4">
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {cat.title}
                </span>
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-open:bg-violet-600 group-open:text-white group-open:border-violet-600 transition"
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
                      className="block rounded-lg px-4 py-3 text-sm font-medium border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
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

      <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
        We’ll add dedicated pages for each algorithm soon. Links may show 404 until those are created.
      </p>
    </main>
  );
}
