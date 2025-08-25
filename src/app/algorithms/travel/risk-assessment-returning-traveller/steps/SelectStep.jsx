"use client";

import { useState } from "react";
import DecisionCard from "@/components/DecisionCard";

// Helper: generate unique id
const uid = () => Math.random().toString(36).slice(2, 9);

// Helper: sort by leaving date
const sortByLeaving = (arr) =>
  [...arr].sort(
    (a, b) => new Date(a.leaving).getTime() - new Date(b.leaving).getTime()
  );

export default function SelectStep({
  selected,
  setSelected,
  onset,
  setOnset,
  query,
  setQuery,
  open,
  setOpen,
  showInput,
  setShowInput,
  inputRef,
  onBackToScreen,
  onReset,
  onContinue,
}) {
  const [error, setError] = useState("");

  // Add country
  const addCountry = (name) => {
    if (!name) return;
    setSelected([...selected, { id: uid(), name, arrival: "", leaving: "" }]);
    setQuery("");
    setOpen(false);
    setShowInput(false);
  };

  // Update travel dates
  const updateDates = (id, field, value) => {
    const updated = selected.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    );
    setSelected(sortByLeaving(updated));
  };

  // Validate overlaps (allow same-day arrival/leaving)
  const validateOverlap = () => {
    for (let i = 0; i < selected.length - 1; i++) {
      const leave = new Date(selected[i].leaving);
      const arrive = new Date(selected[i + 1].arrival);
      if (leave.getTime() > arrive.getTime()) {
        return false;
      }
    }
    return true;
  };

  const canContinue =
    selected.length > 0 && onset && validateOverlap();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Country / countries of travel
      </h2>

      {/* Country input */}
      {showInput && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter country name"
            className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm dark:bg-slate-950"
          />
          <button
            type="button"
            onClick={() => addCountry(query.trim())}
            className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Add
          </button>
        </div>
      )}

      {/* Selected countries */}
      <div className="space-y-4">
        {selected.map((c) => (
          <div
            key={c.id}
            className="rounded-lg border border-slate-300 dark:border-slate-700 p-4"
          >
            <div className="font-medium">{c.name}</div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-sm">
                Arrival:{" "}
                <input
                  type="date"
                  value={c.arrival}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => updateDates(c.id, "arrival", e.target.value)}
                  className="rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-sm dark:bg-slate-950"
                />
              </label>
              <label className="text-sm">
                Leaving:{" "}
                <input
                  type="date"
                  value={c.leaving}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => updateDates(c.id, "leaving", e.target.value)}
                  className="rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-sm dark:bg-slate-950"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Symptom onset */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Date of symptom onset
        </label>
        <input
          type="date"
          value={onset}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) => setOnset(e.target.value)}
          className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm dark:bg-slate-950"
        />
      </div>

      {/* Error if overlaps */}
      {!validateOverlap() && (
        <DecisionCard tone="amber" title="Invalid dates">
          <p>
            Overlapping dates detected. Please adjust arrival/leaving dates.  
            Same-day arrival/leaving is allowed.
          </p>
        </DecisionCard>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackToScreen}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-400"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
        >
          Reset
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={`rounded-lg px-4 py-2 ${
            canContinue
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
