"use client";

import { useMemo } from "react";
import { EXPOSURE_QUESTIONS as Q } from "@/data/diseaseQuestions";
import { normalizeName } from "@/utils/names";

// --- BLACKOUT THEME HELPERS ---
const yesNoBtn = (active) =>
  "px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded border transition-all " +
  (active
    ? "bg-red-600 border-red-600 text-white shadow-lg"
    : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300");

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 " +
  "text-sm font-bold font-mono tracking-wide text-white uppercase " +
  "bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition-all";

const btnSecondary =
  "rounded-lg px-4 py-2 border border-neutral-800 bg-neutral-900 text-neutral-400 " +
  "hover:text-white hover:border-neutral-600 text-xs font-bold font-mono uppercase tracking-wide transition-all";

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
      // ⬇️ USE SHARED NORMALIZER
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
          {idx > 0 && <div className="border-t border-neutral-800 pt-6 -mt-2" />}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
            <div className="font-bold text-white text-lg mb-4">{c.name}</div>
            
            {!showLassa && !showEbMarb && !showCchf && (
              <p className="text-sm text-neutral-500 italic">No specific exposure questions apply.</p>
            )}

            {showLassa && (
              <div className="mt-4 border-l-2 border-neutral-700 pl-4">
                <div className="text-sm text-neutral-300 mb-2">In this country, has the patient lived or worked in basic rural conditions?</div>
                <div className="flex gap-2">
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.lassa || "") === "yes")} onClick={() => setCountryExposure(c.id, "lassa", "yes")}>Yes</button>
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.lassa || "") === "no")} onClick={() => setCountryExposure(c.id, "lassa", "no")}>No</button>
                </div>
              </div>
            )}
            {showEbMarb && (
              <div className="mt-4 border-l-2 border-neutral-700 pl-4">
                <div className="text-sm text-neutral-300 mb-2">Did they visit caves/mines, or contact primates/antelopes/bats (or eat bushmeat)?</div>
                <div className="flex gap-2">
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.ebola_marburg || "") === "yes")} onClick={() => setCountryExposure(c.id, "ebola_marburg", "yes")}>Yes</button>
                  <button type="button" className={yesNoBtn((exposuresByCountry[c.id]?.ebola_marburg || "") === "no")} onClick={() => setCountryExposure(c.id, "ebola_marburg", "no")}>No</button>
                </div>
              </div>
            )}
            {showCchf && (
              <div className="mt-4 border-l-2 border-neutral-700 pl-4">
                <div className="text-sm text-neutral-300 mb-2">Did they sustain a tick bite, crush a tick, or have contact with animal slaughter?</div>
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
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white">Exposure Questions</h2>
      <div className="space-y-6">
        {countryBlocks}
        
        {/* Global Qs */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
          <div className="text-sm text-neutral-200 mb-2">{Q.GLOBAL_OUTBREAK.text}</div>
          <div className="flex gap-2">
            <button type="button" className={yesNoBtn(exposuresGlobal.q1_outbreak === "yes")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "yes" })}>Yes</button>
            <button type="button" className={yesNoBtn(exposuresGlobal.q1_outbreak === "no")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q1_outbreak: "no" })}>No</button>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
          <div className="text-sm text-neutral-200 mb-2">{Q.GLOBAL_BLEEDING.text}</div>
          <div className="flex gap-2">
            <button type="button" className={yesNoBtn(exposuresGlobal.q2_bleeding === "yes")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "yes" })}>Yes</button>
            <button type="button" className={yesNoBtn(exposuresGlobal.q2_bleeding === "no")} onClick={() => setExposuresGlobal({ ...exposuresGlobal, q2_bleeding: "no" })}>No</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-6 border-t border-neutral-800">
        <button type="button" onClick={onBackToReview} className={btnSecondary}>Back</button>
        <button type="button" disabled={!allAnswered} onClick={onContinueToSummary} className={btnPrimary}>Continue to Summary</button>
        <button type="button" onClick={onReset} className={btnSecondary}>Reset</button>
      </div>
    </div>
  );
}
