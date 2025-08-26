// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ExposuresStep.jsx
"use client";

import { useState } from "react";
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

// Amber summary (DecisionCard has no amber tone)
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
  // Optional screening + onset for printable context if parent passes them
  q1Fever,
  q2Exposure,
  onset,
}) {
  // ----- Follow-up state for AMBER pathway -----
  const [malariaPositive, setMalariaPositive] = useState("");
  const [alternativeDx, setAlternativeDx] = useState("");
  const [concern72h, setConcern72h] = useState("");

  const setMalaria = (v) => {
    setMalariaPositive(v);
    setAlternativeDx("");
    setConcern72h("");
  };
  const setAltDx = (v) => {
    setAlternativeDx(v);
    setConcern72h("");
  };

  // ----- Country exposure questions -----
  let requiredCountryQs = 0;
  let answeredCountryQs = 0;
  let anyYes = false;

  const countryBlocks = selected.map((c, idx) => {
    const key = String(c.name || "").toLowerCase();
    const entries = normalizedMap.get(key) || [];

    const entriesFiltered = (entries || []).filter(
      (e) => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease) && !isImportedOnly(e.evidence)
    );

    const showLassa   = hasDisease(entriesFiltered, "lassa");
    const showEbMarb  = hasDisease(entriesFiltered, "ebola") || hasDisease(entriesFiltered, "marburg");
    const showCchf    = hasDisease(entriesFiltered, "cchf");

    const row = exposuresByCountry[c.id] || {};
    const ansLassa  = showLassa  ? row.lassa || "" : null;
    const ansEbMarb = showEbMarb ? row.ebola_marburg || "" : null;
    const ansCchf   = showCchf   ? row.cchf || "" : null;

    [ansLassa, ansEbMarb, ansCchf].forEach((a) => {
      if (a !== null) {
        requiredCountryQs += 1;
        if (a === "yes" || a === "no") answeredCountryQs += 1;
        if (a === "yes") anyYes = true;
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
                In this country, did the patient visit caves/mines, or have contact with primates,
                antelopes or bats (or eat their raw/undercooked meat)?
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
                In this country, did the patient sustain a tick bite or crush a tick with bare hands,
                OR have close involvement with animal slaughter?
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

  // Outcome print (prints the page, including outcome + answers on screen)
  const handlePrint = () => window.print();

  // Summary panel (right side)
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
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Outcome of risk assessment
          </div>
          <DecisionCard tone="red" title="AT RISK OF VHF">
            <ul className="list-disc pl-5">
              <li>ISOLATE PATIENT IN SIDE ROOM</li>
              <li>Discuss with infection consultant (Infectious Disease/Microbiology/Virology)</li>
              <li>Urgent Malaria investigation</li>
              <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
              <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
            </ul>
          </DecisionCard>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:border-violet-500 dark:hover:border-violet-400"
          >
            Print summary
          </button>
        </div>
      );
    } else {
      summaryNode = (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Outcome of risk assessment
          </div>
          <div className="space-y-4">
            <AmberSummary title="Minimal risk of VHF">
              <ul className="list-disc pl-5">
                <li>Urgent Malaria investigation</li>
                <li>Urgent local investigations as normally appropriate, including blood cultures.</li>
              </ul>
            </AmberSummary>

            {/* Amber follow-ups */}
            <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
              <div className="text-sm mb-1">Is the malaria test result positive?</div>
              <div className="flex gap-2">
                <button type="button" className={yesNoBtn(malariaPositive === "yes")} onClick={() => setMalaria("yes")}>Yes</button>
                <button type="button" className={yesNoBtn(malariaPositive === "no")}  onClick={() => setMalaria("no")}>No</button>
              </div>
            </div>

            {malariaPositive === "yes" && (
              <>
                <DecisionCard tone="green" title="Manage as malaria; VHF unlikely" />
                <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
                  <div className="text-sm mb-1">Clinical concern OR no improvement after 72 hours?</div>
                  <div className="flex gap-2">
                    <button type="button" className={yesNoBtn(concern72h === "yes")} onClick={() => setConcern72h("yes")}>Yes</button>
                    <button type="button" className={yesNoBtn(concern72h === "no")}  onClick={() => setConcern72h("no")}>No</button>
                  </div>
                </div>

                {concern72h === "yes" && (
                  <DecisionCard tone="red" title="AT RISK OF VHF">
                    <ul className="list-disc pl-5">
                      <li>ISOLATE PATIENT IN SIDE ROOM</li>
                      <li>Discuss with infection consultant (Infectious Disease/Microbiology/Virology)</li>
                      <li>Urgent Malaria investigation</li>
                      <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
                      <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
                    </ul>
                  </DecisionCard>
                )}

                {concern72h === "no" && (
                  <DecisionCard tone="green" title="VHF unlikely; manage locally">
                    <p>Please continue standard local management pathways.</p>
                  </DecisionCard>
                )}
              </>
            )}

            {malariaPositive === "no" && (
              <>
                <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
                  <div className="text-sm mb-1">Alternative diagnosis established?</div>
                  <div className="flex gap-2">
                    <button type="button" className={yesNoBtn(alternativeDx === "yes")} onClick={() => setAltDx("yes")}>Yes</button>
                    <button type="button" className={yesNoBtn(alternativeDx === "no")}  onClick={() => setAltDx("no")}>No</button>
                  </div>
                </div>

                {alternativeDx === "yes" && (
                  <DecisionCard tone="green" title="VHF unlikely; manage locally">
                    <p>Please continue standard local management pathways.</p>
                  </DecisionCard>
                )}

                {alternativeDx === "no" && (
                  <>
                    <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
                      <div className="text-sm mb-1">Clinical concern OR no improvement after 72 hours?</div>
                      <div className="flex gap-2">
                        <button type="button" className={yesNoBtn(concern72h === "yes")} onClick={() => setConcern72h("yes")}>Yes</button>
                        <button type="button" className={yesNoBtn(concern72h === "no")}  onClick={() => setConcern72h("no")}>No</button>
                      </div>
                    </div>

                    {concern72h === "yes" && (
                      <DecisionCard tone="red" title="AT RISK OF VHF">
                        <ul className="list-disc pl-5">
                          <li>ISOLATE PATIENT IN SIDE ROOM</li>
                          <li>Discuss with infection consultant (Infectious Disease/Microbiology/Virology)</li>
                          <li>Urgent Malaria investigation</li>
                          <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
                          <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
                        </ul>
                      </DecisionCard>
                    )}

                    {concern72h === "no" && (
                      <DecisionCard tone="green" title="VHF unlikely; manage locally">
                        <p>Please continue standard local management pathways.</p>
                      </DecisionCard>
                    )}
                  </>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-2 text-sm hover:border-violet-500 dark:hover:border-violet-400"
            >
              Print summary
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Exposure questions (contextual)
      </h2>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: countries + globals */}
        <div className="lg:col-span-2 space-y-6">
          {countryBlocks}

          {/* Global questions */}
          <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
            <div className="text-sm mb-1">{Q.GLOBAL_OUTBREAK.text}</div>
            <div className="flex gap-2">
              <button type="button" className={yesNoBtn(exposuresGlobal.q1_outbreak === "yes")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "yes" })}>Yes</button>
              <button type="button" className={yesNoBtn(exposuresGlobal.q1_outbreak === "no")}  onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "no" })}>No</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              For current outbreak information, check WHO Disease Outbreak News and UKHSA Monthly Summaries / country-specific risk pages.
            </p>
          </div>

          <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
            <div className="text-sm mb-1">{Q.GLOBAL_BLEEDING.text}</div>
            <div className="flex gap-2">
              <button type="button" className={yesNoBtn(exposuresGlobal.q2_bleeding === "yes")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "yes" })}>Yes</button>
              <button type="button" className={yesNoBtn(exposuresGlobal.q2_bleeding === "no")}  onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "no" })}>No</button>
            </div>
          </div>
        </div>

        {/* Right: outcome */}
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
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:border-rose-400"
        >
          New assessment
        </button>
      </div>
    </div>
  );
}
