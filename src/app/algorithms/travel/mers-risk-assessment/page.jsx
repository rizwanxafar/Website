// src/app/algorithms/travel/mers-risk-assessment/page.jsx
import Link from "next/link";

export const metadata = {
  title: "MERS Risk Assessment | ID Northwest",
  description:
    "Coming soon: a structured MERS risk assessment workflow with clear decision support.",
};

export default function Page() {
  return (
    <main className="py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        MERS Risk Assessment
      </h1>

      <div className="mt-4 rounded-md border border-amber-400 bg-amber-50 dark:bg-amber-900/30 p-4 text-amber-900 dark:text-amber-100">
        <p className="text-sm">
          This section is under development. A detailed risk assessment tool for
          Middle East Respiratory Syndrome (MERS) will be added soon. In the
          meantime, please refer to official guidance from{" "}
          <a
            href="https://www.gov.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            GOV.UK
          </a>{" "}
          and{" "}
          <a
            href="https://www.who.int/emergencies/diseases/mers-cov"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            WHO
          </a>
          .
        </p>
      </div>

      <div className="mt-6">
        <Link
          href="/algorithms/travel/risk-assessment-returning-traveller"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
                     text-sm font-medium text-white
                     bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70
                     disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Back to VHF assessment
        </Link>
      </div>
    </main>
  );
}
