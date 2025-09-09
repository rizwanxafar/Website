// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ExposuresStep.jsx
"use client";

import DecisionCard from "@/components/DecisionCard";

// -------- Theming helpers (no logic change) --------
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white " +
  "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition";

const secondaryBtn =
  "rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))]";

const yesNoBtn = (active) =>
  [
    "px-3 py-1.5 text-sm font-medium rounded-md border-2",
    active
      ? "text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] border-[hsl(var(--brand))] dark:border-[hsl(var(--accent))]"
      : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700",
  ].join(" ");

// -------- Small utilities (unchanged logic) --------
const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (d = "") => txt(d).includes("no known hcid");
const isTravelAssociated = (d = "") => txt(d).includes("travel associated");
const isImportedOnly = (e = "") => txt(e).includes("imported cases only");
const hasDisease = (entries = [], name = "") =>
  entries.some((e) => String(e?.disease || "").toLowerCase().includes(name.toLowerCase()));

/**
 * This component assumes state is lifted and passed via props:
 * - exposuresGlobal: { q1_outbreak: "yes"|"no"|"" , q2_bleeding: "yes"|"no"|"" }
 * - setExposuresGlobal: (updater) => void
 * - exposuresByCountry: { [countryRowId]: { lassa:"yes|no|", ebola_marburg:"yes|no|", cchf:"yes|no|" } }
 * - setCountryExposure: (countryRowId, partial) => void  // merges into that row
 *
 * Required answering logic (unchanged): Continue enabled only when all applicable global & per-country questions are answered.
 */
