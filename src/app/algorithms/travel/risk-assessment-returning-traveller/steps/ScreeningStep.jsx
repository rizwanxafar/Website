// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ScreeningStep.jsx
"use client";

import DecisionCard from "@/components/DecisionCard";

// Primary action (Continue/Next/Add/Save/Submit)
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 " +
  "text-sm font-medium text-white " +
  "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition";

// Secondary/outline button
const btnSecondary =
  "rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))]";

// Yes/No pill buttons use brand when active
const yesNoBtn = (active) =>
  "px-3 py-1.5 text-sm font-medium rounded-md border-2 " +
  (active
    ? "text-white border-[hsl(var(--brand))] bg-[hsl(var(--brand))] " +
      "dark:border-[hsl(var(--accent))] dark:bg-[hsl(var(--accent))]"
    : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 " +
      "border-slate-300 dark:border-slate-700");

export default function ScreeningStep({
  q1Fever, setQ1Fever,
  q2Exposure, setQ2Exposure,
  onContinue,            // proceed to Select
  onReset,
  onEscalateToSummary,   // optional: jump into red summary
}) {
  const q2Available = q1Fever === "yes";
  const showGreen = q1Fever === "no";
  const showRed = q1Fever === "yes" && q2Exposure === "yes";
  const canProceed = q1Fever === "yes" && q2Exposure === "no";

  return (
    <div className="space-y-6">
      {/* Q1 */}
      <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
        <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          Does the patient have an illness with a history of feverishness?
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setQ1Fever("yes")}
            className={yesNoBtn(q1Fever === "yes")}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => { setQ1Fever("no"); setQ2Exposure(""); }}
            className={yesNoBtn(q1Fever === "no")}
          >
            No
          </button>
        </div>
      </div>

      {/* Q2 (only if Q1 yes) */}
      {q2Available && (
        <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
          <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            Has the patient cared for / come into contact with body fluids of / handled clinical
            specimens from an individual or laboratory animal known or strongly suspected to have
            VHF within the past 21 days?
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setQ2Exposure("yes")}
              className={yesNoBtn(q2Exposure === "yes")}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setQ2Exposure("no")}
              className={yesNoBtn(q2Exposure === "no")}
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Decision blocks */}
      {showGreen && (
        <DecisionCard tone="green" title="VHF unlikely; manage locally">
          <p>Please continue standard local management pathways.</p>
        </DecisionCard>
      )}

      {showRed && (
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onEscalateToSummary}
              className={btnPrimary}
            >
              Next steps
            </button>
          </div>
        </>
      )}

      {/* Normal controls for the fever yes + exposure no path */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canProceed}
          className={btnPrimary}
        >
          Continue to travel details
        </button>

        <button
          type="button"
          onClick={() => { setQ1Fever(""); setQ2Exposure(""); }}
          className={btnSecondary}
        >
          Back / Edit answers
        </button>

        <button
          type="button"
          onClick={onReset}
          className={btnSecondary}
        >
          Reset assessment
        </button>
      </div>
    </div>
  );
}
