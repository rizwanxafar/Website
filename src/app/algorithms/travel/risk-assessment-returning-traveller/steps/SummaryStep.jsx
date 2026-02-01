// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/SummaryStep.jsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import DecisionCard from "@/components/DecisionCard";
import { normalizeName } from "@/utils/names";

// --- THEME CONSTANTS ---
const yesNoBtn = (active) =>
  "px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider rounded border transition-all " +
  (active
    ? "bg-red-600 border-red-600 text-white shadow"
    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300");

const btnSecondary = 
  "rounded-lg px-4 py-2 border border-neutral-800 bg-neutral-900 text-neutral-400 " +
  "hover:text-white hover:border-neutral-600 text-xs font-bold font-mono uppercase tracking-wide transition-all";
// -----------------------

const txt = (s = "") => String(s).toLowerCase();
const isNoKnownHcid = (d = "") => txt(d).includes("no known hcid");
const isTravelAssociated = (d = "") => txt(d).includes("travel associated");
const isImportedLike = (e = "") => /(imported cases only|associated with a case import|import[-\s]?related)/i.test(String(e));
const RX = { lassa: /lassa/i, ebmarb: /(ebola|ebolavirus|ebola\s*virus|e\.?v\.?d|marburg)/i, cchf: /(cchf|crimean[-\s]?congo|crimea[-\s]?congo)/i };
const hasDisease = (entries = [], rx) => entries.some((e) => rx.test(String(e?.disease || "")));

export default function SummaryStep({
  selected, normalizedMap, exposuresGlobal, exposuresByCountry, entryMode = "normal", onBackToExposures, onBackToScreen, onReset,
}) {
  const fromScreeningRed = entryMode === "screeningRed";

  const { allAnswered, anyYes } = useMemo(() => {
    let requiredCountryQs = 0, answeredCountryQs = 0, anyYesLocal = false;
    selected.forEach((c) => {
      const key = normalizeName(c.name || "");
      const entries = normalizedMap.get(key) || [];
      const entriesFiltered = (entries || []).filter(e => !isNoKnownHcid(e.disease) && !isTravelAssociated(e.disease) && !isImportedLike(e.evidence));
      const row = exposuresByCountry[c.id] || {};
      const showLassa = hasDisease(entriesFiltered, RX.lassa);
      const showEbMarb = hasDisease(entriesFiltered, RX.ebmarb);
      const showCchf = hasDisease(entriesFiltered, RX.cchf);
      [showLassa ? row.lassa : null, showEbMarb ? row.ebola_marburg : null, showCchf ? row.cchf : null].forEach((a) => {
        if (a !== null) {
          requiredCountryQs++;
          if (a === "yes" || a === "no") answeredCountryQs++;
          if (a === "yes") anyYesLocal = true;
        }
      });
    });
    let requiredGlobalQs = 2, answeredGlobalQs = 0;
    if (["yes", "no"].includes(exposuresGlobal.q1_outbreak)) answeredGlobalQs++;
    if (["yes", "no"].includes(exposuresGlobal.q2_bleeding)) answeredGlobalQs++;
    return { allAnswered: answeredCountryQs + answeredGlobalQs === requiredCountryQs + requiredGlobalQs, anyYes: anyYesLocal || exposuresGlobal.q1_outbreak === "yes" || exposuresGlobal.q2_bleeding === "yes" };
  }, [selected, normalizedMap, exposuresByCountry, exposuresGlobal]);

  const [amberMalariaPositive, setAmberMalariaPositive] = useState("");
  const [amberAltDx, setAmberAltDx] = useState("");
  const [amberConcern72h, setAmberConcern72h] = useState("");
  const setAmberMalaria = (v) => { setAmberMalariaPositive(v); setAmberAltDx(""); setAmberConcern72h(""); };

  const [preMalariaMalariaPositive, setPreMalariaMalariaPositive] = useState("");
  const [preMalariaOutbreakReturn, setPreMalariaOutbreakReturn] = useState("");
  const [preMalariaConcern72h, setPreMalariaConcern72h] = useState("");
  const [preMalariaSevere, setPreMalariaSevere] = useState("");
  const [preMalariaFitOP, setPreMalariaFitOP] = useState("");
  const [preMalariaVhfPositive, setPreMalariaVhfPositive] = useState("");

  const setMalariaResult = (v) => { setPreMalariaMalariaPositive(v); setPreMalariaOutbreakReturn(""); setPreMalariaConcern72h(""); setPreMalariaSevere(""); setPreMalariaFitOP(""); setPreMalariaVhfPositive(""); };
  const setOutbreakReturn = (v) => { setPreMalariaOutbreakReturn(v); setPreMalariaConcern72h(""); setPreMalariaSevere(""); setPreMalariaFitOP(""); setPreMalariaVhfPositive(""); };
  const setConcern72h = (v) => { setPreMalariaConcern72h(v); setPreMalariaSevere(""); setPreMalariaFitOP(""); setPreMalariaVhfPositive(""); };

  const [postRedActive, setPostRedActive] = useState(false);
  const activatedRef = useRef(false);
  const isPostMalariaRed = (!anyYes && allAnswered) && ((amberMalariaPositive === "yes" && amberConcern72h === "yes") || (amberMalariaPositive === "no" && amberAltDx === "no" && amberConcern72h === "yes"));

  useEffect(() => {
    if (isPostMalariaRed && !activatedRef.current) { activatedRef.current = true; setPostRedActive(true); setPreMalariaSevere(""); setPreMalariaFitOP(""); setPreMalariaVhfPositive(""); }
    if (!isPostMalariaRed) { activatedRef.current = false; setPostRedActive(false); }
  }, [isPostMalariaRed]);

  const QuestionBlock = ({ label, val, setVal }) => (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
      <div className="text-sm text-neutral-300 mb-2">{label}</div>
      <div className="flex gap-2">
        <button type="button" className={yesNoBtn(val === "yes")} onClick={() => setVal("yes")}>Yes</button>
        <button type="button" className={yesNoBtn(val === "no")} onClick={() => setVal("no")}>No</button>
      </div>
    </div>
  );

  const RiskRedCard = () => (
    <DecisionCard tone="red" title="AT RISK OF VHF">
      <ul className="list-disc pl-5 text-neutral-300 text-sm space-y-1">
        <li><strong className="text-white">ISOLATE PATIENT IN SIDE ROOM</strong></li>
        <li>Discuss with Infection Consultant (Infectious Disease/Microbiology/Virology)</li>
        <li>Urgent Malaria investigation</li>
        <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
        <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
      </ul>
    </DecisionCard>
  );

  const renderRedLogic = () => (
    <>
      <RiskRedCard />
      <QuestionBlock label="Is the malaria test positive?" val={preMalariaMalariaPositive} setVal={setMalariaResult} />
      
      {preMalariaMalariaPositive === "yes" && (
        <>
          <QuestionBlock label="Has the patient returned from a VHF outbreak area?" val={preMalariaOutbreakReturn} setVal={setOutbreakReturn} />
          
          {preMalariaOutbreakReturn === "no" && (
            <>
              <DecisionCard tone="green" title="Manage as Malaria; VHF unlikely" />
              <QuestionBlock label="Clinical concern OR no improvement after 72h?" val={preMalariaConcern72h} setVal={setConcern72h} />
              
              {preMalariaConcern72h === "yes" && (
                <>
                  <DecisionCard tone="red" title="AT RISK OF VHF">
                     <p className="text-neutral-300">Re-evaluate for VHF.</p>
                  </DecisionCard>
                  {renderSevereChain({ preMalariaSevere, setPreMalariaSevere, preMalariaFitOP, setPreMalariaFitOP, preMalariaVhfPositive, setPreMalariaVhfPositive })}
                </>
              )}
              {preMalariaConcern72h === "no" && <DecisionCard tone="green" title="VHF Unlikely; manage locally" />}
            </>
          )}

          {preMalariaOutbreakReturn === "yes" && (
            <>
              <DecisionCard tone="amber" title="Manage as Malaria, but consider possibility of dual infection with VHF" />
              <RiskRedCard />
              {renderSevereChain({ preMalariaSevere, setPreMalariaSevere, preMalariaFitOP, setPreMalariaFitOP, preMalariaVhfPositive, setPreMalariaVhfPositive })}
            </>
          )}
        </>
      )}

      {preMalariaMalariaPositive === "no" && (
        <>
          <RiskRedCard />
          {renderSevereChain({ preMalariaSevere, setPreMalariaSevere, preMalariaFitOP, setPreMalariaFitOP, preMalariaVhfPositive, setPreMalariaVhfPositive })}
        </>
      )}
    </>
  );

  // --- RENDER MODES ---

  if (fromScreeningRed) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Assessment Outcome</h2>
        {renderRedLogic()}
        <Footer onBack={onBackToScreen} onReset={onReset} />
      </div>
    );
  }

  if (!allAnswered) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Summary</h2>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 text-neutral-400">Please answer all exposure questions first.</div>
        <Footer onBack={onBackToExposures} onReset={onReset} />
      </div>
    );
  }

  if (!anyYes) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Outcome</h2>
        <DecisionCard tone="amber" title="Minimal Risk of VHF"><p className="text-neutral-300">Urgent Malaria & local investigations.</p></DecisionCard>
        <QuestionBlock label="Is malaria test positive?" val={amberMalariaPositive} setVal={setAmberMalaria} />
        
        {amberMalariaPositive === "yes" && (
          <>
            <DecisionCard tone="green" title="Manage as Malaria" />
            <QuestionBlock label="Clinical concern OR no improvement after 72h?" val={amberConcern72h} setVal={setAmberConcern72h} />
            {amberConcern72h === "yes" && <>{renderRedLogic()}</>}
            {amberConcern72h === "no" && <DecisionCard tone="green" title="VHF Unlikely" />}
          </>
        )}
        {amberMalariaPositive === "no" && (
          <>
            <QuestionBlock label="Alternative diagnosis established?" val={amberAltDx} setVal={setAmberAltDx} />
            {amberAltDx === "yes" && <DecisionCard tone="green" title="VHF Unlikely" />}
            {amberAltDx === "no" && (
              <>
                <QuestionBlock label="Clinical concern OR no improvement after 72h?" val={amberConcern72h} setVal={setAmberConcern72h} />
                {amberConcern72h === "yes" && <>{renderRedLogic()}</>}
                {amberConcern72h === "no" && <DecisionCard tone="green" title="VHF Unlikely" />}
              </>
            )}
          </>
        )}
        <Footer onBack={onBackToExposures} onReset={onReset} />
      </div>
    );
  }

  // Branch 4: RED (High Risk / Any Yes)
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Outcome</h2>
      {renderRedLogic()}
      <Footer onBack={onBackToExposures} onReset={onReset} />
    </div>
  );
}

