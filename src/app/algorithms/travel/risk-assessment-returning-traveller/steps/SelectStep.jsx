// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/SelectStep.jsx
"use client";

import { useMemo } from "react";
import CountryChips from "@/components/CountryChips";
import CountryInput from "@/components/CountryInput";
import DateRangeCard from "@/components/DateRangeCard";
import { vhfCountryNames } from "@/data/vhfCountries";
import {
  todayISO,
  validateCountryRange,
  detectConflicts,
  sortSelected,
  daysSince,
} from "@/utils/travelDates";

export default function SelectStep({
  // state + setters from useSessionForm
  selected, setSelected,
  onset, setOnset,
  query, setQuery,
  open, setOpen,
  showInput, setShowInput,
  inputRef,
  // actions
  onBackToScreen,   // () => void
  onReset,          // () => void
  onContinue,       // () => void
}) {
  const countryStatus = (c) => validateCountryRange(c.arrival, c.leaving, todayISO);

  const conflictIds = useMemo(() => detectConflicts(selected), [selected]);
  const sortedSelected = useMemo(() => sortSelected(selected), [selected]);

  const onsetValid = onset && onset <= todayISO;
  const canContinue =
    sortedSelected.length > 0 &&
    sortedSelected.every((c) => countryStatus(c) === "ok") &&
    conflictIds.size === 0 &&
    onsetValid;

  const addCountry = (nameRaw) => {
    const name = (nameRaw ?? query).trim();
    if (!name) return;
    if (!vhfCountryNames.includes(name)) return;
    const exists = selected.some((c) => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      const ok = window.confirm(
        `${name} is already in the list. Add it again (e.g., for a second visit or layover)?`
      );
      if (!ok) return;
    }
    setSelected((prev) => [...prev, { id: genId(), name, arrival: "", leaving: "" }]);
    setQuery("");
    setOpen(false);
    setShowInput(false);
  };

  const removeCountry = (id) => setSelected((prev) => prev.filter((c) => c.id !== id));
  const updateDate = (id, field, value) =>
    setSelected((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CountryChips items={sortedSelected} onRemove={removeCountry} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToScreen}
            className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-violet-500 dark:hover:border-violet-400"
            title="Back to screening"
          >
            ← Screening
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm font-medium hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
            title="Clear all countries and dates"
          >
            Reset assessment
          </button>
        </div>
      </div>

      {/* Heading for country input */}
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Country / countries of travel
      </h2>

      {/* Add country input */}
      {showInput ? (
        <CountryInput
          inputRef={inputRef}
          query={query}
          setQuery={setQuery}
          open={open}
          setOpen={setOpen}
          onAdd={addCountry}
        />
      ) : (
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

      {sortedSelected.length > 0 && (
        <div className="space-y-4">
          {sortedSelected.map((c) => {
            const status = countryStatus(c);
            const hasConflict = conflictIds.has(c.id);
            return (
              <DateRangeCard
                key={`card-${c.id}`}
                country={c}
                status={status}
                hasConflict={hasConflict}
                onChangeDate={updateDate}
              />
            );
          })}
        </div>
      )}

      {/* Symptom onset */}
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
              {onset > todayISO ? "Onset cannot be in the future." : `Days since onset: ${daysSince(onset)}`}
            </div>
          )}
        </div>
        {onset && onset > todayISO && (
          <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">Onset date cannot be in the future.</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={`rounded-lg px-4 py-2 ${
            canContinue
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          }`}
          title={
            canContinue
              ? "Review country-specific risk"
              : "Ensure countries have valid, non-overlapping dates and symptom onset is set (not in the future)"
          }
        >
          Continue
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 border-2 border-slate-300 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
          title="Clear all data"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
