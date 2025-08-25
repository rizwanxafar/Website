// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/SelectStep.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import DecisionCard from "@/components/DecisionCard";

const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const sortByLeaving = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.leaving ? new Date(a.leaving).getTime() : 0;
    const tb = b.leaving ? new Date(b.leaving).getTime() : 0;
    return ta - tb;
  });

// Validate no overlaps; same-day handover allowed
function validateNoOverlap(rows) {
  const sorted = sortByLeaving(rows);
  for (let i = 0; i < sorted.length - 1; i++) {
    const leave = sorted[i].leaving && new Date(sorted[i].leaving).getTime();
    const arrive = sorted[i + 1].arrival && new Date(sorted[i + 1].arrival).getTime();
    if (leave && arrive && leave > arrive) return false; // same-day (=) is allowed
  }
  return true;
}

export default function SelectStep({
  map, // raw HCID object { Country: [...] }
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

  // Build the country list from the snapshot/map
  const allCountries = useMemo(() => {
    if (!map || typeof map !== "object") return [];
    return Object.keys(map).sort((a, b) => a.localeCompare(b));
  }, [map]);

  const selectedNames = useMemo(
    () => new Set(selected.map((c) => normalize(c.name))),
    [selected]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const out = [];
    for (const name of allCountries) {
      const n = normalize(name);
      if (n.includes(q)) {
        out.push({
          name,
          disabled: selectedNames.has(n), // disable if already selected (still allow duplicates later via +Add Another if you want)
        });
        if (out.length >= 12) break; // cap suggestions
      }
    }
    return out;
  }, [allCountries, query, selectedNames]);

  // Focus input when we reveal it
  useEffect(() => {
    if (showInput) setTimeout(() => inputRef?.current?.focus(), 0);
  }, [showInput, inputRef]);

  // Add country (one instance)
  const addCountry = (name) => {
    if (!name) return;
    setSelected((prev) =>
      sortByLeaving([...prev, { id: uid(), name, arrival: "", leaving: "" }])
    );
    setQuery("");
    setOpen(false);
    setShowInput(false); // hide input after a pick (matches your earlier behaviour)
  };

  // Toggle input for adding more
  const handleAddAnother = () => {
    setShowInput(true);
    setOpen(false);
    setQuery("");
  };

  // Update dates + keep list sorted by leaving
  const updateDates = (id, field, value) => {
    const cleaned = value; // trust browser date input
    setSelected((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, [field]: cleaned } : c));
      return sortByLeaving(next);
    });
  };

  // Remove a row
  const removeRow = (id) => {
    setSelected((prev) => prev.filter((c) => c.id !== id));
  };

  // Validation: require dates for all rows, no future dates enforced by input max, no overlaps, onset set
  const allDatesFilled = selected.every((c) => c.arrival && c.leaving);
  const noOverlap = validateNoOverlap(selected);
  const canContinue = selected.length > 0 && allDatesFilled && onset && noOverlap;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Country / countries of travel
      </h2>

      {/* Add another country button (shows after first pick) */}
      {!showInput && (
        <div>
          <button
            type="button"
            onClick={handleAddAnother}
            className="rounded-md border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:border-violet-500"
          >
            + Add another country
          </button>
        </div>
      )}

      {/* Searchable dropdown input */}
      {showInput && (
        <div className="relative max-w-xl">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Start typing a country name…"
            className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
          />
          {open && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow">
              <ul className="max-h-64 overflow-auto">
                {filtered.map((opt) => (
                  <li key={opt.name}>
                    <button
                      type="button"
                      disabled={opt.disabled}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addCountry(opt.name)}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        opt.disabled
                          ? "text-slate-400 cursor-not-allowed"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      title={opt.disabled ? "Already selected" : ""}
                    >
                      {opt.name}
                      {opt.disabled && " — already added"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Selected list with dates */}
      <div className="space-y-4">
        {selected.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No countries added yet.
          </p>
        ) : (
          selected.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">{c.name}</div>
                <button
                  type="button"
                  onClick={() => removeRow(c.id)}
                  className="rounded-md border-2 border-slate-300 dark:border-slate-700 px-2 py-1 text-xs hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
                >
                  Remove
                </button>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-sm">
                  Arrival
                  <input
                    type="date"
                    value={c.arrival}
                    max={todayISO()}
                    onChange={(e) => updateDates(c.id, "arrival", e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-sm dark:bg-slate-950"
                  />
                </label>

                <label className="text-sm">
                  Leaving
                  <input
                    type="date"
                    value={c.leaving}
                    max={todayISO()}
                    onChange={(e) => updateDates(c.id, "leaving", e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-sm dark:bg-slate-950"
                  />
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Onset date */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Date of symptom onset
        </label>
        <input
          type="date"
          value={onset}
          max={todayISO()}
          onChange={(e) => setOnset(e.target.value)}
          className="rounded-md border-2 border-slate-300 dark:border-slate-700 px-3 py-2 text-sm dark:bg-slate-950"
        />
      </div>

      {/* Warnings */}
      {!noOverlap && (
        <DecisionCard tone="amber" title="Invalid dates">
          <p>
            Overlapping dates detected. Adjust arrival/leaving dates. Same‑day transfer is allowed.
          </p>
        </DecisionCard>
      )}
      {selected.length > 0 && !allDatesFilled && (
        <DecisionCard tone="amber" title="Missing dates">
          <p>Please enter arrival and leaving dates for each country.</p>
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
          title={!canContinue ? "Add dates for all countries and a symptom onset date" : "Continue"}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