export default function ExposuresStep({
  selected,
  normalizedMap,
  exposuresGlobal,
  setExposuresGlobal,
  exposuresByCountry,
  setCountryExposure,
  onBackToReview,
  onReset,
  onContinueToSummary,
}) {
  // Build the country cards with conditional questions exactly as before
  const countryCards = selected.map((row, idx) => {
    const key = String(row.name || "").toLowerCase();
    const entriesAll = normalizedMap.get(key) || [];
    // Filter out “no HCIDs”, “travel associated only”, and “imported only”
    const entries = entriesAll.filter(
      (e) =>
        !isNoKnownHcid(e.disease) &&
        !isTravelAssociated(e.disease) &&
        !isImportedOnly(e.evidence)
    );

    const showLassa = hasDisease(entries, "lassa");
    const showEbMarb = hasDisease(entries, "ebola") || hasDisease(entries, "marburg");
    const showCchf = hasDisease(entries, "cchf");

    const answers = exposuresByCountry[row.id] || {};
    const aLassa = answers.lassa ?? "";
    const aEbMarb = answers.ebola_marburg ?? "";
    const aCchf = answers.cchf ?? "";

    const change = (partial) => setCountryExposure(row.id, partial);

    return (
      <div key={row.id}>
        {idx > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />
        )}

        <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
          <div className="mb-2 text-sm font-semibold">{row.name}</div>

          <div className="space-y-4">
            {/* Lassa */}
            {showLassa && (
              <div>
                <div className="mb-1 text-sm">
                  In this country, has the patient lived or worked in basic rural conditions?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={yesNoBtn(aLassa === "yes")}
                    onClick={() => change({ lassa: "yes" })}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={yesNoBtn(aLassa === "no")}
                    onClick={() => change({ lassa: "no" })}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Ebola / Marburg */}
            {showEbMarb && (
              <div>
                <div className="mb-1 text-sm">
                  In this country, has the patient visited caves/mines, or had contact with
                  primates, antelopes or bats (or eaten their raw/undercooked meat)?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={yesNoBtn(aEbMarb === "yes")}
                    onClick={() => change({ ebola_marburg: "yes" })}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={yesNoBtn(aEbMarb === "no")}
                    onClick={() => change({ ebola_marburg: "no" })}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* CCHF */}
            {showCchf && (
              <div>
                <div className="mb-1 text-sm">
                  In this country, has the patient sustained a tick bite or crushed a tick with
                  bare hands, or had close involvement with animal slaughter?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={yesNoBtn(aCchf === "yes")}
                    onClick={() => change({ cchf: "yes" })}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={yesNoBtn(aCchf === "no")}
                    onClick={() => change({ cchf: "no" })}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* If no specific questions are relevant for this country, show a neutral hint */}
            {!showLassa && !showEbMarb && !showCchf && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No additional exposure questions apply for this country.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  });

  // Compute “all answered” exactly as before
  let requiredCountryQs = 0;
  let answeredCountryQs = 0;
  let anyCountryYes = false;

  selected.forEach((row) => {
    const key = String(row.name || "").toLowerCase();
    const entriesAll = normalizedMap.get(key) || [];
    const entries = entriesAll.filter(
      (e) =>
        !isNoKnownHcid(e.disease) &&
        !isTravelAssociated(e.disease) &&
        !isImportedOnly(e.evidence)
    );

    const showLassa = hasDisease(entries, "lassa");
    const showEbMarb = hasDisease(entries, "ebola") || hasDisease(entries, "marburg");
    const showCchf = hasDisease(entries, "cchf");

    const answers = exposuresByCountry[row.id] || {};
    const list = [
      showLassa ? answers.lassa ?? "" : null,
      showEbMarb ? answers.ebola_marburg ?? "" : null,
      showCchf ? answers.cchf ?? "" : null,
    ].filter((x) => x !== null);

    requiredCountryQs += list.length;
    list.forEach((a) => {
      if (a === "yes" || a === "no") answeredCountryQs += 1;
      if (a === "yes") anyCountryYes = true;
    });
  });

  const gOutbreak = exposuresGlobal.q1_outbreak ?? "";
  const gBleeding = exposuresGlobal.q2_bleeding ?? "";

  const requiredGlobalQs = 2;
  let answeredGlobalQs = 0;
  if (gOutbreak === "yes" || gOutbreak === "no") answeredGlobalQs += 1;
  if (gBleeding === "yes" || gBleeding === "no") answeredGlobalQs += 1;

  const allAnswered = answeredCountryQs + answeredGlobalQs === requiredCountryQs + requiredGlobalQs;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Exposure questions
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: countries and their exposure questions */}
        <div className="lg:col-span-2 space-y-6">{countryCards}</div>

        {/* Right: global questions & controls */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 h-fit space-y-6">
          {/* Global Q1: current outbreak */}
          <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
            <div className="mb-1 text-sm font-medium">
              Has the patient travelled to any area where there is a current VHF outbreak?
            </div>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className={yesNoBtn(gOutbreak === "yes")}
                onClick={() => setExposuresGlobal((p) => ({ ...p, q1_outbreak: "yes" }))}
              >
                Yes
              </button>
              <button
                type="button"
                className={yesNoBtn(gOutbreak === "no")}
                onClick={() => setExposuresGlobal((p) => ({ ...p, q1_outbreak: "no" }))}
              >
                No
              </button>
            </div>

            {/* NEW: helper text with hyperlinks (as requested) */}
            <p className="text-xs text-slate-600 dark:text-slate-300">
              For current outbreak information, check{" "}
              <a
                href="https://www.who.int/emergencies/disease-outbreak-news"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                WHO Disease Outbreak News
              </a>{" "}
              and{" "}
              <a
                href="https://www.gov.uk/government/publications/high-consequence-infectious-diseases-hcid-monthly-summaries"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                UKHSA Monthly Summaries
              </a>{" "}
              /{" "}
              <a
                href="https://www.gov.uk/guidance/high-consequence-infectious-disease-country-specific-risk"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                country-specific risk
              </a>{" "}
              pages.
            </p>
          </div>

          {/* Global Q2: bleeding/severe features */}
          <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
            <div className="mb-1 text-sm font-medium">
              Does the patient have extensive bruising or active bleeding?
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={yesNoBtn(gBleeding === "yes")}
                onClick={() => setExposuresGlobal((p) => ({ ...p, q2_bleeding: "yes" }))}
              >
                Yes
              </button>
              <button
                type="button"
                className={yesNoBtn(gBleeding === "no")}
                onClick={() => setExposuresGlobal((p) => ({ ...p, q2_bleeding: "no" }))}
              >
                No
              </button>
            </div>
          </div>

          {/* Hint or gate to continue */}
          {!allAnswered ? (
            <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-3 text-sm text-slate-600 dark:text-slate-300">
              Please answer all applicable questions to continue.
            </div>
          ) : (
            <DecisionCard tone="green" title="Ready to continue">
              <p className="text-sm">All required questions are answered.</p>
            </DecisionCard>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onBackToReview} className={secondaryBtn}>
              Back to review
            </button>
            <button type="button" onClick={onReset} className={secondaryBtn}>
              New assessment
            </button>
            <button
              type="button"
              onClick={onContinueToSummary}
              disabled={!allAnswered}
              className={primaryBtn}
            >
              Continue to summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
