// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ExposuresStep.jsx
"use client";

import DecisionCard from "@/components/DecisionCard";
import { EXPOSURE_QUESTIONS as Q } from "@/data/diseaseQuestions";

const yesNoBtn = (active) =>
  `px-3 py-1.5 text-sm font-medium rounded-md border-2 ${
    active
      ? "bg-violet-600 text-white border-violet-600"
      : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
  }`;

const has = (arr = [], needle = "") =>
  arr.some((e) => String(e?.disease || "").toLowerCase().includes(needle.toLowerCase()));

export default function ExposuresStep({
  selected,                 // [{id,name,arrival,leaving}]
  normalizedMap,            // Map<normalizedCountryName, entries[]>
  exposuresGlobal,          // { q1_outbreak: "yes"|"no"|"" }
  setExposuresGlobal,
  exposuresByCountry,       // { [rowId]: { lassa, ebola_marburg, cchf } }
  setCountryExposure,       // (rowId, key, value) => void
  onBackToReview,
  onReset,
}) {
  // We'll always display the standard red action card here (per your simplified rule),
  // since this step appears only when at least one country was red.
  const actionCard = (
    <DecisionCard tone="red" title="AT RISK OF VHF">
      <ul className="list-disc pl-5">
        <li>ISOLATE PATIENT IN SIDE ROOM</li>
        <li>Discuss with infection consultant (Infectious Disease/Microbiology/Virology)</li>
        <li>Urgent Malaria investigation</li>
        <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
        <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
      </ul>
    </DecisionCard>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Exposure questions (contextual)
      </h2>

      {actionCard}

      {/* Country cards with contextual questions */}
      <div className="space-y-6">
        {selected.map((c, idx) => {
          const key = String(c.name || "").toLowerCase();
          const entries = normalizedMap.get(key) || [];

          const showLassa = has(entries, "lassa");
          const showEbovMarb = has(entries, "ebola") || has(entries, "marburg");
          const showCchf = has(entries, "cchf");

          // If no disease matches in this country, show the title but no exposure items
          const hasAny = showLassa || showEbovMarb || showCchf;

          return (
            <div key={c.id}>
              {idx > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />
              )}
              <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
                <div className="font-medium">{c.name}</div>

                {!hasAny && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    No disease-specific exposure questions apply to this country.
                  </p>
                )}

                {showLassa && (
                  <div className="mt-3">
                    <div className="text-sm mb-1">{Q.LASSA_RURAL.text}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={yesNoBtn(exposuresByCountry[c.id]?.lassa === "yes")}
                        onClick={() => setCountryExposure(c.id, "lassa", "yes")}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={yesNoBtn(exposuresByCountry[c.id]?.lassa === "no")}
                        onClick={() => setCountryExposure(c.id, "lassa", "no")}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}

                {showEbovMarb && (
                  <div className="mt-3">
                    <div className="text-sm mb-1">{Q.EBOV_MARB_ANIMAL.text}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={yesNoBtn(exposuresByCountry[c.id]?.ebola_marburg === "yes")}
                        onClick={() => setCountryExposure(c.id, "ebola_marburg", "yes")}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={yesNoBtn(exposuresByCountry[c.id]?.ebola_marburg === "no")}
                        onClick={() => setCountryExposure(c.id, "ebola_marburg", "no")}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}

                {showCchf && (
                  <div className="mt-3">
                    <div className="text-sm mb-1">{Q.CCHF_TICK_SLAUGHTER.text}</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={yesNoBtn(exposuresByCountry[c.id]?.cchf === "yes")}
                        onClick={() => setCountryExposure(c.id, "cchf", "yes")}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={yesNoBtn(exposuresByCountry[c.id]?.cchf === "no")}
                        onClick={() => setCountryExposure(c.id, "cchf", "no")}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global question (Q1) BELOW the countries list */}
      <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
        <div className="text-sm mb-1">{Q.GLOBAL_OUTBREAK.text}</div>
        <div className="flex gap-2">
          <button
            type="button"
            className={yesNoBtn(exposuresGlobal.q1_outbreak === "yes")}
            onClick={() => setExposuresGlobal({ q1_outbreak: "yes" })}
          >
            Yes
          </button>
          <button
            type="button"
            className={yesNoBtn(exposuresGlobal.q1_outbreak === "no")}
            onClick={() => setExposuresGlobal({ q1_outbreak: "no" })}
          >
            No
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          (We currently do not auto‑fetch WHO/UKHSA outbreak feeds. Please check WHO Disease
          Outbreak News or UKHSA Monthly Summaries.)
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackToReview}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400"
        >
          Back to country review
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
        >
          New assessment
        </button>
      </div>
    </div>
  );
}
