// src/app/algorithms/travel/risk-assessment-returning-traveller/CountrySelect.jsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { vhfCountryNames } from "@/data/vhfCountries";
import {
  todayISO,
  validateCountryRange,
  detectConflicts,
  sortSelected,
  daysSince,
} from "@/utils/travelDates";

// easy unique id for list items
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const STORAGE_KEY = "riskFormV1";

export default function CountrySelect() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(true); // hide input after first add
  const inputRef = useRef(null);

  // Selected countries with dates: { id, name, arrival, leaving }
  const [selected, setSelected] = useState([]);
  // Symptom onset date
  const [onset, setOnset] = useState("");

  // ---- Load from sessionStorage on first mount ----
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.selected)) {
          // Ensure items have ids (in case of older shape)
          const withIds = parsed.selected.map((c) => ({
            id: c.id || uid(),
            name: c.name,
            arrival: c.arrival || "",
            leaving: c.leaving || "",
          }));
          setSelected(withIds);
          setOnset(parsed.onset || "");
          // Hide input if we already have at least one country
          if (withIds.length > 0) setShowInput(false);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Persist to sessionStorage whenever state changes ----
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selected, onset })
      );
    } catch {
      // ignore
    }
  }, [selected, onset]);

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

    // If same country already exists, confirm duplicate (layover/multi-leg)
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

  // Validity per country & conflicts across countries
  const countryStatus = (c) => validateCountryRange(c.arrival, c.leaving, todayISO);
  const conflictIds = useMemo(() => detectConflicts(selected), [selected]);

  // Sort for display (earliest first; incomplete at end)
  const sortedSelected = useMemo(() => sortSelected(selected), [selected]);

  // Onset validity: required and not in the future
  const onsetValid = onset && onset <= todayISO;

  const allValidNonOverlapping =
    sortedSelected.length > 0 &&
    sortedSelected.every((c) => countryStatus(c) === "ok") &&
    conflictIds.size === 0 &&
    onsetValid;

  // Arrival/leaving max/min helpers to prevent future dates
  const arrivalMaxFor = (c) => (c.leaving ? (c.leaving < todayISO ? c.leaving : todayISO) : todayISO);
  const leavingMinFor = (c) => c.arrival || undefined;

  return (
    <div className="space-y-6">
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
            const status = countryStatus(c);
            const hasConflict = conflictIds.has(c.id);
            const showWarn = status !== "ok" || hasConflict;

            let warnText = "";
            if (status === "invalid-range") {
              warnText = "Leaving date must be the same as or after the arrival date.";
            } else if (status === "incomplete") {
              warnText = "Please choose both arrival and leaving dates.";
            } else if (status === "future-date") {
              warnText = "Dates cannot be in the future.";
            } else if (hasConflict) {
              warnText = "These dates overlap with another country. Adjust to avoid overlap.";
            }

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
                      max={arrivalMaxFor(c)}
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
                      min={leavingMinFor(c)}
                      max={todayISO}
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

      {/* Symptom onset date */}
      <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
        <div className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          Date of symptom onset
        </div>
        <div className="grid sm:grid-cols-[240px_1fr] gap-3 items-center">
          <input
            type="date"
            value={onset}
            onChange={(e) => setOnset(e.target.value)}
            className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
            max={todayISO}
          />
          {onset && (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {onset > todayISO
                ? "Onset cannot be in the future."
                : `Days since onset: ${daysSince(onset)}`}
            </div>
          )}
        </div>
        {onset && onset > todayISO && (
          <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">
            Onset date cannot be in the future.
          </p>
        )}
      </div>

      {/* Continue button enabled only when all ranges valid, no overlaps, and onset set & not future */}
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
              : "Ensure countries have valid, non-overlapping dates and symptom onset is set (not in the future)"
          }
        >
          Continue
        </button>
      </div>
    </div>
  );
}
