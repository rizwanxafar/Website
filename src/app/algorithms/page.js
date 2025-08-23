// src/app/algorithms/page.js
import CategoryPanel from "../../components/CategoryPanel";

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
      { label: "Fever in the returned traveller", href: "/algorithms/travel/fever-returned-traveller" },
      { label: "Malaria assessment & admission thresholds", href: "/algorithms/travel/malaria" },
      { label: "Dengue: triage and warning signs", href: "/algorithms/travel/dengue" },
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
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Algorithms
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
          Choose a category. Click to reveal specific algorithms.
        </p>
      </header>

      <section aria-label="Algorithm categories">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryPanel key={cat.key} title={cat.title} items={cat.items} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500 dark:text-slate-400">
        We’ll add dedicated pages for each algorithm soon. Links may show 404 until those are created.
      </p>
    </main>
  );
}
