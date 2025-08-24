// src/app/algorithms/travel/risk-assessment-returning-traveller/page.jsx
import CountrySelect from "./CountrySelect";

export const metadata = {
  title: "Risk assessment in the returning traveller (VHF) | ID Northwest",
  description:
    "Screening and country-specific risk assessment for viral haemorrhagic fevers in returning travellers.",
};

export default function Page() {
  return (
    <main className="py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Risk assessment in the returning traveller (VHF)
      </h1>

      {/* No extra subheading here. The country heading appears only inside the select step. */}
      <div className="mt-6">
        <CountrySelect />
      </div>
    </main>
  );
}
