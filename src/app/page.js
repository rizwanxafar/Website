// src/app/page.js
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-64px)]">
      {/* Announcement bar */}
      <section aria-label="Important updates" className="mt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">
              Update:
              <span className="font-normal"> Add your latest note here — e.g., “Sepsis antibiotic policy updated 12 Aug 2025.”</span>
            </p>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="relative isolate overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 -z-10 opacity-10 dark:opacity-20 bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.blue.300/40%),transparent_60%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.blue.300/15%),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Infectious Diseases — fast, clear, trustworthy.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Practical algorithms, local guidelines, calculators, and teaching resources for ID clinicians in the Northwest.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="#sections"
                className="rounded-xl px-5 py-3 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

      {/* Quick access */}
      <section aria-label="Quick access" className="pb-6 sm:pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/algorithms" className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900">
              Sepsis
            </Link>
            <Link href="/algorithms" className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900">
              SAB
            </Link>
            <Link href="/calculators" className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900">
              Gentamicin dosing
            </Link>
            <Link href="/guidelines" className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900">
              Antibiotic policy
            </Link>
          </div>
        </div>
      </section>

      {/* Sections overview */}
      <section id="sections" className="py-10 sm:py-14 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Algorithms */}
            <Card
              href="/algorithms"
              title="Algorithms"
              desc="Step‑by‑step pathways for common ID scenarios (sepsis, SAB, CNS infection, etc.)."
              iconPath="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z"
              cta="View algorithms →"
            />
            {/* Guidelines */}
            <Card
              href="/guidelines"
              title="Guidelines"
              desc="Curated local & national guidance, antibiotic policies, and key references."
              iconPath="M6 2h9l3 3v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
              cta="Browse guidelines →"
            />
            {/* Calculators */}
            <Card
              href="/calculators"
              title="Calculators"
              desc="Interactive dosing aids and risk scores with clear outputs and caveats."
              iconPath="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 4h8v2H8V7zm0 4h8v2H8v-2zm0 4h8v2H8v-2z"
              cta="Open calculators →"
            />
            {/* Teaching */}
            <Card
              href="/teaching"
              title="Teaching"
              desc="Slide decks, cases, and micro‑teaching bite‑sizes for teams and trainees."
              iconPath="M12 3l9 5-9 5-9-5 9-5zm0 7l6.16-3.42L12 3.99 5.84 6.58 12 10zM4 12l8 4 8-4v5l-8 4-8-4v-5z"
              cta="See teaching →"
            />
          </div>
        </div>
      </section>

      {/* Latest updates (simple list you can edit) */}
      <section aria-label="Latest updates" className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Latest updates</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• New: SAB pathway draft added (Aug 2025).</li>
            <li>• Gentamicin calculator prototype published (Aug 2025).</li>
            <li>• Antibiotic policy links refreshed (July 2025).</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

/** Small presentational card */
function Card({ href, title, desc, iconPath, cta }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={iconPath} />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{desc}</p>
      <span className="mt-4 inline-block text-sm font-medium text-blue-700 dark:text-blue-400 group-hover:underline">
        {cta}
      </span>
    </Link>
  );
}
