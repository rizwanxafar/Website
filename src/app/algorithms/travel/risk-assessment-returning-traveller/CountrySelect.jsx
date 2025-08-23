// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { vhfCountryNames } from "../../../../data/vhfCountries";

// simple ISO date overlap check (YYYY-MM-DD strings compare lexicographically)
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return !(aEnd < bStart || bEnd < aStart); // overlap if not strictly apart
}

export default function CountrySelect() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(true); // hide input after first add
  const inputRef = useRef(null);

  // Selected countries with dates
  // { name: string, arrival: "YYYY-MM-DD"|"", leaving: "YYYY-MM-DD"|"" }
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
    const already = selected.some((c) => c.name.toLowerCase() === name.toLowerCase());
    if (already) return;

    setSelected((prev) => [...prev, { name, arrival: "", leaving: "" }]);
    setQuery("");
    setOpen(false);
    setShowInput(false); // hide after first successful add
  };

  const removeCountry = (name) => {
    setSelected((prev) => prev.filter((c) => c.name !== name));
  };

  const updateDate = (name, field, value) => {
    setSelected((prev) =>
      prev.map((c) => (c.name === name ? { ...c, [field]: value } : c))
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

  // Detect overlaps across all selected countries
  const conflictNames = useMemo(() => {
    const conflicts = new Set();
    for (let i = 0; i < selected.length; i++) {
      const a = selected[i];
      if (countryValidity(a) !== "ok") continue;
      for (let j = i + 1; j < selected.length; j++) {
        const b = selected[j];
        if (countryValidity(b) !== "ok") continue;
        if (rangesOverlap(a.arrival, a.leaving, b.arrival, b.leaving)) {
          conflicts.add(a.name);
          conflicts.add(b.name);
        }
      }
    }
    return conflicts;
  }, [selected]);

  const allValidNonOverlapping =
    selected.length > 0 &&
    selected.every((c) => countryValidity(c) === "ok") &&
    conflictNames.size === 0;

  return (
    <div className="space-y-5">
      {/* Selected countries: chip row */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((c) => (
            <span
              key={c.name}
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 dark:border-slate-700 px-3 py-1 text-sm text-slate-900 dark:text-slate-100"
            >
              {c.name}
              <button
                type="button"
                className="rounded-md px-1.5 py-0.5 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400"
                aria-label={`Remove ${c.name}`}
                onClick={() => removeCountry(c.name)}
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

      {/* Per-country date pickers */}
      {selected.length > 0 && (
        <div className="space-y-4">
          {selected.map((c) => {
            const validity = countryValidity(c);
            const showWarn = validity !== "ok" || conflictNames.has(c.name);
            const warnText =
              validity === "invalid-range"
                ? "Leaving date must be the same as or after the arrival date."
                : validity === "incomplete"
                ? "Please choose both arrival and leaving dates."
                : "These dates overlap with another country. Adjust to avoid overlap.";

            const hasConflict = conflictNames.has(c.name);

            return (
              <div
                key={`${c.name}-dates`}
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
                      onChange={(e) => updateDate(c.name, "arrival", e.target.value)}
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
                      onChange={(e) => updateDate(c.name, "leaving", e.target.value)}
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

      {/* Continue button enabled only when all ranges valid AND no overlaps */}
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
