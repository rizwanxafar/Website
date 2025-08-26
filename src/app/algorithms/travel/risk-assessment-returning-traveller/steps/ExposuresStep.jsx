// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ExposureStep.jsx
"use client";

import { useState } from "react";
import DecisionCard from "@/components/DecisionCard";

export default function ExposureStep({ onReset }) {
  // Track answers
  const [outbreakTravel, setOutbreakTravel] = useState(""); // yes/no
  const [lassaExposure, setLassaExposure] = useState(""); // yes/no
  const [ebolaMarburgExposure, setEbolaMarburgExposure] = useState(""); // yes/no
  const [cchfExposure, setCchfExposure] = useState(""); // yes/no
  const [malariaTest, setMalariaTest] = useState(""); // yes/no
  const [outbreakReturn, setOutbreakReturn] = useState(""); // yes/no
  const [bleeding, setBleeding] = useState(""); // yes/no
  const [outpatient, setOutpatient] = useState(""); // yes/no
  const [vhfResult, setVhfResult] = useState(""); // yes/no
  const [altDiagnosis, setAltDiagnosis] = useState(""); // yes/no;

  // Derived logic
  const anyExposureYes =
    outbreakTravel === "yes" ||
    lassaExposure === "yes" ||
    ebolaMarburgExposure === "yes" ||
    cchfExposure === "yes";

  const allExposureNo =
    outbreakTravel === "no" &&
    lassaExposure === "no" &&
    ebolaMarburgExposure === "no" &&
    cchfExposure === "no";

  return (
    <div className="space-y-6">
      {/* Exposure Questions */}
      <div className="space-y-4">
        <div>
          <p className="font-medium">
            Has the patient travelled to any area where there is a current VHF
            outbreak?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            For latest outbreaks check WHO Disease Outbreak News / UKHSA monthly
            summaries.
          </p>
          <YesNo value={outbreakTravel} onChange={setOutbreakTravel} />
        </div>

        <div>
          <p className="font-medium">
            In this country, has the patient lived or worked in basic rural
            conditions?
          </p>
          <YesNo value={lassaExposure} onChange={setLassaExposure} />
        </div>

        <div>
          <p className="font-medium">
            In this country, has the patient visited caves/mines, or had contact
            with primates, antelopes or bats (or eaten their raw/undercooked
            meat)?
          </p>
          <YesNo value={ebolaMarburgExposure} onChange={setEbolaMarburgExposure} />
        </div>

        <div>
          <p className="font-medium">
            In this country, has the patient sustained a tick bite or crushed a
            tick with their bare hands OR had close involvement with animal
            slaughter?
          </p>
          <YesNo value={cchfExposure} onChange={setCchfExposure} />
        </div>
      </div>

      {/* Outcomes */}
      {allExposureNo && (
        <DecisionCard tone="amber" title="Minimal risk of VHF">
          <ul className="list-disc pl-5">
            <li>Urgent Malaria investigation</li>
            <li>
              Urgent local investigations as normally appropriate, including
              blood cultures.
            </li>
          </ul>
        </DecisionCard>
      )}

      {anyExposureYes && (
        <DecisionCard tone="red" title="AT RISK OF VHF">
          <ul className="list-disc pl-5">
            <li>ISOLATE PATIENT IN SIDE ROOM</li>
            <li>
              Discuss with infection consultant (Infectious
              Disease/Microbiology/Virology)
            </li>
            <li>Urgent Malaria investigation</li>
            <li>
              Full blood count, U&amp;Es, LFTs, clotting screen, CRP, glucose,
              blood cultures
            </li>
            <li>
              Inform laboratory of possible VHF case (for specimen waste
              disposal purposes if confirmed)
            </li>
          </ul>
        </DecisionCard>
      )}

      {/* Amber / Red branches continue into malaria testing */}
      {(allExposureNo || anyExposureYes) && (
        <div className="space-y-4">
          <p className="font-medium">Is the malaria test result positive?</p>
          <YesNo value={malariaTest} onChange={setMalariaTest} />

          {malariaTest === "yes" && (
            <div className="space-y-4">
              <p className="font-medium">
                Has the patient returned from a VHF outbreak area?
              </p>
              <YesNo value={outbreakReturn} onChange={setOutbreakReturn} />

              {outbreakReturn === "no" && (
                <DecisionCard
                  tone="green"
                  title="Manage as Malaria; VHF unlikely"
                >
                  <p>
                    Continue routine malaria management. VHF unlikely unless
                    clinical concern persists.
                  </p>
                </DecisionCard>
              )}

              {outbreakReturn === "yes" && (
                <>
                  <DecisionCard
                    tone="amber"
                    title="Manage as Malaria, but consider dual infection with VHF"
                  />
                  <DecisionCard tone="red" title="Specialist advice required">
                    <ul className="list-disc pl-5">
                      <li>
                        Discuss with Infection Consultant (Infectious
                        Disease/Microbiology/Virology)
                      </li>
                      <li>
                        Infection Consultant to discuss VHF test with Imported
                        Fever Service (0844 7788990)
                      </li>
                      <li>
                        If VHF testing agreed with IFS, notify local Health
                        Protection Team
                      </li>
                      <li>Consider empiric antimicrobials</li>
                    </ul>
                  </DecisionCard>
                </>
              )}
            </div>
          )}

          {malariaTest === "no" && (
            <div className="space-y-4">
              <p className="font-medium">Alternative diagnosis established?</p>
              <YesNo value={altDiagnosis} onChange={setAltDiagnosis} />

              {altDiagnosis === "yes" && (
                <DecisionCard tone="green" title="VHF unlikely; manage locally">
                  <p>Continue local management as appropriate.</p>
                </DecisionCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* Clinical concern & further red pathway */}
      {(malariaTest === "yes" && outbreakReturn === "no") ||
      (malariaTest === "no" && altDiagnosis === "no") ? (
        <div className="space-y-4">
          <p className="font-medium">
            Clinical concern OR no improvement after 72 hours?
          </p>
          <YesNo value={bleeding} onChange={setBleeding} />

          {bleeding === "no" && (
            <DecisionCard tone="green" title="VHF unlikely; manage locally">
              <p>Continue local management as appropriate.</p>
            </DecisionCard>
          )}

          {bleeding === "yes" && (
            <DecisionCard tone="red" title="Admit">
              <p>Proceed to admit the patient for further management.</p>
            </DecisionCard>
          )}
        </div>
      ) : null}

      {/* VHF Test Result Pathway */}
      {(bleeding === "yes" || outpatient === "yes") && (
        <div className="space-y-4">
          <p className="font-medium">VHF test result positive?</p>
          <YesNo value={vhfResult} onChange={setVhfResult} />

          {vhfResult === "yes" && (
            <DecisionCard tone="red" title="CONFIRMED VHF">
              <ul className="list-disc pl-5">
                <li>
                  Contact NHSE EPRR (020 8168 0053) to arrange transfer to HLIU
                </li>
                <li>
                  Launch full public health actions including categorisation and
                  management of contacts
                </li>
              </ul>
            </DecisionCard>
          )}

          {vhfResult === "no" && (
            <DecisionCard tone="green" title="VHF unlikely; manage locally">
              <p>Continue local management as appropriate.</p>
            </DecisionCard>
          )}
        </div>
      )}

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
      >
        Reset assessment
      </button>
    </div>
  );
}

// Simple Yes/No buttons
function YesNo({ value, onChange }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
      <button
        type="button"
        onClick={() => onChange("yes")}
        className={`px-4 py-2 text-sm font-medium ${
          value === "yes"
            ? "bg-violet-600 text-white"
            : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange("no")}
        className={`px-4 py-2 text-sm font-medium border-l border-slate-300 dark:border-slate-700 ${
          value === "no"
            ? "bg-violet-600 text-white"
            : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
        }`}
      >
        No
      </button>
    </div>
  );
}
