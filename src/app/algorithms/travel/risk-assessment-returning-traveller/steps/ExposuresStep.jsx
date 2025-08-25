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

const hasDisease = (entries = [], name = "") =>
  entries.some((e) => String(e?.disease || "").toLowerCase().includes(name.toLowerCase()));

export default function ExposuresStep({
  selected,                 // [{id,name,arrival,leaving}]
  normalizedMap,            // Map<normalizedCountryName, entries[]>
  exposuresGlobal,          // { q1_outbreak, q2_bleeding }
  setExposuresGlobal,
  exposuresByCountry,       // { [rowId]: { lassa, ebola_marburg, cchf } }
  setCountryExposure,       // (rowId, key, value) => void
  onBackToReview,
  onReset,
}) {
  // Derive which per-country questions are applicable and which are answered
  let requiredCountryQs = 0;
  let answeredCountryQs = 0;
  let anyYes = false;

  const countryBlocks = selected.map((c, idx) => {
    const key = String(c.name || "").toLowerCase();
    const entries = normalizedMap.get(key) || [];

    const showLassa = hasDisease(entries, "lassa");
    const showEbovMarb = hasDisease(entries, "ebola") || hasDisease(entries, "marburg");
    const showCchf = hasDisease(entries, "cchf");

    const row = exposuresByCountry[c.id] || {};
    const ansLassa = showLassa ? row.lassa || "" : null;
    const ansEbovMarb = showEbovMarb ? row.ebola_marburg || "" : null;
    const ansCchf = showCchf ? row.cchf || "" : null;

    // Count required & answered
    [ansLassa, ansEbovMarb, ansCchf].forEach((a) => {
      if (a !== null) {
        requiredCountryQs += 1;
        if (a === "yes" || a === "no") answeredCountryQs += 1;
        if (a === "yes") anyYes = true;
      }
    });

    return (
      <div key={c.id}>
        {idx > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />
        )}
        <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
          <div className="font-medium">{c.name}</div>

          {!showLassa && !showEbovMarb && !showCchf && (
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
                  className={yesNoBtn(ansLassa === "yes")}
                  onClick={() => setCountryExposure(c.id, "lassa", "yes")}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={yesNoBtn(ansLassa === "no")}
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
                  className={yesNoBtn(ansEbovMarb === "yes")}
                  onClick={() => setCountryExposure(c.id, "ebola_marburg", "yes")}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={yesNoBtn(ansEbovMarb === "no")}
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
                  className={yesNoBtn(ansCchf === "yes")}
                  onClick={() => setCountryExposure(c.id, "cchf", "yes")}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={yesNoBtn(ansCchf === "no")}
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
  });

  // Global questions
  const gOutbreak = exposuresGlobal.q1_outbreak || "";
  const gBleeding = exposuresGlobal.q2_bleeding || "";

  // Count them as required/answered
  const requiredGlobalQs = 2;
  let answeredGlobalQs = 0;
  if (gOutbreak === "yes" || gOutbreak === "no") answeredGlobalQs += 1;
  if (gBleeding === "yes" || gBleeding === "no") answeredGlobalQs += 1;
  if (gOutbreak === "yes" || gBleeding === "yes") anyYes = true;

  const totalRequired = requiredCountryQs + requiredGlobalQs;
  const totalAnswered = answeredCountryQs + answeredGlobalQs;
  const allAnswered = totalRequired === totalAnswered;

  // Summary panel content (only shows once all questions are answered)
  let summaryNode = (
    <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
      <div className="text-sm text-slate-600 dark:text-slate-300">
        Answer all exposure questions to see the summary.
      </div>
    </div>
  );

  if (allAnswered) {
    if (anyYes) {
      summaryNode = (
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
    } else {
      summaryNode = (
        <DecisionCard tone="amber" title="Further urgent investigations recommended">
          <ul className="list-disc pl-5">
            <li>Urgent Malaria investigation</li>
            <li>Urgent local investigations as normally appropriate, including blood cultures.</li>
          </ul>
        </DecisionCard>
      );
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Exposure questions (contextual)
      </h2>

      {/* Two-column layout: countries on the left, summary on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: countries list (takes 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {countryBlocks}

          {/* Global questions BELOW the countries list */}
          <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
            <div className="text-sm mb-1">{Q.GLOBAL_OUTBREAK.text}</div>
            <div className="flex gap-2">
              <button
                type="button"
                className={yesNoBtn(gOutbreak === "yes")}
                onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "yes" })}
              >
                Yes
              </button>
              <button
                type="button"
                className={yesNoBtn(gOutbreak === "no")}
                onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "no" })}
              >
                No
              </button>
            </div>
          </div>

          <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
            <div className="text-sm mb-1">{Q.GLOBAL_BLEEDING.text}</div>
            <div className="flex gap-2">
              <button
                type="button"
                className={yesNoBtn(gBleeding === "yes")}
                onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "yes" })}
              >
                Yes
              </button>
              <button
                type="button"
                className={yesNoBtn(gBleeding === "no")}
                onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "no" })}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {/* Right: summary box (sticky on large screens) */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 h-fit">
          {summaryNode}
        </div>
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
