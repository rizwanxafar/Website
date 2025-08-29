"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import DecisionCard from "@/components/DecisionCard";

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

export default function SummaryStep({
  selected,
  normalizedMap,
  exposuresGlobal,
  exposuresByCountry,
  entryMode = "normal",      // NEW: "normal" | "screeningRed"
  onBackToExposures,
  onBackToScreen,            // NEW: used when coming from screening
  onReset,
}) {
  const fromScreeningRed = entryMode === "screeningRed";

  // Compute exposure completion (used when not from screening)
  const { allAnswered, anyYes } = useMemo(() => {
    let requiredCountryQs = 0;
    let answeredCountryQs = 0;
    let anyYesLocal = false;

    selected.forEach((c) => {
      const key = String(c.name || "").toLowerCase();
      const entries = normalizedMap.get(key) || [];

      const entriesFiltered = (entries || []).filter(
        (e) => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease) && !isImportedOnly(e.evidence)
      );

      const row = exposuresByCountry[c.id] || {};
      const showLassa  = hasDisease(entriesFiltered, "lassa");
      const showEbMarb = hasDisease(entriesFiltered, "ebola") || hasDisease(entriesFiltered, "marburg");
      const showCchf   = hasDisease(entriesFiltered, "cchf");

      const ansLassa  = showLassa  ? row.lassa || "" : null;
      const ansEbMarb = showEbMarb ? row.ebola_marburg || "" : null;
      const ansCchf   = showCchf   ? row.cchf || "" : null;

      [ansLassa, ansEbMarb, ansCchf].forEach((a) => {
        if (a !== null) {
          requiredCountryQs += 1;
          if (a === "yes" || a === "no") answeredCountryQs += 1;
          if (a === "yes") anyYesLocal = true;
        }
      });
    });

    let requiredGlobalQs = 2;
    let answeredGlobalQs = 0;
    if (exposuresGlobal.q1_outbreak === "yes" || exposuresGlobal.q1_outbreak === "no") answeredGlobalQs += 1;
    if (exposuresGlobal.q2_bleeding === "yes" || exposuresGlobal.q2_bleeding === "no") answeredGlobalQs += 1;

    const allAnswered = answeredCountryQs + answeredGlobalQs === requiredCountryQs + requiredGlobalQs;
    return { allAnswered, anyYes: anyYesLocal || exposuresGlobal.q1_outbreak === "yes" || exposuresGlobal.q2_bleeding === "yes" };
  }, [selected, normalizedMap, exposuresByCountry, exposuresGlobal]);

  // ---------- Amber pathway state ----------
  const [amberMalariaPositive, setAmberMalariaPositive] = useState("");
  const [amberAltDx, setAmberAltDx] = useState("");
  const [amberConcern72h, setAmberConcern72h] = useState("");
  const setAmberMalaria = (v) => {
    setAmberMalariaPositive(v);
    setAmberAltDx("");
    setAmberConcern72h("");
  };

  // ---------- Shared red chain state ----------
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
  const ActionsCard = () => (
    <DecisionCard tone="red" title="Immediate actions">
      <ul className="list-disc pl-5">
        <li>Discuss with Infection Consultant (Infectious Disease/Microbiology/Virology)</li>
        <li>Infection Consultant to discuss VHF test with Imported Fever Service (0844 7788990)</li>
        <li>If VHF testing agreed with IFS, notify local Health Protection Team</li>
        <li>Consider empiric antimicrobials</li>
      </ul>
    </DecisionCard>
  );

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
          >Yes</button>
          <button
            type="button"
            className={yesNoBtn(preMalariaVhfPositive === "no")}
            onClick={() => setPreMalariaVhfPositive("no")}
          >No</button>
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
          >Yes</button>
          <button
            type="button"
            className={yesNoBtn(preMalariaVhfPositive === "no")}
            onClick={() => setPreMalariaVhfPositive("no")}
          >No</button>
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

  const renderSevereChain = () => (
    <>
      {/* Severe features */}
      <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
        <div className="text-sm mb-1">
          Does the patient have extensive bruising or active bleeding or uncontrolled diarrhoea or uncontrolled vomiting?
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={yesNoBtn(preMalariaSevere === "yes")}
            onClick={() => setPreMalariaSevere("yes")}
          >Yes</button>
          <button
            type="button"
            className={yesNoBtn(preMalariaSevere === "no")}
            onClick={() => setPreMalariaSevere("no")}
          >No</button>
        </div>
      </div>

      {preMalariaSevere === "yes" && <AdmitBlock />}

      {preMalariaSevere === "no" && (
        <>
          {/* Fit for OP? */}
          <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
            <div className="text-sm mb-1">Is the patient fit for outpatient management?</div>
            <div className="flex gap-2">
              <button
                type="button"
                className={yesNoBtn(preMalariaFitOP === "yes")}
                onClick={() => setPreMalariaFitOP("yes")}
              >Yes</button>
              <button
                type="button"
                className={yesNoBtn(preMalariaFitOP === "no")}
                onClick={() => setPreMalariaFitOP("no")}
              >No</button>
            </div>
          </div>

          {preMalariaFitOP === "no" && <AdmitBlock />}
          {preMalariaFitOP === "yes" && <OPBlock />}
        </>
      )}
    </>
  );

  // --------- Render ---------

  // If we came from Screening red, bypass exposure completeness and show pre-malaria chain
  if (fromScreeningRed) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Outcome of risk assessment
        </h2>

        <DecisionCard tone="red" title="AT RISK OF VHF">
          <ul className="list-disc pl-5">
            <li>ISOLATE PATIENT IN SIDE ROOM</li>
            <li>Discuss with Infection Consultant (Infectious Disease/Microbiology/Virology)</li>
            <li>Urgent Malaria investigation</li>
            <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
            <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
          </ul>
        </DecisionCard>

        {/* Malaria test? */}
        <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
          <div className="text-sm mb-1">Is the malaria test positive?</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={yesNoBtn(preMalariaMalariaPositive === "yes")}
              onClick={() => setMalariaResult("yes")}
            >Yes</button>
            <button
              type="button"
              className={yesNoBtn(preMalariaMalariaPositive === "no")}
              onClick={() => setMalariaResult("no")}
            >No</button>
          </div>
        </div>

        {/* Malaria positive */}
        {preMalariaMalariaPositive === "yes" && (
          <>
            <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
              <div className="text-sm mb-1">Has the patient returned from a VHF outbreak area?</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={yesNoBtn(preMalariaOutbreakReturn === "yes")}
                  onClick={() => setOutbreakReturn("yes")}
                >Yes</button>
                <button
                  type="button"
                  className={yesNoBtn(preMalariaOutbreakReturn === "no")}
                  onClick={() => setOutbreakReturn("no")}
                >No</button>
              </div>
            </div>

            {preMalariaOutbreakReturn === "no" && (
              <>
                <DecisionCard tone="green" title="Manage as malaria; VHF unlikely" />
                <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
                  <div className="text-sm mb-1">Clinical concern OR no improvement after 72 hours?</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={yesNoBtn(preMalariaConcern72h === "yes")}
                      onClick={() => setConcern72h("yes")}
                    >Yes</button>
                    <button
                      type="button"
                      className={yesNoBtn(preMalariaConcern72h === "no")}
                      onClick={() => setConcern72h("no")}
                    >No</button>
                  </div>
                </div>

                {preMalariaConcern72h === "yes" && (
                  <>
                    <DecisionCard tone="red" title="AT RISK OF VHF">
                      <ul className="list-disc pl-5">
                        <li>ISOLATE PATIENT IN SIDE ROOM</li>
                        <li>Discuss with Infection Consultant (Infectious Disease/Microbiology/Virology)</li>
                        <li>Urgent Malaria investigation</li>
                        <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
                        <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
                      </ul>
                    </DecisionCard>
                    {renderSevereChain()}
                  </>
                )}

                {preMalariaConcern72h === "no" && (
                  <DecisionCard tone="green" title="VHF unlikely; manage locally" />
                )}
              </>
            )}

            {preMalariaOutbreakReturn === "yes" && (
              <>
                <DecisionCard tone="amber" title="Manage as Malaria, but consider possibility of dual infection with VHF" />
                <DecisionCard tone="red" title="Immediate actions">
                  <ul className="list-disc pl-5">
                    <li>Discuss with Infection Consultant (Infectious Disease/Microbiology/Virology)</li>
                    <li>Infection Consultant to discuss VHF test with Imported Fever Service (0844 7788990)</li>
                    <li>If VHF testing agreed with IFS, notify local Health Protection Team</li>
                    <li>Consider empiric antimicrobials</li>
                  </ul>
                </DecisionCard>
                {renderSevereChain()}
              </>
            )}
          </>
        )}

        {/* Malaria negative */}
        {preMalariaMalariaPositive === "no" && (
          <>
            {ActionsCard()}
            {renderSevereChain()}
          </>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBackToScreen}
            className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400"
          >
            Back to screening
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

  // Normal summary (after exposures)
  if (!allAnswered) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
        <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
          <p className="text-sm">Please answer all exposure questions first.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBackToExposures}
            className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400"
          >
            Back to exposures
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

  // …(unchanged from your current SummaryStep: amber branch or pre-malaria red depending on anyYes)…
  // (Keep the rest of your existing SummaryStep render here.)
}
