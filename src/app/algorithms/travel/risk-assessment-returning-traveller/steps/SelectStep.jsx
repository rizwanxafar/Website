// src/app/algorithms/travel/risk-assessment-returning-traveller/steps/SelectStep.jsx
"use client";

import { useState } from "react";
import { vhfCountryNames } from "@/data/vhfCountries"; // ✅ use static clean list

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
  const [arrival, setArrival] = useState("");
  const [leaving, setLeaving] = useState("");

  // Filter list by query
  const filteredCountries = vhfCountryNames.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  const addCountry = (name) => {
    if (!name) return;
    setSelected([
      ...selected,
      {
        id: Math.random().toString(36).slice(2),
        name,
        arrival: arrival || "",
        leaving: leaving || "",
      },
    ]);
    setQuery("");
    setArrival("");
    setLeaving("");
    setShowInput(false);
  };

  const removeCountry = (id) => {
    setSelected(selected.filter((c) => c.id !== id));
    if (selected.length <= 1) setShowInput(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Country / countries of travel
      </h2>

      {/* Country picker */}
      {showInput && (
        <div className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search for a country..."
            className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-2"
          />
          {open && query && (
            <ul className="max-h-40 overflow-y-auto rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
              {filteredCountries.map((c) => (
                <li
                  key={c}
                  onClick={() => addCountry(c)}
                  className="cursor-pointer px-3 py-2 hover:bg-violet-100 dark:hover:bg-violet-800"
                >
                  {c}
                </li>
              ))}
              {filteredCountries.length === 0 && (
                <li className="px-3 py-2 text-slate-500">No matches</li>
              )}
            </ul>
          )}

          {/* Travel dates */}
          <div className="flex gap-3">
            <div>
              <label className="block text-sm">Arrival date</label>
              <input
                type="date"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm">Leaving date</label>
              <input
                type="date"
                value={leaving}
                onChange={(e) => setLeaving(e.target.value)}
                className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Selected list */}
      {selected.length > 0 && (
        <div className="space-y-3">
          {selected.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border-2 border-slate-300 dark:border-slate-700 p-3"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {c.arrival || "?"} → {c.leaving || "?"}
                </div>
              </div>
              <button
                onClick={() => removeCountry(c.id)}
                className="rounded-lg border-2 border-rose-400 px-2 py-1 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-2 hover:border-violet-500"
          >
            + Add another country
          </button>
        </div>
      )}

      {/* Symptom onset */}
      <div>
        <label className="block text-sm">Date of symptom onset</label>
        <input
          type="date"
          value={onset}
          onChange={(e) => setOnset(e.target.value)}
          className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-3 py-2"
        />
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBackToScreen}
          className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-4 py-2"
        >
          Back
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border-2 border-slate-300 dark:border-slate-700 px-4 py-2"
        >
          Reset
        </button>
        <button
          onClick={onContinue}
          disabled={selected.length === 0 || !onset}
          className={`rounded-lg px-4 py-2 ${
            selected.length > 0 && onset
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
