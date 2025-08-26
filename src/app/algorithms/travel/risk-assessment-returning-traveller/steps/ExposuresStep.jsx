// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ExposuresStep.jsx
"use client";

import { useEffect, useState } from "react";
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
  // optional future props
  q1Fever,
  q2Exposure,
  onset,
}) {
  // ===== Country exposure questions =====
  let requiredCountryQs = 0;
  let answeredCountryQs = 0;
  let anyYes = false;

  const countryBlocks = selected.map((c, idx) => {
    const key = String(c.name || "").toLowerCase();
    const entries = normalizedMap.get(key) || [];

    // Exclude “No known HCIDs”, “travel associated cases as below”, and “Imported cases only”
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

  // ===== Global questions =====
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

  // ===== Amber pathway (all exposure answers NO) =====
  const [amberMalariaPositive, setAmberMalariaPositive] = useState("");
  const [amberAltDx, setAmberAltDx] = useState("");
  const [amberConcern72h, setAmberConcern72h] = useState("");
  const setAmberMalaria = (v) => {
    setAmberMalariaPositive(v);
    setAmberAltDx("");
    setAmberConcern72h("");
  };

  // ===== Red pathway state (shared by pre- & post-malaria) =====
  const [preMalariaMalariaPositive, setPreMalariaMalariaPositive] = useState(""); // yes/no
  const [preMalariaOutbreakReturn, setPreMalariaOutbreakReturn] = useState("");   // yes/no
  const [preMalariaConcern72h, setPreMalariaConcern72h] = useState("");           // yes/no
  const [preMalariaSevere, setPreMalariaSevere] = useState("");                   // yes/no
  const [preMalariaFitOP, setPreMalariaFitOP] = useState("");                     // yes/no
  const [preMalariaVhfPositive, setPreMalariaVhfPositive] = useState("");         // yes/no

  // Helpers to reset red-chain states when entering it
  const resetRedChain = () => {
    setPreMalariaSevere("");
    setPreMalariaFitOP("");
    setPreMalariaVhfPositive("");
  };

  // Pre-malaria controls
  const setMalariaResult = (v) => {
    setPreMalariaMalariaPositive(v);
    setPreMalariaOutbreakReturn("");
    setPreMalariaConcern72h("");
    resetRedChain();
  };
  const setOutbreakReturn = (v) => {
    setPreMalariaOutbreakReturn(v);
    setPreMalariaConcern72h("");
    resetRedChain();
  };
  const setConcern72h = (v) => {
    setPreMalariaConcern72h(v);
    resetRedChain();
  };
  const setSevere = (v) => setPreMalariaSevere(v);
  const setFitOP = (v) => setPreMalariaFitOP(v);

  // Determine POST-MALARIA red in the amber branch (no initial exposures, but escalated after malaria workflow)
  const isPostMalariaRed =
    (!anyYes && allAnswered) && (
      // Amber → Malaria YES → concern 72h YES
      (amberMalariaPositive === "yes" && amberConcern72h === "yes") ||
      // Amber → Malaria NO → AltDx NO → concern 72h YES
      (amberMalariaPositive === "no" && amberAltDx === "no" && amberConcern72h === "yes")
    );

  // IMPORTANT: Reset the red-chain state ONCE when we first enter post-malaria red
  useEffect(() => {
    if (isPostMalariaRed) {
      resetRedChain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPostMalariaRed]);

  // Shared blocks
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

  // Reusable red-chain renderer (used by pre- & post-malaria red)
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
            onClick={() => setSevere("yes")}
          >Yes</button>
          <button
            type="button"
            className={yesNoBtn(preMalariaSevere === "no")}
            onClick={() => setSevere("no")}
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
                onClick={() => setFitOP("yes")}
              >Yes</button>
              <button
                type="button"
                className={yesNoBtn(preMalariaFitOP === "no")}
                onClick={() => setFitOP("no")}
              >No</button>
            </div>
          </div>

          {preMalariaFitOP === "no" && <AdmitBlock />}
          {preMalariaFitOP === "yes" && <OPBlock />}
        </>
      )}
    </>
  );

  // ===== Right-hand summary panel =====
  let summaryNode = (
    <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
      <div className="text-sm text-slate-600 dark:text-slate-300">
        Answer all exposure questions to see the summary.
      </div>
    </div>
  );

  if (allAnswered) {
    if (!anyYes) {
      // ---------------- AMBER PATHWAY (all exposure answers NO) ----------------
      summaryNode = (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Outcome of risk assessment
          </div>

          <AmberSummary title="Minimal risk of VHF">
            <ul className="list-disc pl-5">
              <li>Urgent Malaria investigation</li>
              <li>Urgent local investigations as normally appropriate, including blood cultures.</li>
            </ul>
          </AmberSummary>

          {/* Malaria test? */}
          <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
            <div className="text-sm mb-1">Is the malaria test result positive?</div>
            <div className="flex gap-2">
              <button
                type="button"
                className={yesNoBtn(amberMalariaPositive === "yes")}
                onClick={() => setAmberMalaria("yes")}
              >Yes</button>
              <button
                type="button"
                className={yesNoBtn(amberMalariaPositive === "no")}
                onClick={() => setAmberMalaria("no")}
              >No</button>
            </div>
          </div>

          {/* Malaria POSITIVE in amber branch */}
          {amberMalariaPositive === "yes" && (
            <>
              <DecisionCard tone="green" title="Manage as malaria; VHF unlikely" />
              <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
                <div className="text-sm mb-1">Clinical concern OR no improvement after 72 hours?</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={yesNoBtn(amberConcern72h === "yes")}
                    onClick={() => setAmberConcern72h("yes")}
                  >Yes</button>
                  <button
                    type="button"
                    className={yesNoBtn(amberConcern72h === "no")}
                    onClick={() => setAmberConcern72h("no")}
                  >No</button>
                </div>
              </div>

              {/* POST-MALARIA RED (amber path): if concern/no-improvement = YES */}
              {amberConcern72h === "yes" && (
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

              {amberConcern72h === "no" && (
                <DecisionCard tone="green" title="VHF unlikely; manage locally">
                  <p>Please continue standard local management pathways.</p>
                </DecisionCard>
              )}
            </>
          )}

          {/* Malaria NEGATIVE in amber branch */}
          {amberMalariaPositive === "no" && (
            <>
              <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
                <div className="text-sm mb-1">Alternative diagnosis established?</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={yesNoBtn(amberAltDx === "yes")}
                    onClick={() => setAmberAltDx("yes")}
                  >Yes</button>
                  <button
                    type="button"
                    className={yesNoBtn(amberAltDx === "no")}
                    onClick={() => setAmberAltDx("no")}
                  >No</button>
                </div>
              </div>

              {amberAltDx === "yes" && (
                <DecisionCard tone="green" title="VHF unlikely; manage locally">
                  <p>Please continue standard local management pathways.</p>
                </DecisionCard>
              )}

              {amberAltDx === "no" && (
                <>
                  <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4">
                    <div className="text-sm mb-1">Clinical concern OR no improvement after 72 hours?</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={yesNoBtn(amberConcern72h === "yes")}
                        onClick={() => setAmberConcern72h("yes")}
                      >Yes</button>
                      <button
                        type="button"
                        className={yesNoBtn(amberConcern72h === "no")}
                        onClick={() => setAmberConcern72h("no")}
                      >No</button>
                    </div>
                  </div>

                  {/* POST-MALARIA RED (amber path): if no alt-dx & concern 72h = YES */}
                  {amberConcern72h === "yes" && (
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

                  {amberConcern72h === "no" && (
                    <DecisionCard tone="green" title="VHF unlikely; manage locally">
                      <p>Please continue standard local management pathways.</p>
                    </DecisionCard>
                  )}
                </>
              )}
            </>
          )}
        </div>
      );
    } else {
      // ---------------- PRE-MALARIA RED PATHWAY (any exposure YES) ----------------
      summaryNode = (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Outcome of risk assessment
          </div>

          {/* Immediate red warning as soon as any exposure is YES */}
          <DecisionCard tone="red" title="AT RISK OF VHF">
            <ul className="list-disc pl-5">
              <li>ISOLATE PATIENT IN SIDE ROOM</li>
              <li>Discuss with Infection Consultant (Infectious Disease/Microbiology/Virology)</li>
              <li>Urgent Malaria investigation</li>
              <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
              <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
            </ul>
          </DecisionCard>

          {/* Malaria test question */}
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

          {/* Malaria POSITIVE */}
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

                  {/* Mirror amber behaviour for this branch */}
                  {preMalariaConcern72h === "yes" && (
                    <DecisionCard tone="red" title="AT RISK OF VHF">
                      <ul className="list-disc pl-5">
                        <li>ISOLATE PATIENT IN SIDE ROOM</li>
                        <li>Discuss with Infection Consultant (Infectious Disease/Microbiology/Virology)</li>
                        <li>Urgent Malaria investigation</li>
                        <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
                        <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
                      </ul>
                    </DecisionCard>
                  )}

                  {preMalariaConcern72h === "no" && (
                    <DecisionCard tone="green" title="VHF unlikely; manage locally" />
                  )}
                </>
              )}

              {preMalariaOutbreakReturn === "yes" && (
                <>
                  <AmberSummary title="Manage as Malaria, but consider possibility of dual infection with VHF" />
                  <ActionsCard />
                </>
              )}
            </>
          )}

          {/* Malaria NEGATIVE */}
          {preMalariaMalariaPositive === "no" && <ActionsCard />}

          {/* Enter actions flow ONLY for: (malaria yes & outbreak yes) OR malaria no */}
          {(
            (preMalariaMalariaPositive === "yes" && preMalariaOutbreakReturn === "yes") ||
            (preMalariaMalariaPositive === "no")
          ) && renderSevereChain()}
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
              For current outbreak information, check WHO Disease Outbreak News and UKHSA Monthly Summaries / country-specific risk pages.
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

        {/* Right: sticky outcome */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 h-fit min-h-[200px]">
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
