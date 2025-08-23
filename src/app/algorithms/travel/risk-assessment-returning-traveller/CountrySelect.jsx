// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { vhfCountryNames } from "../../../../data/vhfCountries";

// simple ISO date overlap check (YYYY-MM-DD strings compare lexicographically)
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return !(aEnd < bStart || bEnd < aStart); // treat same-day touch as overlap
}

// easy unique id for list items
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function CountrySelect() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(true); // hide input after first add
  const inputRef = useRef(null);

  // Selected countries with dates
  // { id: string, name: string, arrival: "YYYY-MM-DD"|"", leaving: "YYYY-MM-DD"|"" }
  const [selected, setSelected] = useState([]);

  // Filtered suggestions
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vhfCountryNames;
    return vhfCountryNames.filter(
      (name) =>
        name.toLowerCase().startsWith(q) || name.toLowerCase().includes(q)
    );
  }, [query]);

  // Add from typed or clicked suggestion (restricted to UKHSA list)
  const addCountry = (nameRaw) => {
    const name = (nameRaw ?? query).trim();
    if (!name) return;
    if (!vhfCountryNames.includes(name)) return;

    // If the same country already exists, ask whether to add again (layover, multi-leg)
    const exists = selected.some((c) => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      const ok = window.confirm(
        `${name} is already in the list. Add it again (e.g., for a second visit or layover)?`
      );
      if (!ok) return;
    }

    setSelected((prev) => [...prev, { id: uid(), name, arrival: "", leaving: "" }]);
    setQuery("");
    setOpen(false);
    setShowInput(false); // hide after first successful add
  };

  const removeCountry = (id) => {
    setSelected((prev) => prev.filter((c) => c.id !== id));
  };

  const updateDate = (id, field, value) => {
    setSelected((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) addCountry(suggestions[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      const root = document.querySelector(".country-select-root");
      if (root && !root.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Per-country range validity
  const countryValidity = (c) => {
    if (!c.arrival || !c.leaving) return "incomplete";
    if (c.arrival > c.leaving) return "invalid-range";
    return "ok";
  };

  // Detect overlaps across all selected countries (by id)
  const conflictIds = useMemo(() => {
    const conflicts = new Set();
    for (let i = 0; i < selected.length; i++) {
      const a = selected[i];
      if (countryValidity(a) !== "ok") continue;
      for (let j = i + 1; j < selected.length; j++) {
        const b = selected[j];
        if (countryValidity(b) !== "ok") continue;
        if (rangesOverlap(a.arrival, a.leaving, b.arrival, b.leaving)) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
    return conflicts;
  }, [selected]);

  // Sort for display: earliest arrival first; incomplete/undated at the end
  const sortedSelected = useMemo(() => {
    const copy = [...selected];
    copy.sort((a, b) => {
      const aHas = a.arrival && a.leaving;
      const bHas = b.arrival && b.leaving;
      if (aHas && bHas) {
        // primary sort by arrival asc, tie-break by leaving asc, then name
        if (a.arrival !== b.arrival) return a.arrival < b.arrival ? -1 : 1;
        if (a.leaving !== b.leaving) return a.leaving < b.leaving ? -1 : 1;
        return a.name.localeCompare(b.name);
      }
      if (aHas && !bHas) return -1; // completed ranges above incomplete ones
      if (!aHas && bHas) return 1;
      // neither has dates — keep insertion order by name
      return a.name.localeCompare(b.name);
    });
    return copy;
  }, [selected]);

  const allValidNonOverlapping =
    sortedSelected.length > 0 &&
    sortedSelected.every((c) => countryValidity(c) === "ok") &&
    conflictIds.size === 0;

  return (
    <div className="space-y-5">
      {/* Selected countries: chip row (sorted) */}
      {sortedSelected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortedSelected.map((c) => (
            <span
              key={`chip-${c.id}`}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 dark:border-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100"
            >
              {c.name}
              <button
                type="button"
                className="rounded-md px-1.5 py-0.5 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400"
                aria-label={`Remove ${c.name}`}
                onClick={() => removeCountry(c.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add-country toggle once input is hidden */}
      {!showInput && (
        <div>
          <button
            type="button"
            onClick={() => {
              setShowInput(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 px-4 py-2 font-medium text-slate-900 dark:text-slate-100 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
          >
            + Add country
          </button>
        </div>
      )}

      {/* Searchable input (hidden after first add unless user clicks + Add country) */}
      {showInput && (
        <div className="country-select-root relative">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Country / countries of travel
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Start typing a country…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              className="flex-1 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="country-suggestions"
              aria-label="Country / countries of travel"
            />
            <button
              type="button"
              onClick={() => addCountry()}
              className="shrink-0 rounded-lg border-2 border-slate-300 dark:border-slate-700 px-4 py-2 font-medium text-slate-900 dark:text-slate-100 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
              aria-label="Add country"
            >
              Add
            </button>
          </div>

          {/* Suggestions dropdown */}
          {open && suggestions.length > 0 && (
            <ul
              id="country-suggestions"
              className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg"
              role="listbox"
            >
              {suggestions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => addCountry(name)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    role="option"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Per-country date pickers (sorted by date) */}
      {sortedSelected.length > 0 && (
        <div className="space-y-4">
          {sortedSelected.map((c) => {
            const validity = countryValidity(c);
            const hasConflict = conflictIds.has(c.id);
            const showWarn = validity !== "ok" || hasConflict;
            const warnText =
              validity === "invalid-range"
                ? "Leaving date must be the same as or after the arrival date."
                : validity === "incomplete"
                ? "Please choose both arrival and leaving dates."
                : "These dates overlap with another country. Adjust to avoid overlap.";

            return (
              <div
                key={`card-${c.id}`}
                className={`rounded-xl border-2 p-4 ${
                  hasConflict
                    ? "border-rose-500 dark:border-rose-500 bg-rose-50/40 dark:bg-rose-900/20"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                }`}
              >
                <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {c.name} — travel dates
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                      Arrival date
                    </label>
                    <input
                      type="date"
                      value={c.arrival}
                      onChange={(e) => updateDate(c.id, "arrival", e.target.value)}
                      className={`w-full rounded-lg border-2 px-3 py-2 focus:outline-none focus:ring-2 ${
                        hasConflict
                          ? "border-rose-400 dark:border-rose-500 focus:ring-rose-300"
                          : "border-slate-300 dark:border-slate-700 focus:ring-violet-400 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      }`}
                      max={c.leaving || undefined}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                      Leaving date
                    </label>
                    <input
                      type="date"
                      value={c.leaving}
                      onChange={(e) => updateDate(c.id, "leaving", e.target.value)}
                      className={`w-full rounded-lg border-2 px-3 py-2 focus:outline-none focus:ring-2 ${
                        hasConflict
                          ? "border-rose-400 dark:border-rose-500 focus:ring-rose-300"
                          : "border-slate-300 dark:border-slate-700 focus:ring-violet-400 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      }`}
                      min={c.arrival || undefined}
                    />
                  </div>
                </div>

                {showWarn && (
                  <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">
                    {warnText}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Continue button enabled only when all ranges valid, sorted, AND no overlaps */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!allValidNonOverlapping}
          className={`rounded-lg px-4 py-2 ${
            allValidNonOverlapping
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          }`}
          title={
            allValidNonOverlapping
              ? "Ready for next step"
              : "Ensure each country has valid dates and no overlaps"
          }
        >
          Continue
        </button>
      </div>
    </div>
  );
}
