// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/TravelStep.jsx
"use client";

import { useMemo } from "react";

/**
 * Minimal TravelStep stub to unblock the build.
 * - Shows a basic list of selected countries (if any).
 * - Lets the user set a symptom onset date.
 * - Provides Back / Continue buttons.
 * You can replace this with your full-featured version later.
 */
export default function TravelStep({
  selected = [],
  setSelected,
  onset = "",
  setOnset,
  onBack,
  onNext,
}) {
  // Simple add-country helper (for now, adds a placeholder; replace with your real picker)
  const addExample = () => {
    const name = prompt("Enter country name (temporary input):");
    if (!name) return;
    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    const leaving = iso(today);
    const arrival = iso(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)); // 3 days earlier
    setSelected((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 9), name, arrival, leaving },
    ]);
  };

  const canContinue = useMemo(() => {
    return onset && selected.length > 0;
  }, [onset, selected.length]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Travel details
      </h2>

      {/* Onset date */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Date of symptom onset
        </label>
        <input
          type="date"
          value={onset}
          onChange={(e) => setOnset(e.target.value)}
          className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
        />
        <p className="mt-1 text-xs text-slate-500">
          This is needed to calculate the 21‑day window.
        </p>
      </div>

      {/* Selected countries (temporary, until your real picker is wired) */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Country / countries of travel</label>
          <button
            type="button"
            onClick={addExample}
            className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-2 py-1 text-sm hover:border-violet-500"
          >
            + Add country (temp)
          </button>
        </div>

        {selected.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            No countries added yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {selected.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-2"
              >
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {c.arrival} → {c.leaving}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-violet-500"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            canContinue
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
          title={!canContinue ? "Add onset date and at least one country" : "Continue"}
        >
          Continue
        </button>
      </div>

      <p className="text-xs text-slate-500">
        This is a minimal placeholder for the Travel step to fix the build. Replace
        with your full travel selector when ready.
      </p>
    </div>
  );
}
