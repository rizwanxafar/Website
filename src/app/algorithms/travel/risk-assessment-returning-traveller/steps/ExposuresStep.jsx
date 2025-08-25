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

const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (disease = "") => txt(disease).includes("no known hcid");
const isTravelAssociated = (disease = "") => txt(disease).includes("travel associated");
const isImportedOnly = (evidence = "") => txt(evidence).includes("imported cases only");

const hasDisease = (entries = [], name = "") =>
  entries.some((e) => String(e?.disease || "").toLowerCase().includes(name.toLowerCase()));

// Lightweight amber summary (since DecisionCard may not support amber tone)
function AmberSummary({ title, children }) {
  return (
    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-400 dark:bg-amber-900/20">
      <div className="font-semibold text-amber-900 dark:text-amber-200">{title}</div>
      <div className="mt-2 text-sm text-amber-900/90 dark:text-amber-100">{children}</div>
    </div>
  );
}

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

    // Filter out entries that should NOT trigger exposure questions
    const entriesFiltered = (entries || []).filter(
      (e) => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease) && !isImportedOnly(e.evidence)
    );

    const showLassa = hasDisease(entriesFiltered, "lassa");
    const showEbovMarb = hasDisease(entriesFiltered, "ebola") || hasDisease(entriesFiltered, "marburg");
    const showCchf = hasDisease(entriesFiltered, "cchf");

    const row = exposuresByCountry[c.id] || {};
    const ansLassa = showLassa ? row.lassa || "" : null;
    const ansEbovMarb = showEbovMarb ? row.ebola_marburg || "" : null;
    const ansCchf = showCchf ? row.cchf || "" : null;

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

  const requiredGlobalQs = 2;
  let answeredGlobalQs = 0;
  if (gOutbreak === "yes" || gOutbreak === "no") answeredGlobalQs += 1;
  if (gBleeding === "yes" || gBleeding === "no") answeredGlobalQs += 1;
  if (gOutbreak === "yes" || gBleeding === "yes") anyYes = true;

  const totalRequired = requiredGlobalQs + requiredCountryQs;
  const totalAnswered = answeredGlobalQs + answeredCountryQs;
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
        <AmberSummary title="Minimal risk of VHF">
          <ul className="list-disc pl-5">
            <li>Urgent Malaria investigation</li>
            <li>Urgent local investigations as normally appropriate, including blood cultures.</li>
          </ul>
        </AmberSummary>
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
        {/* Left: countries list (2 columns on large screens) */}
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
            <p className="mt-2 text-xs text-slate-500">
              For current outbreak information, check WHO Disease Outbreak News and UKHSA Monthly
              Summaries / country-specific risk pages.
            </p>
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
