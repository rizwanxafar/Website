"use client";

import { useMemo } from "react";
import { EXPOSURE_QUESTIONS as Q } from "@/data/diseaseQuestions";
import { normalizeName } from "@/utils/names";

const yesNoBtn = (active) =>
  "px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors " +
  (active
    ? "bg-slate-800 border-slate-800 text-white"
    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400");

const btnPrimary =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:opacity-90 text-white text-sm font-semibold transition-opacity " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

const btnSecondary =
  "px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-slate-400 text-sm font-medium transition-colors";

const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (disease = "") => txt(disease).includes("no known hcid");
const isTravelAssociated = (disease = "") => txt(disease).includes("travel associated");
const isImportedLike = (evidence = "") => /(imported cases only|associated with a case import|import[-\s]?related)/i.test(String(evidence || ""));

const RX = {
  lassa: /lassa/i,
  ebmarb: /(ebola|ebolavirus|ebola\s*virus|e\.?v\.?d|marburg)/i,
  cchf: /(cchf|crimean[-\s]?congo|crimea[-\s]?congo)/i,
};
const hasDisease = (entries = [], rx) => entries.some((e) => rx.test(String(e?.disease || "")));

export default function ExposuresStep({
  selected, normalizedMap, exposuresGlobal = {}, setExposuresGlobal = () => {}, exposuresByCountry = {}, setCountryExposure = () => {}, onBackToReview, onReset, onContinueToSummary,
}) {
  const { countryBlocks, allAnswered } = useMemo(() => {
    let requiredCountryQs = 0, answeredCountryQs = 0;
    const blocks = selected.map((c, idx) => {
      const key = normalizeName(c.name || "");
      const entries = normalizedMap.get(key) || [];
      const entriesFiltered = (entries || []).filter(e => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease) && !isImportedLike(e.evidence));

      const showLassa = hasDisease(entriesFiltered, RX.lassa);
      const showEbMarb = hasDisease(entriesFiltered, RX.ebmarb);
      const showCchf = hasDisease(entriesFiltered, RX.cchf);
      const row = exposuresByCountry[c.id] || {};
      const ansLassa = showLassa ? row.lassa || "" : null;
      const ansEbMarb = showEbMarb ? row.ebola_marburg || "" : null;
      const ansCchf = showCchf ? row.cchf || "" : null;

      [ansLassa, ansEbMarb, ansCchf].forEach((a) => {
        if (a !== null) {
          requiredCountryQs += 1;
          if (a === "yes" || a === "no") answeredCountryQs += 1;
        }
      });

      return (
        <div key={c.id}>
          {idx > 0 && <div className="border-t border-slate-200 pt-6 -mt-2" />}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="font-semibold text-slate-900 text-base mb-4">{c.name}</div>

            {!showLassa && !showEbMarb && !showCchf && (
              <p className="text-sm text-slate-400 italic">No specific exposure questions apply.</p>
            )}

            {showLassa && (
              <div className="mt-4 border-l-2 border-slate-200 pl-4">
                <div className="text-sm text-slate-800 mb-2">In this country, has the patient lived or worked in basic rural conditions?</div>
                <div className="flex gap-2">
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.lassa || "") === "yes")} onClick={() => setCountryExposure(c.id, "lassa", "yes")}>Yes</button>
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.lassa || "") === "no")} onClick={() => setCountryExposure(c.id, "lassa", "no")}>No</button>
                </div>
              </div>
            )}

            {showEbMarb && (
              <div className="mt-4 border-l-2 border-slate-200 pl-4">
                <div className="text-sm text-slate-800 mb-2">Did they visit caves/mines, or contact primates/antelopes/bats (or eat bushmeat)?</div>
                <div className="flex gap-2">
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.ebola_marburg || "") === "yes")} onClick={() => setCountryExposure(c.id, "ebola_marburg", "yes")}>Yes</button>
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.ebola_marburg || "") === "no")} onClick={() => setCountryExposure(c.id, "ebola_marburg", "no")}>No</button>
                </div>
              </div>
            )}

            {showCchf && (
              <div className="mt-4 border-l-2 border-slate-200 pl-4">
                <div className="text-sm text-slate-800 mb-2">Did they sustain a tick bite, crush a tick, or have contact with animal slaughter?</div>
                <div className="flex gap-2">
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.cchf || "") === "yes")} onClick={() => setCountryExposure(c.id, "cchf", "yes")}>Yes</button>
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.cchf || "") === "no")} onClick={() => setCountryExposure(c.id, "cchf", "no")}>No</button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });

    let requiredGlobalQs = 2, answeredGlobalQs = 0;
    if (["yes", "no"].includes(exposuresGlobal.q1_outbreak)) answeredGlobalQs++;
    if (["yes", "no"].includes(exposuresGlobal.q2_bleeding)) answeredGlobalQs++;
    return { countryBlocks: blocks, allAnswered: answeredGlobalQs + answeredCountryQs === requiredGlobalQs + requiredCountryQs };
  }, [selected, normalizedMap, exposuresByCountry, exposuresGlobal, setCountryExposure]);

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-slate-900">Exposure Questions</h2>
      <div className="space-y-6">
        {countryBlocks}

        {/* Global questions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-800 mb-3">{Q.GLOBAL_OUTBREAK.text}</div>
          <div className="flex gap-2">
            <button type="button" className={yesNoBtn(exposuresGlobal.q1_outbreak === "yes")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "yes" })}>Yes</button>
            <button type="button" className={yesNoBtn(exposuresGlobal.q1_outbreak === "no")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "no" })}>No</button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-800 mb-3">{Q.GLOBAL_BLEEDING.text}</div>
          <div className="flex gap-2">
            <button type="button" className={yesNoBtn(exposuresGlobal.q2_bleeding === "yes")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "yes" })}>Yes</button>
            <button type="button" className={yesNoBtn(exposuresGlobal.q2_bleeding === "no")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "no" })}>No</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
        <button type="button" onClick={onBackToReview} className={btnSecondary}>Back</button>
        <button type="button" onClick={onReset} className={btnSecondary}>Reset</button>
        <button type="button" disabled={!allAnswered} onClick={onContinueToSummary} className={btnPrimary}>Continue to Summary</button>
      </div>
    </div>
  );
}
