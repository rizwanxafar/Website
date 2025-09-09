// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ExposuresStep.jsx
"use client";

import { useMemo } from "react";
import { EXPOSURE_QUESTIONS as Q } from "@/data/diseaseQuestions";

const yesNoBtn = (active) =>
  `px-3 py-1.5 text-sm font-medium rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70 ${
    active
      ? "text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] border-transparent hover:brightness-95"
      : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
  }`;

const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (disease = "") => txt(disease).includes("no known hcid");
const isTravelAssociated = (disease = "") => txt(disease).includes("travel associated");
const isImportedOnly = (evidence = "") => txt(evidence).includes("imported cases only");
const hasDisease = (entries = [], name = "") =>
  entries.some((e) => String(e?.disease || "").toLowerCase().includes(name.toLowerCase()));

export default function ExposuresStep({
  selected,
  normalizedMap,
  exposuresGlobal = {},         
  setExposuresGlobal = () => {}, 
  exposuresByCountry = {},       
  setCountryExposure = () => {}, 
  onBackToReview,
  onReset,
  onContinueToSummary,
}) {
  // Build the question blocks and compute completion
  const { countryBlocks, allAnswered } = useMemo(() => {
    let requiredCountryQs = 0;
    let answeredCountryQs = 0;

    const blocks = selected.map((c, idx) => {
      const key = String(c.name || "").toLowerCase();
      const entries = normalizedMap.get(key) || [];

      const entriesFiltered = (entries || []).filter(
        (e) => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease) && !isImportedOnly(e.evidence)
      );

      const showLassa  = hasDisease(entriesFiltered, "lassa");
      const showEbMarb = hasDisease(entriesFiltered, "ebola") || hasDisease(entriesFiltered, "marburg");
      const showCchf   = hasDisease(entriesFiltered, "cchf");

      const row = exposuresByCountry[c.id] || {};
      const ansLassa  = showLassa  ? row.lassa || "" : null;
      const ansEbMarb = showEbMarb ? row.ebola_marburg || "" : null;
      const ansCchf   = showCchf   ? row.cchf || "" : null;

      [ansLassa, ansEbMarb, ansCchf].forEach((a) => {
        if (a !== null) {
          requiredCountryQs += 1;
          if (a === "yes" || a === "no") answeredCountryQs += 1;
        }
      });

      return (
        <div key={c.id}>
          {idx > 0 && <div className="border-t border-slate-200 dark:border-slate-700 pt-6 -mt-2" />}
          <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
            <div className="font-medium">{c.name}</div>

            {!showLassa && !showEbMarb && !showCchf && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                No disease-specific exposure questions apply to this country.
              </p>
            )}

            {showLassa && (
              <div className="mt-3">
                <div className="text-sm mb-1">
                  In this country, has the patient lived or worked in basic rural conditions?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={yesNoBtn((exposuresByCountry[c.id]?.lassa || "") === "yes")}
                    onClick={() => setCountryExposure(c.id, "lassa", "yes")}
                  >Yes</button>
                  <button
                    type="button"
                    className={yesNoBtn((exposuresByCountry[c.id]?.lassa || "") === "no")}
                    onClick={() => setCountryExposure(c.id, "lassa", "no")}
                  >No</button>
                </div>
              </div>
            )}

            {showEbMarb && (
              <div className="mt-3">
                <div className="text-sm mb-1">
                  In this country, did the patient visit caves/mines, or have contact
                  with primates, antelopes or bats (or eat their raw/undercooked meat)?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={yesNoBtn((exposuresByCountry[c.id]?.ebola_marburg || "") === "yes")}
                    onClick={() => setCountryExposure(c.id, "ebola_marburg", "yes")}
                  >Yes</button>
                  <button
                    type="button"
                    className={yesNoBtn((exposuresByCountry[c.id]?.ebola_marburg || "") === "no")}
                    onClick={() => setCountryExposure(c.id, "ebola_marburg", "no")}
                  >No</button>
                </div>
              </div>
            )}

            {showCchf && (
              <div className="mt-3">
                <div className="text-sm mb-1">
                  In this country, did the patient sustain a tick bite or crush a tick
                  with bare hands, OR have close involvement with animal slaughter?
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={yesNoBtn((exposuresByCountry[c.id]?.cchf || "") === "yes")}
                    onClick={() => setCountryExposure(c.id, "cchf", "yes")}
                  >Yes</button>
                  <button
                    type="button"
                    className={yesNoBtn((exposuresByCountry[c.id]?.cchf || "") === "no")}
                    onClick={() => setCountryExposure(c.id, "cchf", "no")}
                  >No</button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });

    // Global Qs
    let requiredGlobalQs = 2;
    let answeredGlobalQs = 0;
    if (exposuresGlobal.q1_outbreak === "yes" || exposuresGlobal.q1_outbreak === "no") answeredGlobalQs += 1;
    if (exposuresGlobal.q2_bleeding === "yes" || exposuresGlobal.q2_bleeding === "no") answeredGlobalQs += 1;

    const allAnswered = answeredGlobalQs + answeredCountryQs === requiredGlobalQs + requiredCountryQs;

    return { countryBlocks: blocks, allAnswered };
  }, [selected, normalizedMap, exposuresByCountry, exposuresGlobal]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Exposure questions (contextual)
      </h2>

      {/* Countries */}
      <div className="space-y-6">
        {countryBlocks}

        {/* Global questions */}
        <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
          <div className="text-sm mb-1">{Q.GLOBAL_OUTBREAK.text}</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={yesNoBtn(exposuresGlobal.q1_outbreak === "yes")}
              onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "yes" })}
            >Yes</button>
            <button
              type="button"
              className={yesNoBtn(exposuresGlobal.q1_outbreak === "no")}
              onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "no" })}
            >No</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            For current outbreak information, check{" "}
            <a
              href="https://www.who.int/emergencies/disease-outbreak-news"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              WHO Disease Outbreak News
            </a>
            ,{" "}
            <a
              href="https://travelhealthpro.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              TravelHealthPro
            </a>{" "}
            or{" "}
            <a
              href="https://www.promedmail.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ProMED
            </a>
            .
          </p>
        </div>

        <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
          <div className="text-sm mb-1">{Q.GLOBAL_BLEEDING.text}</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={yesNoBtn(exposuresGlobal.q2_bleeding === "yes")}
              onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "yes" })}
            >Yes</button>
            <button
              type="button"
              className={yesNoBtn(exposuresGlobal.q2_bleeding === "no")}
              onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "no" })}
            >No</button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackToReview}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700
                     hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))]"
        >
          Back to country review
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700
                     hover:border-rose-500 hover:text-rose-600 dark:hover:border-rose-400"
        >
          New assessment
        </button>

        <button
          type="button"
          disabled={!allAnswered}
          onClick={onContinueToSummary}
          className={`ml-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
                      text-sm font-medium text-white
                      bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70
                      disabled:opacity-50 disabled:cursor-not-allowed transition`}
        >
          Continue to summary
        </button>
      </div>
    </div>
  );
}
