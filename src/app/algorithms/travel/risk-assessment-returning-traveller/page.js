// src/app/algorithms/travel/risk-assessment-returning-traveller/page.jsx
import CountrySelect from "./CountrySelect";
import WarningBox from "@/components/WarningBox";

export const metadata = {
  title: "VHF Risk Assessment in Returning Traveller | ID Northwest",
  description:
    "Screening and country-specific risk assessment for viral haemorrhagic fevers in returning travellers.",
};

export default function Page() {
  return (
    <main className="py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        VHF Risk Assessment in Returning Traveller
      </h1>

      <WarningBox />

      <div className="mt-6">
        <CountrySelect />
      </div>
    </main>
  );
}
