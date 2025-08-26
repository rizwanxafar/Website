// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/ScreeningStep.jsx
"use client";

import DecisionCard from "@/components/DecisionCard";

export default function ScreeningStep({
  q1Fever, setQ1Fever,
  q2Exposure, setQ2Exposure,
  onContinue,
  onReset,
}) {
  const q2Available = q1Fever === "yes";           // Only ask Q2 if Q1 is yes
  const showGreen   = q1Fever === "no";            // Q1 No -> green
  const showRed     = q1Fever === "yes" && q2Exposure === "yes";
  const canProceed  = q1Fever === "yes" && q2Exposure === "no";

  return (
    <div className="space-y-6">
      {/* Trial / confidentiality banner */}
      <div className="rounded-md border border-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-200">
        This is an early trial version. Do <strong>not</strong> enter private or confidential
        patient information. Clinical responsibility for the assessment and decisions remains
        with the user.
      </div>

      {/* Q1 */}
      <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
        <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          Does the patient have an illness with a history of feverishness?
        </div>

        <div className="inline-flex overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700" role="group" aria-label="Feverishness">
          <button
            type="button"
            onClick={() => setQ1Fever("yes")}
            className={`px-4 py-2 text-sm font-medium ${
              q1Fever === "yes"
                ? "bg-violet-600 text-white"
                : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => { setQ1Fever("no"); setQ2Exposure(""); }}
            className={`px-4 py-2 text-sm font-medium border-l-2 border-slate-300 dark:border-slate-700 ${
              q1Fever === "no"
                ? "bg-violet-600 text-white"
                : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            }`}
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

          <div className="inline-flex overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700" role="group" aria-label="High-risk exposure">
            <button
              type="button"
              onClick={() => setQ2Exposure("yes")}
              className={`px-4 py-2 text-sm font-medium ${
                q2Exposure === "yes"
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setQ2Exposure("no")}
              className={`px-4 py-2 text-sm font-medium border-l-2 border-slate-300 dark:border-slate-700 ${
                q2Exposure === "no"
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
              }`}
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
        <DecisionCard tone="red" title="AT RISK OF VHF">
          <ul className="list-disc pl-5">
            <li>ISOLATE PATIENT IN SIDE ROOM</li>
            <li>Discuss with infection consultant (Infectious Disease/Microbiology/Virology)</li>
            <li>Urgent Malaria investigation</li>
            <li>Full blood count, U&Es, LFTs, clotting screen, CRP, glucose, blood cultures</li>
            <li>Inform laboratory of possible VHF case (for specimen waste disposal if confirmed)</li>
          </ul>
        </DecisionCard>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canProceed}
          className={`rounded-lg px-4 py-2 ${
            canProceed
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          }`}
        >
          Continue to travel details
        </button>

        <button
          type="button"
          onClick={() => { setQ1Fever(""); setQ2Exposure(""); }}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400"
        >
          Back / Edit answers
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
        >
          Reset assessment
        </button>
      </div>
    </div>
  );
}
