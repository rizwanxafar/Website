// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/SummaryStep.jsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import DecisionCard from "@/components/DecisionCard";
import { normalizeName } from "@/utils/names";

const yesNoBtn = (active) =>
  `px-3 py-1.5 text-sm font-medium rounded-md border-2 ${
    active
      ? "text-white bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] border-[hsl(var(--brand))] dark:border-[hsl(var(--accent))]"
      : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
  }`;

const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (d = "") => txt(d).includes("no known hcid");
const isTravelAssociated = (d = "") => txt(d).includes("travel associated");

// Match ExposuresStep: treat “import-linked” evidence as non-triggering
const isImportedLike = (e = "") =>
  /(imported cases only|associated with a case import|import[-\s]?related)/i.test(String(e));

// Robust matchers for disease names
const RX = {
  lassa: /lassa/i,
  ebmarb: /(ebola|ebolavirus|ebola\s*virus|e\.?v\.?d|marburg)/i,
  cchf: /(cchf|crimean[-\s]?congo|crimea[-\s]?congo)/i,
};
const hasDisease = (entries = [], rx) =>
  entries.some((e) => rx.test(String(e?.disease || "")));

export default function SummaryStep({
  selected,
  normalizedMap,
  exposuresGlobal,
  exposuresByCountry,
  entryMode = "normal", // "normal" | "screeningRed"
  onBackToExposures,
  onBackToScreen,
  onReset,
}) {
  const fromScreeningRed = entryMode === "screeningRed";

  // ----- Exposure completion / any-yes rollup -----
  const { allAnswered, anyYes } = useMemo(() => {
    let requiredCountryQs = 0;
    let answeredCountryQs = 0;
    let anyYesLocal = false;

    selected.forEach((c) => {
      const key = normalizeName(c.name || "");
      const entries = normalizedMap.get(key) || [];

      // EXACTLY match ExposuresStep filter
      const entriesFiltered = (entries || []).filter(
        (e) =>
          !isNoKnownHcid(e.disease) &&
          !isTravelAssociated(e.disease) &&
          !isImportedLike(e.evidence)
      );

      const row = exposuresByCountry[c.id] || {};
      const showLassa = hasDisease(entriesFiltered, RX.lassa);
      const showEbMarb = hasDisease(entriesFiltered, RX.ebmarb);
      const showCchf = hasDisease(entriesFiltered, RX.cchf);

      const ansLassa = showLassa ? row.lassa || "" : null;
      const ansEbMarb = showEbMarb ? row.ebola_marburg || "" : null;
      const ansCchf = showCchf ? row.cchf || "" : null;

      [ansLassa, ansEbMarb, ansCchf].forEach((a) => {
        if (a !== null) {
          requiredCountryQs += 1;
          if (a === "yes" || a === "no") answeredCountryQs += 1;
          if (a === "yes") anyYesLocal = true;
        }
      });
    });

    // Include BOTH global questions: outbreak + bleeding
    let requiredGlobalQs = 2;
    let answeredGlobalQs = 0;
    const outbreak = exposuresGlobal.q1_outbreak;
    const bleeding = exposuresGlobal.q2_bleeding;

    if (outbreak === "yes" || outbreak === "no") answeredGlobalQs += 1;
    if (bleeding === "yes" || bleeding === "no") answeredGlobalQs += 1;

    const allAnswered =
      answeredCountryQs + answeredGlobalQs ===
      requiredCountryQs + requiredGlobalQs;

    return {
      allAnswered,
      anyYes:
        anyYesLocal ||
        outbreak === "yes" ||
        bleeding === "yes",
    };
  }, [selected, normalizedMap, exposuresByCountry, exposuresGlobal]);

  // ----- Amber pathway state -----
  const [amberMalariaPositive, setAmberMalariaPositive] = useState("");
  const [amberAltDx, setAmberAltDx] = useState("");
  const [amberConcern72h, setAmberConcern72h] = useState("");
  const setAmberMalaria = (v) => {
    setAmberMalariaPositive(v);
    setAmberAltDx("");
    setAmberConcern72h("");
  };

  // ----- Shared red chain state -----
  const [preMalariaMalariaPositive, setPreMalariaMalariaPositive] = useState("");
  const [preMalariaOutbreakReturn, setPreMalariaOutbreakReturn] = useState("");
  const [preMalariaConcern72h, setPreMalariaConcern72h] = useState("");
  const [preMalariaSevere, setPreMalariaSevere] = useState("");
  const [preMalariaFitOP, setPreMalariaFitOP] = useState("");
  const [preMalariaVhfPositive, setPreMalariaVhfPositive] = useState("");

  const setMalariaResult = (v) => {
    setPreMalariaMalariaPositive(v);
    setPreMalariaOutbreakReturn("");
    setPreMalariaConcern72h("");
    setPreMalariaSevere("");
    setPreMalariaFitOP("");
    setPreMalariaVhfPositive("");
  };
  const setOutbreakReturn = (v) => {
    setPreMalariaOutbreakReturn(v);
    setPreMalariaConcern72h("");
    setPreMalariaSevere("");
    setPreMalariaFitOP("");
    setPreMalariaVhfPositive("");
  };
  const setConcern72h = (v) => {
    setPreMalariaConcern72h(v);
    setPreMalariaSevere("");
    setPreMalariaFitOP("");
    setPreMalariaVhfPositive("");
  };

  // ---------- Post-malaria red activation (for amber branch) ----------
  const [postRedActive, setPostRedActive] = useState(false);
  const activatedRef = useRef(false);

  const isPostMalariaRed =
    (!anyYes && allAnswered) && (
      (amberMalariaPositive === "yes" && amberConcern72h === "yes") ||
      (amberMalariaPositive === "no" && amberAltDx === "no" && amberConcern72h === "yes")
    );

  useEffect(() => {
    if (isPostMalariaRed && !activatedRef.current) {
      activatedRef.current = true;
      setPostRedActive(true);
      setPreMalariaSevere("");
      setPreMalariaFitOP("");
      setPreMalariaVhfPositive("");
    }
    if (!isPostMalariaRed) {
      activatedRef.current = false;
      setPostRedActive(false);
    }
  }, [isPostMalariaRed]);

  // ---------- Shared blocks ----------
  const AdmitBlock = () => (
    <>
      <DecisionCard tone="red" title="Admit" />
      <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
        <div className="text-sm mb-1">VHF test result positive?</div>
        <div className="flex gap-2">
          <button
            type="button"
            className={yesNoBtn(preMalariaVhfPositive === "yes")}
            onClick={() => setPreMalariaVhfPositive("yes")}
          >
            Yes
          </button>
          <button
            type="button"
            className={yesNoBtn(preMalariaVhfPositive === "no")}
            onClick={() => setPreMalariaVhfPositive("no")}
          >
            No
          </button>
        </div>
      </div>

      {preMalariaVhfPositive === "yes" && (
        <DecisionCard tone="red" title="CONFIRMED VHF">
          <ul className="list-disc pl-5">
            <li>Contact NHSE EPRR (020 8168 0053) to arrange transfer to HLIU</li>
            <li>Launch full public health actions including categorisation and management of contacts</li>
          </ul>
        </DecisionCard>
      )}
      {preMalariaVhfPositive === "no" && (
        <DecisionCard tone="green" title="VHF unlikely; manage locally" />
      )}
    </>
  );

  const OPBlock = () => (
    <>
      <DecisionCard tone="red" title="Outpatient management">
        <ul className="list-disc pl-5">
          <li>Inform local HP Team</li>
          <li>Ensure patient contact details recorded</li>
          <li>Patient self-isolation and self-transportation</li>
          <li>Follow up VHF test result</li>
          <li>Review daily</li>
        </ul>
      </DecisionCard>

      <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
        <div className="text-sm mb-1">VHF test result positive?</div>
        <div className="flex gap-2">
          <button
            type="button"
            className={yesNoBtn(preMalariaVhfPositive === "yes")}
            onClick={() => setPreMalariaVhfPositive("yes")}
          >
            Yes
          </button>
          <button
            type="button"
            className={yesNoBtn(preMalariaVhfPositive === "no")}
            onClick={() => setPreMalariaVhfPositive("no")}
          >
            No
          </button>
        </div>
      </div>

      {preMalariaVhfPositive === "yes" && (
        <DecisionCard tone="red" title="CONFIRMED VHF">
          <ul className="list-disc pl-5">
            <li>Contact NHSE EPRR (020 8168 0053) to arrange transfer to HLIU</li>
            <li>Launch full public health actions including categorisation and management of contacts</li>
          </ul>
        </DecisionCard>
      )}
      {preMalariaVhfPositive === "no" && (
        <DecisionCard tone="green" title="VHF unlikely; manage locally" />
      )}
    </>
  );

  // ---------------- RENDER ----------------
  if (fromScreeningRed) {
    /* unchanged content below … */
  }

  // The rest of your file remains unchanged.
}
