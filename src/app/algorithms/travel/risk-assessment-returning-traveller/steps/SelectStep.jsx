"use client";

import { useEffect, useMemo } from "react";
import DecisionCard from "@/components/DecisionCard";
import { vhfCountryNames } from "@/data/vhfCountries";
// Import the shared normalizer
import { normalizeName } from "@/utils/names"; 

// ---- THEME HELPERS ----
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 " +
  "text-sm font-medium text-white " +
  "bg-[hsl(var(--brand))] dark:bg-[hsl(var(--accent))] hover:brightness-95 " +
  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--brand))]/70 " +
  "disabled:opacity-50 disabled:cursor-not-allowed transition";

const btnSecondary =
  "rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 " +
  "hover:border-[hsl(var(--brand))] dark:hover:border-[hsl(var(--accent))]";

// -----------------------

const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);

const sortByLeaving = (arr) =>
  [...arr].sort((a, b) => {
    const ta = a.leaving ? new Date(a.leaving).getTime() : 0;
    const tb = b.leaving ? new Date(b.leaving).getTime() : 0;
    return ta - tb;
  });

function validateNoOverlap(rows) {
  const sorted = sortByLeaving(rows);
  for (let i = 0; i < sorted.length - 1; i++) {
    const leave = sorted[i].leaving && new Date(sorted[i].leaving).getTime();
    const arrive = sorted[i + 1].arrival && new Date(sorted[i + 1].arrival).getTime();
    if (leave && arrive && leave > arrive) return false;
  }
  return true;
}

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
  // Use normalizeName here to match the rest of the app
  const filtered = useMemo(() => {
    const q = normalizeName(query); 
    if (!q) return [];
    const out = [];
    for (const name of vhfCountryNames) {
      if (normalizeName(name).includes(q)) {
        out.push(name);
        if (out.length >= 12) break;
      }
    }
    return out;
  }, [query]);

  useEffect(() => {
    if (showInput) setTimeout(() => inputRef?.current?.focus(), 0);
  }, [showInput, inputRef]);

  const addCountry = (name) => {
    if (!name) return;
    setSelected((prev) => sortByLeaving([...prev, { id: uid(), name, arrival: "", leaving: "" }]));
    setQuery("");
    setOpen(false);
    setShowInput(false);
  };

  const addAnother = () => {
    setShowInput(true);
    setQuery("");
    setOpen(false);
    setTimeout(() => inputRef?.current?.focus(), 0);
  };

  const updateDates = (id, field, value) => {
    setSelected((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        if (field === "arrival") {
          const leavingOk =
            c.leaving && value && new Date(value) > new Date(c.leaving) ? "" : c.leaving || "";
          return { ...c, arrival: value, leaving: leavingOk };
        }
        if (field === "leaving") {
          let newLeaving = value;
          if (c.arrival && value && new Date(value) < new Date(c.arrival)) {
            newLeaving = c.arrival;
          }
          return { ...c, leaving: newLeaving };
        }
        return c;
      });
      return sortByLeaving(next);
    });
  };

  const removeRow = (id) => {
    setSelected((prev) => prev.filter((c) => c.id !== id));
    if (selected.length <= 1) {
      setShowInput(true);
    }
  };

  const allDatesFilled = selected.every((c) => c.arrival && c.leaving);
  const noOverlap = validateNoOverlap(selected);
  const canContinue = selected.length > 0 && allDatesFilled && onset && noOverlap;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Country / countries of travel
      </h2>

      {!showInput && (
        <button
          type="button"
          onClick={addAnother}
          className={btnSecondary}
        >
          + Add another country
        </button>
      )}

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
          {open && query && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow">
              <ul className="max-h-64 overflow-auto">
                {filtered.length > 0 ? (
                  filtered.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addCountry(name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {name}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {selected.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No countries added yet. Use the search box above to add your first country.
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
                    max={c.leaving || todayISO()}
                    onChange={(e) => updateDates(c.id, "arrival", e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-sm dark:bg-slate-950"
                  />
                </label>

                <label className="text-sm">
                  Leaving
                  <input
                    type="date"
                    value={c.leaving}
                    min={c.arrival || undefined}
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

      <div>
        <label className="block text-sm font-medium mb-1">Date of symptom onset</label>
        <input
          type="date"
          value={onset}
          max={todayISO()}
          onChange={(e) => setOnset(e.target.value)}
          className="rounded-md border-2 border-slate-300 dark:border-slate-700 px-3 py-2 text-sm dark:bg-slate-950"
        />
      </div>

      {!noOverlap && (
        <DecisionCard tone="red" title="Invalid dates">
          <p>
            Overlapping dates detected. Adjust arrival/leaving dates. Same-day transfer is allowed.
          </p>
        </DecisionCard>
      )}
      {selected.length > 0 && !allDatesFilled && (
        <DecisionCard tone="red" title="Missing dates">
          <p>Please enter arrival and leaving dates for each country.</p>
        </DecisionCard>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBackToScreen}
          className={btnSecondary}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onReset}
          className={btnSecondary}
        >
          Reset
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={btnPrimary}
          title={
            canContinue
              ? "Continue"
              : "Add at least one country, fill arrival & leaving dates for each, and set symptom onset"
          }
        >
          Continue
        </button>
      </div>
    </div>
  );
}