function Footer({ onBack, onReset }) {
  return (
    <div className="flex gap-3 pt-6 border-t border-neutral-800">
      <button type="button" onClick={onBack} className={btnSecondary}>Back</button>
      <button type="button" onClick={onReset} className={btnSecondary}>New Assessment</button>
    </div>
  );
}

function renderSevereChain({ preMalariaSevere, setPreMalariaSevere, preMalariaFitOP, setPreMalariaFitOP, preMalariaVhfPositive, setPreMalariaVhfPositive }) {
  const QuestionBlock = ({ label, val, setVal }) => (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
      <div className="text-sm text-neutral-300 mb-2">{label}</div>
      <div className="flex gap-2">
        <button type="button" className={yesNoBtn(val === "yes")} onClick={() => setVal("yes")}>Yes</button>
        <button type="button" className={yesNoBtn(val === "no")} onClick={() => setVal("no")}>No</button>
      </div>
    </div>
  );
  return (
    <>
      <QuestionBlock label="Extensive bruising, bleeding, uncontrolled D&V?" val={preMalariaSevere} setVal={setPreMalariaSevere} />
      {preMalariaSevere === "yes" && <><DecisionCard tone="red" title="ADMIT" /><VhfResultBlock preMalariaVhfPositive={preMalariaVhfPositive} setPreMalariaVhfPositive={setPreMalariaVhfPositive} /></>}
      {preMalariaSevere === "no" && (
        <>
          <QuestionBlock label="Fit for outpatient management?" val={preMalariaFitOP} setVal={setPreMalariaFitOP} />
          {preMalariaFitOP === "no" && <><DecisionCard tone="red" title="ADMIT" /><VhfResultBlock preMalariaVhfPositive={preMalariaVhfPositive} setPreMalariaVhfPositive={setPreMalariaVhfPositive} /></>}
          {preMalariaFitOP === "yes" && <><DecisionCard tone="red" title="OUTPATIENT MANAGEMENT"><p className="text-neutral-300">Inform HP Team. Self-isolate.</p></DecisionCard><VhfResultBlock preMalariaVhfPositive={preMalariaVhfPositive} setPreMalariaVhfPositive={setPreMalariaVhfPositive} /></>}
        </>
      )}
    </>
  );
}

function VhfResultBlock({ preMalariaVhfPositive, setPreMalariaVhfPositive }) {
    const QuestionBlock = ({ label, val, setVal }) => (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
          <div className="text-sm text-neutral-300 mb-2">{label}</div>
          <div className="flex gap-2">
            <button type="button" className={yesNoBtn(val === "yes")} onClick={() => setVal("yes")}>Yes</button>
            <button type="button" className={yesNoBtn(val === "no")} onClick={() => setVal("no")}>No</button>
          </div>
        </div>
    );
  return (
    <>
      <QuestionBlock label="VHF Test Positive?" val={preMalariaVhfPositive} setVal={setPreMalariaVhfPositive} />
      {preMalariaVhfPositive === "yes" && <DecisionCard tone="red" title="CONFIRMED VHF"><p className="text-neutral-300">Contact NHSE EPRR.</p></DecisionCard>}
      {preMalariaVhfPositive === "no" && <DecisionCard tone="green" title="VHF Unlikely" />}
    </>
  );
}
