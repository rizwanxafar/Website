// src/app/algorithms/travel/risk-assessment-returning-traveller/page.js
import CountrySelect from "./CountrySelect";

export const metadata = {
  title: "Risk assessment (returning traveller) · Algorithms",
  description:
    "Choose country/countries of travel. Uses UKHSA HCID country-specific risk list.",
};

export default function RiskAssessment() {
  return (
    <main className="py-10 sm:py-14">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Risk assessment — returning traveller
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
          Country / countries of travel
        </p>
      </header>

      <section className="max-w-2xl">
        <CountrySelect />
      </section>
    </main>
  );
}
