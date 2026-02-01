// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ScreeningStep.jsx
"use client";

import DecisionCard from "@/components/DecisionCard";

// --- THEME CONSTANTS ---
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 " +
  "text-sm font-bold font-mono tracking-wide text-white uppercase " +
  "bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition-all";

const btnSecondary =
  "rounded-lg px-4 py-2 border border-neutral-800 bg-neutral-900 text-neutral-400 " +
  "hover:text-white hover:border-neutral-600 text-xs font-bold font-mono uppercase tracking-wide transition-all";

const yesNoBtn = (active) =>
  "px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded border transition-all " +
  (active
    ? "bg-red-600 border-red-600 text-white shadow-lg"
    : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300");

export default function ScreeningStep({
  q1Fever, setQ1Fever,
  q2Exposure, setQ2Exposure,
  onContinue,
  onReset,
  onEscalateToSummary,
}) {
  const q2Available = q1Fever === "yes";
  const showGreen = q1Fever === "no";
  const showRed = q1Fever === "yes" && q2Exposure === "yes";
  const canProceed = q1Fever === "yes" && q2Exposure === "no";

  return (
    <div className="space-y-6">
      {/* Q1 */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6">
        <div className="mb-4 text-sm font-medium text-neutral-200">
          Does the patient have an illness with a history of feverishness?
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setQ1Fever("yes")} className={yesNoBtn(q1Fever === "yes")}>
            Yes
          </button>
          <button type="button" onClick={() => { setQ1Fever("no"); setQ2Exposure(""); }} className={yesNoBtn(q1Fever === "no")}>
            No
          </button>
        </div>
      </div>

      {/* Q2 */}
      {q2Available && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="mb-4 text-sm font-medium text-neutral-200">
            Has the patient cared for / come into contact with body fluids of / handled clinical
            specimens from an individual or laboratory animal known or strongly suspected to have
            VHF within the past 21 days?
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setQ2Exposure("yes")} className={yesNoBtn(q2Exposure === "yes")}>
              Yes
            </button>
            <button type="button" onClick={() => setQ2Exposure("no")} className={yesNoBtn(q2Exposure === "no")}>
              No
            </button>
          </div>
        </div>
      )}

      {/* Decision Blocks */}
      {showGreen && (
        <div className="opacity-80">
          <DecisionCard tone="green" title="VHF unlikely; manage locally">
            <p className="text-neutral-400">Please continue standard local management pathways.</p>
          </DecisionCard>
        </div>
      )}

      {showRed && (
        <>
          <DecisionCard tone="red" title="AT RISK OF VHF">
            <ul className="list-disc pl-5 space-y-1 text-neutral-300">
              <li><strong className="text-white">ISOLATE PATIENT IN SIDE ROOM</strong></li>
              <li>Discuss with Infection Consultant (Infectious Disease/Microbiology/Virology)</li>
              <li>Urgent Malaria investigation</li>
              <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
              <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
            </ul>
          </DecisionCard>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onEscalateToSummary} className={btnPrimary}>
              Next steps
            </button>
          </div>
        </>
      )}

      {/* Normal Controls */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-800">
        <button type="button" onClick={onContinue} disabled={!canProceed} className={btnPrimary}>
          Continue to Travel Details
        </button>

        <button type="button" onClick={() => { setQ1Fever(""); setQ2Exposure(""); }} className={btnSecondary}>
          Edit Answers
        </button>

        <button type="button" onClick={onReset} className={btnSecondary}>
          Reset
        </button>
      </div>
    </div>
  );
}
