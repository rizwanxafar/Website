"use client";

import DecisionCard from "@/components/DecisionCard";
import { clsx } from "clsx";

const btnPrimary =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:opacity-90 text-white text-sm font-semibold " +
  "transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";

const btnSecondary =
  "px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 " +
  "hover:border-slate-400 text-sm font-medium transition-colors";

const yesNoBtn = (active) =>
  clsx(
    "px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors",
    active
      ? "bg-slate-800 border-slate-800 text-white"
      : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
  );

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
    <div className="space-y-4">
      {/* Q1 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-800 mb-4 leading-relaxed">
          Does the patient have an illness with a history of feverishness?
        </p>
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-medium text-slate-800 mb-4 leading-relaxed">
            Has the patient cared for / come into contact with body fluids of / handled clinical
            specimens from an individual or laboratory animal known or strongly suspected to have
            VHF within the past 21 days?
          </p>
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
        <DecisionCard tone="green" title="VHF unlikely — manage locally">
          <p>Please continue standard local management pathways.</p>
        </DecisionCard>
      )}

      {showRed && (
        <>
          <DecisionCard tone="red" title="At risk of VHF">
            <ul className="list-disc pl-4 space-y-1.5">
              <li><strong>Isolate patient in side room immediately</strong></li>
              <li>Discuss with Infection Consultant (Infectious Disease / Microbiology / Virology)</li>
              <li>Urgent malaria investigation</li>
              <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
              <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
            </ul>
          </DecisionCard>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onEscalateToSummary} className={btnPrimary}>
              Next steps
            </button>
          </div>
        </>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
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
